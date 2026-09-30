#!/usr/bin/env node
// The Streaks tab's review game: the working-time clock, the debts a
// reviewer owes, and the streaks and achievements built on them.
//
//   node tests/game_test.js        # exit 1 on any failure
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8').split('\n');
let code = '', inside = false;
for (const line of src) {
  if (/\/\/ @(timeline|game)-begin/.test(line)) { inside = true; continue; }
  if (/\/\/ @(timeline|game)-end/.test(line)) { inside = false; continue; }
  if (inside) code += line + '\n';
}
const prelude = `
  const tsOf = iso => iso ? Math.floor(new Date(iso) / 1000) : 0;
  const safeUrl = u => u;
  const pc = { automation: [] };
  const pcSave = () => {};
`;
const G = new Function(prelude + code + '\nreturn { workStart, addWork, workBetween, workDay, reviewLog, obligations, reviewGame };')();

const T = iso => Math.floor(new Date(iso) / 1000);
const H = 3600;
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); } };

// 2026-09-25 is a Friday, 2026-09-28 a Monday.
check('weekend time starts on Monday 00:00 UTC', () => {
  assert.strictEqual(G.workStart(T('2026-09-26T10:00:00Z')), T('2026-09-28T00:00:00Z'));
  assert.strictEqual(G.workStart(T('2026-09-25T10:00:00Z')), T('2026-09-25T10:00:00Z'));
});
check('a Friday request is due on Monday, not Saturday', () => {
  assert.strictEqual(G.addWork(T('2026-09-25T10:00:00Z'), 24 * H), T('2026-09-28T10:00:00Z'));
});
check('working time between Friday and Monday skips the weekend', () => {
  assert.strictEqual(G.workBetween(T('2026-09-25T22:00:00Z'), T('2026-09-28T01:00:00Z')), 3 * H);
  assert.strictEqual(G.workBetween(T('2026-09-26T09:00:00Z'), T('2026-09-26T18:00:00Z')), 0);
});

const human = login => ({ login, type: 'User' });
const bot = { login: 'gemini-code-assist[bot]', type: 'Bot' };
const pr = { number: 7, author: 'alice', draft: false };

check('the log drops bots and the author as reviewers and counts inline comments', () => {
  const log = G.reviewLog([
    { event: 'review_requested', created_at: '2026-09-28T09:00:00Z', requested_reviewer: human('bob') },
    { event: 'reviewed', id: 11, user: bot, state: 'commented', submitted_at: '2026-09-28T09:01:00Z' },
    { event: 'reviewed', id: 12, user: human('alice'), state: 'commented', submitted_at: '2026-09-28T09:02:00Z' },
    { event: 'reviewed', id: 13, user: human('bob'), state: 'CHANGES_REQUESTED', submitted_at: '2026-09-28T09:30:00Z' },
  ], [{ pull_request_review_id: 13, user: human('bob') }, { pull_request_review_id: 13, user: human('bob') }, { pull_request_review_id: 11, user: bot }], pr);
  assert.deepStrictEqual(log, [['q', T('2026-09-28T09:00:00Z'), 'bob'], ['r', T('2026-09-28T09:30:00Z'), 'bob', 'changes_requested', 2]]);
});

check('a request is owed until the review; a push after changes-requested owes a re-review', () => {
  const o = G.obligations([
    ['q', T('2026-09-28T09:00:00Z'), 'bob'],
    ['r', T('2026-09-28T09:30:00Z'), 'bob', 'changes_requested', 0],
    ['p', T('2026-09-28T12:00:00Z')],
    ['p', T('2026-09-28T13:00:00Z')],
    ['r', T('2026-09-28T14:00:00Z'), 'bob', 'approved', 0],
    ['p', T('2026-09-28T15:00:00Z')],
  ], pr);
  assert.deepStrictEqual(o.map(x => [x.login, x.kind, x.at, x.done]), [
    ['bob', 'request', T('2026-09-28T09:00:00Z'), T('2026-09-28T09:30:00Z')],
    ['bob', 'rereview', T('2026-09-28T12:00:00Z'), T('2026-09-28T14:00:00Z')],
  ]);
});

check('a draft owes nothing until it is ready, and closing the PR cancels the debt', () => {
  const o = G.obligations([
    ['q', T('2026-09-01T09:00:00Z'), 'bob'],
    ['y', T('2026-09-10T09:00:00Z')],
    ['q', T('2026-09-10T09:00:00Z'), 'carol'],
    ['c', T('2026-09-10T10:00:00Z')],
  ], { ...pr, draft: false });
  assert.deepStrictEqual(o, []);
  const o2 = G.obligations([['q', T('2026-09-01T09:00:00Z'), 'bob'], ['y', T('2026-09-10T09:00:00Z')]], pr);
  assert.deepStrictEqual(o2.map(x => [x.login, x.at, x.done]), [['bob', T('2026-09-10T09:00:00Z'), 0]]);
});

// bob answers every request within 30 min on Mon, Tue, Wed; a request on
// Thursday he answers two working days later. Friday nobody asks him anything.
const at = (d, h, m = 0) => T(`2026-09-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
const quick = (n, d) => ({ number: n, title: `PR ${n}`, url: `u/${n}`, author: 'alice', draft: false, log: [['q', at(d, 9), 'bob'], ['r', at(d, 9, 30), 'bob', 'approved', 0]] });
const game = G.reviewGame([
  quick(1, 14), quick(2, 15), quick(3, 16),
  { number: 4, title: 'PR 4', url: 'u/4', author: 'alice', draft: false, log: [['q', at(17, 9), 'bob'], ['r', at(21, 9), 'bob', 'approved', 0]] },
  { number: 5, title: 'PR 5', url: 'u/5', author: 'alice', draft: false, log: [['q', at(22, 9), 'bob'], ['r', at(22, 9, 10), 'bob', 'approved', 6]] },
], at(22, 18));
const bob = game.people.get('bob');

check('on-time days build the streak, a late review breaks it, quiet days do not', () => {
  // Mon–Wed good, Thu quiet, Fri 18th bad (the Thursday request fell due), Mon quiet, Tue good.
  assert.strictEqual(bob.best, 3);
  assert.strictEqual(bob.streak, 1);
  assert.strictEqual(bob.onTime, 4);
  assert.strictEqual(bob.late, 1);
});
check('lightning for every answer within a working hour, deep dive for 5+ inline comments', () => {
  const n = k => bob.awards.filter(a => a.key === k).length;
  assert.strictEqual(n('lightning'), 4);
  assert.strictEqual(n('deep-dive'), 1);
  assert.strictEqual(n('streak-5'), 0);
});
check('the team feed is newest first', () => {
  assert.ok(game.feed.length >= 5);
  for (let i = 1; i < game.feed.length; i++) assert.ok(game.feed[i - 1].at >= game.feed[i].at);
});

check('rescuer: an unasked first review after a 2+ working day wait', () => {
  const g = G.reviewGame([{ number: 9, title: 'PR 9', url: 'u/9', author: 'alice', draft: false,
    log: [['q', at(14, 9), 'bob'], ['r', at(17, 10), 'carol', 'commented', 0], ['r', at(17, 11), 'bob', 'approved', 0]] }], at(22, 18));
  assert.strictEqual(g.people.get('carol').awards.filter(a => a.key === 'rescuer').length, 1);
  assert.strictEqual(g.people.get('bob').awards.filter(a => a.key === 'rescuer').length, 0);
});

check('inbox zero: 3 on-time reviews in a day and nothing owed at its end', () => {
  const g = G.reviewGame([quick(1, 15), { ...quick(2, 15), number: 2 }, { ...quick(3, 15), number: 3 }], at(22, 18));
  assert.strictEqual(g.people.get('bob').awards.filter(a => a.key === 'inbox-zero').length, 1);
  const g2 = G.reviewGame([quick(1, 15), { ...quick(2, 15), number: 2 }, { ...quick(3, 15), number: 3 },
    { number: 4, title: '', url: '', author: 'alice', draft: false, log: [['q', at(15, 12), 'bob']] }], at(22, 18));
  assert.strictEqual(g2.people.get('bob').awards.filter(a => a.key === 'inbox-zero').length, 0);
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
