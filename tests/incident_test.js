#!/usr/bin/env node
// Main incidents: when main (or a cron) is red, whose move it is and what the
// runs prove about the cause — a flake, a moved dependency, the code, or
// nothing that changed. The fixtures are made up; the sweep at the end proves the incident's half of the theorem: a red strip always has an
// owner and a move, whatever its runs look like.
//
//   node tests/incident_test.js        # exit 1 on any failure
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8').split('\n');
let code = '', inside = false;
for (const line of src) {
  if (/\/\/ @(matrix|incident)-begin/.test(line)) { inside = true; continue; }
  if (/\/\/ @(matrix|incident)-end/.test(line)) { inside = false; continue; }
  if (inside || line.includes('// @matrix-line')) code += line + '\n';
}
const G = new Function(code + '\nreturn { incidentOf, mainBlocks, parseDeps, failsOf, samePin, INCIDENT_MOVES, classify, orphan };')();

let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); } };

const GG_A = { LIB_SHA: '1111aaaa', TOOL_SHA: '2222bbbb' }, GG_B = { LIB_SHA: '3333cccc', TOOL_SHA: '2222bbbb' };
let t = 1000;
// newest first, like the Woodpecker list
const run = (number, status, commit, extra = {}) => ({ number, status, commit, sender: 'alice', parent: 0, created: (t += 100), finished: t + 50, fails: status === 'success' ? [] : ['base › mtr'], deps: GG_A, ...extra });
const strip = (...runs) => runs.reverse().map(r => r()).reverse();   // oldest given last gets the smallest timestamp

check('green on top: no incident', () => {
  const r = strip(() => run(3, 'success', 'c'), () => run(2, 'failure', 'b'));
  assert.strictEqual(G.incidentOf(r, r), null);
});
check('a running pipeline on top is skipped: the last verdict decides', () => {
  const r = strip(() => run(4, 'running', 'd', { fails: null }), () => run(3, 'failure', 'c'), () => run(2, 'success', 'b'));
  const inc = G.incidentOf(r, r);
  assert.strictEqual(inc.lead.number, 3);
  assert.strictEqual(inc.cause, 'unconfirmed');
});
check('a flake that a restart fixed (#102 → restart #103, green): no incident', () => {
  const r = strip(() => run(103, 'success', 'c2', { parent: 102 }), () => run(102, 'failure', 'c2'), () => run(101, 'success', 'c1'));
  assert.strictEqual(G.incidentOf(r, r), null);
});
check('one red run is unconfirmed: the move is to rerun it', () => {
  const r = strip(() => run(3, 'failure', 'c', { sender: 'bob' }), () => run(2, 'success', 'b'));
  const inc = G.incidentOf(r, r);
  assert.strictEqual(inc.cause, 'unconfirmed');
  assert.strictEqual(inc.confirmed, false);
  assert.strictEqual(inc.owner, 'bob');
});
check('a restart red on the same step confirms; same commit, same pins as green before → "same"', () => {
  const r = strip(() => run(5, 'failure', 'c', { parent: 4, sender: 'bob' }), () => run(4, 'failure', 'c'), () => run(3, 'success', 'c', { parent: 2 }));
  const inc = G.incidentOf(r, r);
  assert.strictEqual(inc.confirmed, true);
  assert.strictEqual(inc.cause, 'same');
  assert.strictEqual(inc.owner, 'alice', 'a restart is not a merge: the owner is the last merger');
});
check('the code moved, the pins did not → "code", with the merges since the last green run as suspects', () => {
  const r = strip(() => run(6, 'failure', 'f', { sender: 'carol' }), () => run(5, 'failure', 'e', { sender: 'bob' }), () => run(4, 'success', 'd'));
  const inc = G.incidentOf(r, r);
  assert.strictEqual(inc.cause, 'code');
  assert.strictEqual(inc.firstRed.number, 5);
  assert.deepStrictEqual(inc.suspects.map(p => p.number), [5]);
  assert.strictEqual(inc.owner, 'carol', 'whoever merged last owns it, even onto a red main');
});
check('a pin moved, the code did not → "deps", naming the key and both values', () => {
  const r = strip(() => run(6, 'failure', 'd', { parent: 5, deps: GG_B }), () => run(5, 'failure', 'd', { deps: GG_B }), () => run(4, 'success', 'd', { deps: GG_A }));
  const inc = G.incidentOf(r, r);
  assert.strictEqual(inc.cause, 'deps');
  assert.deepStrictEqual(inc.moved, [{ key: 'LIB_SHA', from: '1111aaaa', to: '3333cccc' }]);
  assert.deepStrictEqual(inc.suspects, []);
});
check('both moved → "mixed"', () => {
  const r = strip(() => run(6, 'failure', 'f', { deps: GG_B }), () => run(5, 'failure', 'e', { deps: GG_B }), () => run(4, 'success', 'd', { deps: GG_A }));
  assert.strictEqual(G.incidentOf(r, r).cause, 'mixed');
});
check('pins not recorded (a cron without the step): "code" when the commit moved, "same" when not, both flagged', () => {
  const nodeps = { deps: null };
  const a = strip(() => run(6, 'failure', 'f', nodeps), () => run(5, 'failure', 'e', nodeps), () => run(4, 'success', 'd', nodeps));
  const ia = G.incidentOf(a, a);
  assert.strictEqual(ia.cause, 'code'); assert.strictEqual(ia.depsKnown, false);
  assert.strictEqual(G.incidentOf(a, a, { pinned: true }).cause, 'unpinned', 'a site that tracks pins can\'t blame the code without them');
  const b = strip(() => run(6, 'failure', 'd', nodeps), () => run(5, 'failure', 'd', nodeps), () => run(4, 'success', 'd', nodeps));
  const ib = G.incidentOf(b, b);
  assert.strictEqual(ib.cause, 'same'); assert.strictEqual(ib.depsKnown, false);
});
check('a red run that failed other steps ends the walk back: the break starts after it', () => {
  // a nightly: #203 failed the soak step, then #204 and #205 fail the report steps
  const r = strip(
    () => run(205, 'failure', 'n3', { fails: ['nightly › report-a'] }),
    () => run(204, 'failure', 'n3', { fails: ['nightly › report-a', 'nightly › report-b'] }),
    () => run(203, 'failure', 'n2', { fails: ['nightly › soak'] }),
    () => run(202, 'success', 'n1'));
  const inc = G.incidentOf(r.map(p => ({ ...p, deps: null })), [], { pinned: true });   // this cron prints no pins
  assert.strictEqual(inc.firstRed.number, 204);
  assert.strictEqual(inc.confirmed, true);
  assert.strictEqual(inc.cause, 'unpinned', 'the commit moved since #202, and a dependency may have moved unrecorded');
  assert.strictEqual(inc.owner, '', 'no merges given');
});
check('cron strips take the owner from main\'s merges', () => {
  const cron = strip(() => run(9, 'failure', 'x', { sender: 'nightly' }), () => run(8, 'success', 'x', { sender: 'nightly' }));
  const merges = strip(() => run(7, 'success', 'x', { sender: 'dave' }));
  assert.strictEqual(G.incidentOf(cron, merges).owner, 'dave');
});
check('red as far back as the history goes → "unknown" once confirmed', () => {
  const r = strip(() => run(3, 'failure', 'c'), () => run(2, 'failure', 'b'));
  assert.strictEqual(G.incidentOf(r, r).cause, 'unknown');
});
check('the lead\'s failed steps not read yet: unconfirmed and marked as reading', () => {
  const r = strip(() => run(3, 'failure', 'c', { fails: null }), () => run(2, 'failure', 'b'), () => run(1, 'success', 'a'));
  const inc = G.incidentOf(r, r);
  assert.strictEqual(inc.reading, true);
  assert.strictEqual(inc.cause, 'unconfirmed');
});

check('pinned inputs from a step log: ANSI stripped, ignored keys dropped', () => {
  const log = '\x1b[92m✓\x1b[0m Pinned run #7 inputs\nFORMAT_VERSION=1\nAPP_COMMIT=0a0a0a0a\nLIB_BRANCH=main\nLIB_SHA=1111aaaa\n+ echo FOO=bar baz\n';
  assert.deepStrictEqual(G.parseDeps(log, { ignore: ['FORMAT_VERSION', 'APP_COMMIT'] }), { LIB_BRANCH: 'main', LIB_SHA: '1111aaaa' });
  assert.strictEqual(G.parseDeps('no pins here'), null);
});
check('both moved, and the suspect merge\'s PR passed on the new pin → "cleared": the code broke it', () => {
  const r = strip(() => run(6, 'failure', 'f', { deps: GG_B, message: 'feat: thing\n\nbody' }), () => run(5, 'success', 'd', { deps: GG_A }));
  const prRuns = [
    { number: 90, status: 'failure', commit: 'p2', message: 'feat: thing', deps: GG_B },               // red: not evidence
    { number: 89, status: 'success', commit: 'p1', message: 'feat: thing\n\nbody', deps: GG_B },     // rebase-merged: same subject
  ];
  const inc = G.incidentOf(r, r, { pinned: true, prRuns });
  // one red run: unconfirmed; confirm with a restart
  const r2 = [{ ...r[0], number: 7, parent: 6, created: r[0].created + 10 }, ...r];
  const inc2 = G.incidentOf(r2, r2, { pinned: true, prRuns });
  assert.strictEqual(inc.cause, 'unconfirmed');
  assert.strictEqual(inc2.cause, 'cleared');
  assert.strictEqual(inc2.cleared[0].pr.number, 89);
  const old = G.incidentOf(r2, r2, { pinned: true, prRuns: [{ ...prRuns[1], deps: GG_A }] });
  assert.strictEqual(old.cause, 'mixed', 'a PR green on the old pins proves nothing about the new ones');
});
check('a pin printed in full and as a 12-char prefix is the same pin', () => {
  assert.ok(G.samePin('0123456789abcdef0123456789abcdef01234567', '0123456789ab'));
  assert.ok(!G.samePin('0123456789ab', '0123456789ac'));
  assert.ok(!G.samePin('21', '2'), 'short values compare exactly');
});
check('with a marker only the block after it counts', () => {
  const log = 'DB_HOST=127.0.0.1\n✓ Installed inputs:\nLIB_SHA=1111aaaa\n\nTOOL_SHA=2222bbbb\nnot a pin\nLATER=x\n';
  assert.deepStrictEqual(G.parseDeps(log, { marker: 'Installed inputs' }), { LIB_SHA: '1111aaaa', TOOL_SHA: '2222bbbb' });
  assert.strictEqual(G.parseDeps('LIB_SHA=a\n', { marker: 'Installed inputs' }), null);
});
check('plugins/kv-pins.js: one plugin per `pins` entry, parse through kit.kv, compare URL from the template', () => {
  const load = pins => {
    const window = { BIRDWATCHER_CONFIG: { pins } };
    new Function('window', fs.readFileSync(path.join(__dirname, '..', 'plugins', 'kv-pins.js'), 'utf8'))(window);
    return window.BIRDWATCHER_PLUGINS || [];
  };
  assert.deepStrictEqual(load(undefined), [], 'no pins in the config: no plugin');
  assert.deepStrictEqual(load({ steps: [] }), [], 'no steps: no plugin');
  const [p, q] = load([
    { repos: ['acme/app'], steps: ['resolve-deps'], marker: 'Pinned inputs:', ignore: ['APP_COMMIT'], compare: { LIB_SHA: 'https://x/compare/{from}...{to}' } },
    { steps: ['other'] },
  ]);
  assert.deepStrictEqual(p.repos, ['acme/app']);
  assert.strictEqual(q.repos, undefined);
  const kit = { kv: (log, o) => G.parseDeps(log, o) };
  assert.deepStrictEqual(p.pins.parse('APP_COMMIT=1\nPinned inputs:\nAPP_COMMIT=0a0a0a0a\nLIB_SHA=1111aaaa\ndone\nX=1', kit), { LIB_SHA: '1111aaaa' });
  assert.strictEqual(p.pins.link('LIB_SHA', '1111aaaa', '3333cccc'), 'https://x/compare/1111aaaa...3333cccc');
  assert.strictEqual(p.pins.link('TOOL_SHA', 'a', 'b'), '');
});
check('failed step keys are "workflow › step"', () => {
  const det = { workflows: [{ name: 'base', children: [{ name: 'build', state: 'success' }, { name: 'mtr', state: 'failure' }] }, { name: 'asan', children: [{ name: 'mtr', state: 'killed' }] }] };
  assert.deepStrictEqual(G.failsOf(det), ['base › mtr', 'asan › mtr']);
});

const inc = (() => { const r = strip(() => run(6, 'failure', 'f'), () => run(5, 'failure', 'e'), () => run(4, 'success', 'd')); return G.incidentOf(r, r); })();
const prPipe = (fails, created = inc.lastGreen.created + 1) => ({ number: 99, status: 'failure', commit: 'p', created, fails });
check('a PR red only on main\'s failing steps waits on main', () => {
  assert.strictEqual(G.mainBlocks({ pipe: prPipe(['base › mtr']) }, inc), true);
});
check('a PR that also fails a step of its own is its author\'s', () => {
  assert.strictEqual(G.mainBlocks({ pipe: prPipe(['base › mtr', 'base › build']) }, inc), false);
});
check('a PR run from before main\'s last green run is its author\'s', () => {
  assert.strictEqual(G.mainBlocks({ pipe: prPipe(['base › mtr'], inc.lastGreen.created - 1) }, inc), false);
});
check('an unconfirmed main does not take the move from the author', () => {
  const r = strip(() => run(3, 'failure', 'c'), () => run(2, 'success', 'b'));
  assert.strictEqual(G.mainBlocks({ pipe: prPipe(['base › mtr']) }, G.incidentOf(r, r)), false);
});
check('a main-red PR is in the main-red bucket and owned by main\'s owner', () => {
  const pr = { number: 1, title: 't', author: 'a', draft: false, pipe: { number: 7, status: 'failure' }, requested: [], mainRed: true, mainOwner: 'carol' };
  assert.strictEqual(G.classify(pr), 'main-red');
  assert.strictEqual(G.orphan(pr), null);
  assert.ok(G.orphan({ ...pr, mainOwner: '' }), 'without an owner it is reported as unowned');
});

// The sweep: every strip of up to 4 runs — green or red over 2 commits, 2 pin
// sets or none, 2 failure signatures or unread, restart or not — plus a run
// still in flight.
check('every red strip has an owner, a known cause and a move (exhaustive, up to 4 runs)', () => {
  // a PR run green on commit 'b' with the new pins: clears GG for a merge of 'b'
  const PR_RUNS = [{ number: 1, status: 'success', commit: 'b', message: 'x', ref: 'refs/pull/5/head', deps: GG_B }];
  const OPTS = [{ status: 'running', commit: 'b', deps: null, parent: 0, fails: null }];
  for (const status of ['success', 'failure']) for (const commit of ['a', 'b']) for (const deps of [GG_A, GG_B, null]) for (const parent of [0, 1])
    for (const fails of status === 'success' ? [[]] : [['base › mtr'], ['base › build'], null]) OPTS.push({ status, commit, deps, parent, fails });
  let n = 0, reds = 0;
  const walk = (prefix) => {
    if (prefix.length) {
      n++;
      const runs = prefix.map((o, i) => ({ number: 100 - i, created: 10000 - i * 10, finished: 10000 - i * 10 + 5, sender: o.parent ? 'restarter' : `m${i}`, ...o }));
      const r = G.incidentOf(runs, runs, { pinned: prefix.length % 2 === 0, prRuns: PR_RUNS });
      const top = runs.find(p => p.status !== 'running');
      if (!top || top.status === 'success') assert.strictEqual(r, null, 'green or no verdict on top must not be an incident');
      else {
        reds++;
        assert.ok(r, 'a red verdict on top is an incident');
        assert.ok(G.INCIDENT_MOVES[r.cause], `unknown cause ${r.cause}`);
        if (runs.some(p => !p.parent)) assert.ok(r.owner && !r.owner.startsWith('restarter'), 'a strip with a merge has the last merger as owner');
        if (r.confirmed) assert.ok(r.streak.length >= 2, 'confirmed needs a second red run');
        if (r.cause === 'deps') assert.ok(r.moved.length && !r.codeMoved);
        if (r.cause === 'cleared') assert.ok(r.codeMoved && r.moved.length && r.cleared.length);
        if (r.cause === 'mixed') assert.ok(r.codeMoved && r.moved.length && !r.cleared.length);
        if (r.cause === 'code' || r.cause === 'unpinned') assert.ok(r.codeMoved && !r.moved.length);
      }
    }
    if (prefix.length < 4) for (const o of OPTS) walk([...prefix, o]);
  };
  walk([]);
  console.log(`     ${n.toLocaleString()} strips, ${reds.toLocaleString()} red`);
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall incident checks passed');
