#!/usr/bin/env node
// The pipeline history behind CI minutes and CI weather: what a trimmed
// pipeline keeps, and where the agent time goes.
//
//   node tests/runs_test.js        # exit 1 on any failure
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8').split('\n');
let code = '', inside = false;
for (const line of src) {
  if (/\/\/ @(timeline|game|runs)-begin/.test(line)) { inside = true; continue; }
  if (/\/\/ @(timeline|game|runs)-end/.test(line)) { inside = false; continue; }
  if (inside) code += line + '\n';
}
const prelude = `
  const tsOf = iso => iso ? Math.floor(new Date(iso) / 1000) : 0;
  const safeUrl = u => u;
  const pc = { automation: [] };
  const pcSave = () => {};
`;
const G = new Function(prelude + code + '\nreturn { trimRun, minutes, pctile, prOf, archOf, weekStart, dayOf, DAY, flakes, verdictOf, sky, WX_EVENTS };')();

const T = iso => Math.floor(new Date(iso) / 1000);
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); } };

const step = (name, state, a, b, type = 'commands') => ({ name, state, started: a, finished: b, type });
const t0 = T('2026-09-28T10:00:00Z');   // a Monday
const detail = {
  number: 42, event: 'pull_request', status: 'failure', created: t0 - 60, started: t0, finished: t0 + 3000,
  ref: 'refs/pull/7/head', commit: 'abcdef0123456789', parent: 0, reviewed_by: 'alice',
  workflows: [
    { name: 'base', state: 'success', started: t0, finished: t0 + 1200, agent_id: 3, children: [
      step('clone', 'success', t0, t0 + 30, 'clone'), step('build', 'success', t0 + 30, t0 + 1000), step('lint', 'success', t0 + 1000, t0 + 1060), step('docs', 'skipped', 0, 0)] },
    { name: 'base-arm64', state: 'failure', started: t0, finished: t0 + 3000, agent_id: 4, children: [
      step('build', 'success', t0, t0 + 2000), step('mtr', 'failure', t0 + 2000, t0 + 2900), step('lint', 'success', t0 + 2900, t0 + 2950), step('report', 'skipped', 0, 0)] },
  ],
};

check('a successful workflow keeps only its long steps, a failed one every step that ran', () => {
  const r = G.trimRun(detail);
  assert.deepStrictEqual(r.wf[0].st, { build: ['s', 970] });
  assert.deepStrictEqual(r.wf[1].st, { build: ['s', 2000], mtr: ['f', 900], lint: ['s', 50] });
  assert.strictEqual(r.wf[1].fail, 'mtr');
  assert.strictEqual(r.wf[0].fail, '');
  assert.strictEqual(r.sha, 'abcdef012345');
  assert.strictEqual(r.rv, 1);
});
check('a running pipeline, or a list item, has no workflows yet', () => {
  assert.strictEqual(G.trimRun({ ...detail, status: 'running' }).wf, null);
  const { workflows, ...item } = detail;
  assert.strictEqual(G.trimRun(item).wf, null);
});
check('PR number and architecture from the ref and the workflow name', () => {
  assert.strictEqual(G.prOf('refs/pull/353/head'), 353);
  assert.strictEqual(G.prOf('refs/heads/main'), 0);
  assert.strictEqual(G.archOf('base-arm64'), 'arm64');
  assert.strictEqual(G.archOf('sanitizers-ASan'), 'amd64');
});
check('nearest-rank percentiles', () => {
  assert.strictEqual(G.pctile([], .5), null);
  assert.strictEqual(G.pctile([5, 1, 3, 2, 4], .5), 3);
  assert.strictEqual(G.pctile([5, 1, 3, 2, 4], .9), 5);
});

const wf = (name, state, a, b, st = {}) => ({ n: name, s: state, a, b, ag: 1, fail: '', st });
const rec = (n, ev, c, wfs, extra = {}) => ({ n, ev, st: 'success', c, s: c, f: c, ref: ev === 'pull_request' ? `refs/pull/${extra.pr || 7}/head` : 'refs/heads/main', sha: 'x', par: 0, rv: 0, wf: wfs, ...extra });
const now = T('2026-09-30T18:00:00Z');   // Wednesday
const recs = [
  rec(1, 'pull_request', t0, [wf('base', 'success', t0 + 60, t0 + 660, { build: ['s', 400] }), wf('base-arm64', 'success', t0 + 120, t0 + 1020)]),
  rec(2, 'pull_request', t0 + 7200, [wf('base', 'killed', t0 + 7230, t0 + 7530)]),
  rec(3, 'push', t0 - 7 * 86400, [wf('base', 'success', t0 - 7 * 86400 + 10, t0 - 7 * 86400 + 1210)]),
  rec(4, 'pull_request', t0 + 3600, [wf('base', 'success', t0 + 9000, t0 + 9600)], { rv: 1, pr: 9 }),
  rec(5, 'cron', t0, null),   // still running
];
const M = G.minutes(recs, now);

check('agent time per architecture and workflow, killed runs counted as superseded', () => {
  assert.strictEqual(M.total, 600 + 900 + 300 + 1200 + 600);
  assert.deepStrictEqual(M.byArch, { amd64: 600 + 300 + 1200 + 600, arm64: 900 });
  assert.strictEqual(M.killed, 300);
  assert.deepStrictEqual(M.byWorkflow.map(w => [w.name, w.sec, w.n, w.killed]), [['base', 2700, 4, 300], ['base-arm64', 900, 1, 0]]);
  assert.strictEqual(M.runs, 4);
});
check('a workflow\'s kept steps plus "other" add up to its time', () => {
  const base = M.byWorkflow[0];
  assert.deepStrictEqual(base.steps.map(s => [s.name, s.sec]), [['', 2300], ['build', 400]]);
});
check('queue wait skips pipelines that waited for an approval', () => {
  // waits: 60, 120 (#1), 30 (#2), 10 (#3); #4 has rv = 1
  assert.strictEqual(M.queue.p50, 30);
  assert.strictEqual(M.queue.max, 120);
});
check('pull requests grouped by number, events by name', () => {
  assert.deepStrictEqual(M.byPR.map(p => [p.num, p.sec, p.n, p.killed]), [[7, 1800, 2, 300], [9, 600, 1, 0]]);
  assert.deepStrictEqual(M.byEvent.map(e => [e.name, e.sec]), [['pull_request', 2400], ['push', 1200]]);
});
check('this week against the last, split at Monday 00:00 UTC', () => {
  assert.strictEqual(M.week.cur.total, 600 + 900 + 300 + 600);
  assert.strictEqual(M.week.prev.total, 1200);
  assert.strictEqual(M.byDay.length, 28);
  assert.strictEqual(M.byDay[M.byDay.length - 1].day, G.dayOf(now));
});

// Flakes: records of one change (event + commit) in pipeline-number order.
const F = (n, ev, sha, c, wfs, par = 0) => ({ n, ev, st: 'x', c, s: c, f: c + 1000, ref: ev === 'pull_request' ? 'refs/pull/5/head' : 'refs/heads/main', sha, par, rv: 0, wf: wfs });
const W = (name, state, a, b, st = {}) => ({ n: name, s: state, a, b, ag: 1, fail: '', st });
const d1 = T('2026-09-29T09:00:00Z');

check('a verdict: kept fail, kept pass, or the whole workflow passing; killed is no verdict', () => {
  const r = F(1, 'pull_request', 's', d1, [W('base', 'failure', d1, d1 + 100, { mtr: ['f', 50], build: ['s', 40], lint: ['k', 1] }), W('asan', 'success', d1, d1 + 100)]);
  assert.strictEqual(G.verdictOf(r, 'base › mtr'), 'fail');
  assert.strictEqual(G.verdictOf(r, 'base › build'), 'pass');
  assert.strictEqual(G.verdictOf(r, 'base › lint'), null);
  assert.strictEqual(G.verdictOf(r, 'base › docs'), null);    // absent from a failed workflow: it never ran
  assert.strictEqual(G.verdictOf(r, 'asan › mtr'), 'pass');   // absent from a successful one: it passed
  assert.strictEqual(G.verdictOf(r, 'tsan › mtr'), null);
});
check('fail, then pass on a restart: one flake, rate 1/2, the restart is lost time', () => {
  const X = G.flakes([
    F(10, 'pull_request', 'a1', d1, [W('base', 'failure', d1, d1 + 600, { mtr: ['f', 300] })]),
    F(11, 'pull_request', 'a1', d1 + 3600, [W('base', 'success', d1 + 3600, d1 + 4500)], 10),
  ], now);
  assert.strictEqual(X.steps.length, 1);
  assert.deepStrictEqual([X.steps[0].key, X.steps[0].flakes, X.steps[0].passes, X.steps[0].rate], ['base › mtr', 1, 1, .5]);
  assert.strictEqual(X.lost, 900);
  assert.deepStrictEqual([X.events[0].n, X.events[0].passN, X.events[0].pr, X.events[0].attempt], [10, 11, 5, 1]);
  assert.deepStrictEqual(X.attempts, { groups: 1, reruns: 1 });
});
check('pass, then fail on a repeated manual run: a flake only when manual runs are in', () => {
  const recs = [F(20, 'manual', 'b1', d1, [W('base', 'success', d1, d1 + 100)]), F(21, 'manual', 'b1', d1 + 100, [W('base', 'failure', d1 + 100, d1 + 200, { mtr: ['f', 50] })])];
  assert.strictEqual(G.flakes(recs, now).steps.length, 0);
  assert.strictEqual(G.flakes(recs, now, 28, G.WX_EVENTS.all).steps[0].flakes, 1);
});
check('failing in every attempt is a genuine failure, and chasing it is not lost time', () => {
  const X = G.flakes([
    F(30, 'push', 'c1', d1, [W('base', 'failure', d1, d1 + 100, { mtr: ['f', 50] })]),
    F(31, 'push', 'c1', d1 + 100, [W('base', 'failure', d1 + 100, d1 + 200, { mtr: ['f', 50] })], 30),
  ], now);
  assert.strictEqual(X.steps.length, 0);
  assert.strictEqual(X.failing[0].genuine, 2);
  assert.strictEqual(X.lost, 0);
});
check('another step failing on the rerun: both flip on one commit, so both are flakes', () => {
  const X = G.flakes([
    F(40, 'pull_request', 'e1', d1, [W('base', 'failure', d1, d1 + 100, { mtr: ['f', 50], unit: ['s', 20] })]),
    F(41, 'pull_request', 'e1', d1 + 100, [W('base', 'failure', d1 + 100, d1 + 300, { mtr: ['s', 50], unit: ['f', 20] })], 40),
  ], now);
  assert.deepStrictEqual(X.steps.map(s => s.key).sort(), ['base › mtr', 'base › unit']);
  assert.deepStrictEqual(X.failing, []);
  assert.strictEqual(X.lost, 200);   // attempt 2 chased mtr, which passed there
});
check('a killed attempt between a flaky failure and the green one counts as lost too', () => {
  const X = G.flakes([
    F(50, 'pull_request', 'f1', d1, [W('base', 'failure', d1, d1 + 100, { mtr: ['f', 50] })]),
    F(51, 'pull_request', 'f1', d1 + 100, [W('base', 'killed', d1 + 100, d1 + 160, { mtr: ['k', 10] })], 50),
    F(52, 'pull_request', 'f1', d1 + 200, [W('base', 'success', d1 + 200, d1 + 500)], 50),
  ], now);
  assert.strictEqual(X.lost, 60 + 300);
});
check('weather: a day per cell, this week against the last', () => {
  const X = G.flakes([
    F(60, 'pull_request', 'g1', d1, [W('base', 'failure', d1, d1 + 100, { mtr: ['f', 50] })]),
    F(61, 'pull_request', 'g1', d1 + 100, [W('base', 'success', d1 + 100, d1 + 200)]),
  ], now);
  const c = X.map['base › mtr'][G.dayOf(d1 + 100)];
  assert.deepStrictEqual(c, { flakes: 1, genuine: 0, runs: 2 });
  assert.strictEqual(G.sky(c), 'cloud');
  assert.deepStrictEqual([G.sky(null), G.sky({ runs: 3, flakes: 0 }), G.sky({ runs: 3, flakes: 3 }), G.sky({ runs: 5, flakes: 4 })], ['void', 'sun', 'rain', 'storm']);
  assert.deepStrictEqual([X.week.cur.flakes, X.week.cur.verdicts, X.week.prev.flakes], [1, 2, 0]);
});
check('the next night\'s cron on the same commit: a flake, but not a rerun and not lost time', () => {
  const X = G.flakes([
    F(70, 'cron', 'h1', d1, [W('nightly', 'failure', d1, d1 + 100, { jepsen: ['f', 50] })]),
    F(71, 'cron', 'h1', d1 + 86400, [W('nightly', 'success', d1 + 86400, d1 + 86500)]),
  ], now);
  assert.strictEqual(X.steps[0].flakes, 1);
  assert.strictEqual(X.lost, 0);
  assert.deepStrictEqual(X.attempts, { groups: 0, reruns: 0 });
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
