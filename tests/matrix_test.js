#!/usr/bin/env node
// The board's theorem, machine-checked.
//
//   For every open PR in every state the blocker matrix can see, either
//     (a) somebody named owes a move — an author-side bucket, the admin bucket,
//         a reviewer task for at least one requested / reviewing login, or
//         red main's owner when the PR fails only main's steps — or
//     (b) the state is transient: CI in flight, review data still loading,
//         GitHub still computing mergeability — or
//     (c) the PR is parked as "do not merge", which dormant() ends after
//         DORMANT_DAYS.
//
// orphan() in board.js is that predicate; this file evaluates the matrix
// regions of board.js in node and runs orphan() over the whole state space,
// so a change to classify() / reviewerTask() that leaves a PR with nobody's
// move fails here instead of sitting in the queue forever. It also reports
// buckets the enumeration never reached (dead rules).
//
//   node tests/matrix_test.js        # exit 1 on any orphan
'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8').split('\n');
let code = '', inside = false;
for (const line of src) {
  if (line.includes('// @matrix-begin')) { inside = true; continue; }
  if (line.includes('// @matrix-end')) { inside = false; continue; }
  if (inside || line.includes('// @matrix-line')) code += line + '\n';
}
const M = new Function(code + '\nreturn { classify, reviewerTask, orphan, BUCKETS, REVIEWER_TASKS, STATUS, LIVE, statusOf, st, SILENT_DAYS, DORMANT_DAYS };')();

const DAY = 86400, T = Math.floor(Date.now() / 1000);
const PIPES = [null, 'success', 'failure', 'error', 'killed', 'canceled', 'skipped', 'declined', 'running', 'pending', 'blocked'];
const MERGE = [[undefined, undefined], [null, 'unknown'], [false, 'dirty'], ...['clean', 'behind', 'blocked', 'unstable', 'has_hooks'].map(s => [true, s])];
// A reviewer's latest review relative to `since` (the author's last move): old = before it, new = after it.
const REVIEW = [null, ['approved', 'old'], ['approved', 'new'], ['changes_requested', 'new'], ['changes_requested', 'old'], ['commented', 'old'], ['commented', 'new'], ['dismissed', 'new']];
const AUTHOR = 'author', R1 = 'r1', R2 = 'r2';

function* states() {
  for (const draft of [false, true]) for (const pipeStatus of PIPES) for (const stale of pipeStatus ? [false, true] : [false]) for (const dnm of [false, true])
  for (const mainRed of M.st(pipeStatus).bucket === 'red' ? [false, true] : [false]) {   // red on main's own failing steps; main's owner is the last merger
    const base = { number: 1, title: dnm ? 'DNM: thing' : 'thing', author: AUTHOR, draft, url: '', pipe: pipeStatus ? { number: 7, status: pipeStatus, commit: 'a' } : null, stale, updated: T - 3 * DAY, requested: [], mainRed, mainOwner: mainRed ? 'merger' : '' };
    yield { ...base, rv: undefined, mergeable: undefined };   // meta not loaded yet
    for (const dormant of [false, true]) for (const authorAfterPush of [false, true]) for (const feedbackNew of [false, true]) for (const askedOld of [false, true]) for (const openThreads of [0, 1]) for (const baseGone of [false, true]) for (const [mergeable, mergeState] of MERGE) {
      const lastPush = dormant ? T - (M.DORMANT_DAYS + 6) * DAY : T - 5 * DAY;
      const lastAuthorActivity = authorAfterPush ? lastPush + DAY : lastPush;
      const since = Math.max(lastPush, lastAuthorActivity);
      for (const rev1 of REVIEW) for (const req1 of [false, true]) for (const rev2 of REVIEW) for (const req2 of [false, true]) {
        if (!rev1 && !req1 && (rev2 || req2)) continue;   // r2 only exists on top of r1: halves the symmetric half
        const rv = { loaded: true, lastPush, lastFeedback: 0, lastAuthorActivity, readySince: lastPush, requestedAt: {}, reviews: {}, avatars: {}, approved: false, changesRequested: false, threads: openThreads, openThreads, openList: [] };
        const requested = [];
        for (const [login, rev, req] of [[R1, rev1, req1], [R2, rev2, req2]]) {
          if (req) { requested.push(login); rv.requestedAt[login] = askedOld ? T - (M.SILENT_DAYS + 3) * DAY : T - DAY; }
          if (rev) { const at = rev[1] === 'old' ? since - DAY : since + DAY; rv.reviews[login] = { state: rev[0], at, stateAt: at }; rv.lastFeedback = Math.max(rv.lastFeedback, at); }
        }
        if (feedbackNew) rv.lastFeedback = Math.max(rv.lastFeedback, since + 2 * DAY);   // a reviewer's issue comment after the author's last move
        const states_ = Object.values(rv.reviews).map(r => r.state);
        rv.changesRequested = states_.includes('changes_requested');
        rv.changesRequestedAt = Math.max(0, ...Object.values(rv.reviews).filter(r => r.state === 'changes_requested').map(r => r.stateAt || r.at));
        rv.approved = states_.includes('approved') && !rv.changesRequested;
        yield { ...base, rv, requested, mergeable, mergeState, baseGone };
      }
    }
  }
}

const orphans = new Map(), reached = new Set(), tasks = new Set();
let n = 0;
const t0 = Date.now();
for (const pr of states()) {
  n++;
  const k = M.classify(pr);
  if (!M.BUCKETS[k]) { console.error(`classify() returned an unknown bucket "${k}" for`, pr); process.exit(2); }
  reached.add(k);
  for (const l of [R1, R2]) { const t = M.reviewerTask(pr, l); if (t) { if (!M.REVIEWER_TASKS[t]) { console.error(`reviewerTask() returned unknown "${t}"`); process.exit(2); } tasks.add(t); } }
  const why = M.orphan(pr);
  if (why) {
    const key = `${k} — ${why}`;
    if (!orphans.has(key)) orphans.set(key, { count: 0, example: pr });
    orphans.get(key).count++;
  }
}
const ms = Date.now() - t0;
const show = pr => {
  const rv = pr.rv;
  const revs = rv ? Object.entries(rv.reviews).map(([l, r]) => `${l}:${r.state}${r.at < Math.max(rv.lastPush, rv.lastAuthorActivity) ? '(old)' : '(new)'}`).join(',') || '-' : 'n/a';
  return `draft=${pr.draft} ci=${pr.pipe ? pr.pipe.status : 'none'} mainRed=${pr.mainRed} stale=${pr.stale} dnm=${/DNM/.test(pr.title)} mergeable=${pr.mergeable} state=${pr.mergeState} baseGone=${pr.baseGone} requested=[${(pr.requested || []).join(',')}] reviews=${revs} threads=${rv ? rv.openThreads : 'n/a'} feedback>author=${rv ? rv.lastFeedback > rv.lastAuthorActivity : 'n/a'} dormant=${rv ? (T - rv.lastAuthorActivity) / DAY > M.DORMANT_DAYS : 'n/a'}`;
};
console.log(`${n.toLocaleString()} states in ${ms} ms · buckets reached ${reached.size}/${Object.keys(M.BUCKETS).length} · reviewer tasks reached ${tasks.size}/${Object.keys(M.REVIEWER_TASKS).length}`);
const dead = [...Object.keys(M.BUCKETS).filter(k => !reached.has(k)), ...Object.keys(M.REVIEWER_TASKS).filter(k => !tasks.has(k))];
if (dead.length) console.log(`✗ unreachable buckets — dead rules, or a hole in the enumeration: ${dead.join(', ')}`);
if (orphans.size) {
  console.log(`\n${[...orphans.values()].reduce((a, o) => a + o.count, 0).toLocaleString()} orphan states — PRs nobody's move drains:`);
  for (const [key, { count, example }] of orphans) console.log(`  ✗ ${key}  (${count.toLocaleString()} states)\n      e.g. ${show(example)}`);
  process.exit(1);
}
if (dead.length) process.exit(1);
console.log('✓ theorem holds: every state is owned, transient, or parked');
