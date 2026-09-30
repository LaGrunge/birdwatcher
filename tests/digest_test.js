#!/usr/bin/env node
// The Weekly digest: conventional-commit titles, the week's grouping, the
// paste-ready summary and the week's nightly perf.
//
//   node tests/digest_test.js        # exit 1 on any failure
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8').split('\n');
let code = '', inside = false;
for (const line of src) {
  if (/\/\/ @(game|digest)-begin/.test(line)) { inside = true; continue; }
  if (/\/\/ @(game|digest)-end/.test(line)) { inside = false; continue; }
  if (inside) code += line + '\n';
}
const prelude = `
  const tsOf = iso => iso ? Math.floor(new Date(iso) / 1000) : 0;
  const isBot = u => !u || u.type === 'Bot';
`;
const G = new Function(prelude + code + '\nreturn { ccType, subjectOf, digestOf, digestText, weekPerf, weekStart, dayOf, DAY };')();

const T = iso => Math.floor(new Date(iso) / 1000);
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); } };

check('conventional-commit titles, behind ticket keys and DNM tags', () => {
  assert.deepStrictEqual(G.ccType('feat(api)!: add x'), { type: 'feat', scope: 'api', breaking: true, subject: 'add x' });
  assert.deepStrictEqual(G.ccType('Fix: y'), { type: 'fix', scope: '', breaking: false, subject: 'y' });
  assert.strictEqual(G.ccType('ORTH-273 fix(handler): release cursors').subject, 'release cursors');
  assert.strictEqual(G.ccType('ORTH-112: fix(handler): name the row').type, 'fix');
  assert.strictEqual(G.ccType('DNM feat(ddl): partitions').type, 'feat');
  assert.strictEqual(G.ccType('ORTH-12 add z'), null);
  assert.strictEqual(G.ccType('chore: '), null);
  assert.strictEqual(G.ccType('wip(x): nope'), null);   // not a type
  assert.strictEqual(G.subjectOf({ title: 'ORTH-12 add z' }), 'add z');
});

const monday = G.weekStart(G.dayOf(T('2026-09-23T00:00:00Z')));   // Mon Sep 21
const pr = (number, title, merged, author = 'alice', extra = {}) => ({ number, title, url: `https://gh/pr/${number}`, author, merged: T(merged), ...extra });
const keysOf = p => [...p.title.matchAll(/\b(ORTH)-(\d+)\b/g)].map(m => [`${m[1]}-${m[2]}`, `https://jira/${m[1]}-${m[2]}`]);
const prs = [
  pr(1, 'ORTH-5 feat(core): alpha', '2026-09-21T10:00:00Z'),
  pr(2, 'fix: beta', '2026-09-22T10:00:00Z', 'bob'),
  pr(3, 'ORTH-5 refactor!: gamma', '2026-09-23T10:00:00Z'),
  pr(4, 'tidy things up', '2026-09-24T10:00:00Z', 'bob'),
  pr(5, 'feat: next week', '2026-09-28T00:00:00Z'),   // Monday 00:00 of the next week
  pr(6, 'feat: last week', '2026-09-20T23:59:59Z'),
  pr(7, 'closed, not merged', 0),
];

check('the week holds exactly the PRs merged Mon 00:00 to Sun 24:00 UTC', () => {
  const dg = G.digestOf(prs, monday, keysOf);
  assert.deepStrictEqual(dg.merged.map(p => p.number), [1, 2, 3, 4]);
});
check('grouped by type in a fixed order with "other" last, by ticket, and by author', () => {
  const dg = G.digestOf(prs, monday, keysOf);
  assert.deepStrictEqual(dg.byType.map(g => [g.type, g.prs.map(p => p.number)]), [['feat', [1]], ['fix', [2]], ['refactor', [3]], ['other', [4]]]);
  assert.deepStrictEqual(dg.byTracker.map(t => [t.key, t.prs.map(p => p.number)]), [['ORTH-5', [1, 3]]]);
  assert.deepStrictEqual(dg.untracked.map(p => p.number), [2, 4]);
  assert.deepStrictEqual(dg.authors, [{ login: 'alice', n: 2 }, { login: 'bob', n: 2 }]);
  assert.deepStrictEqual(dg.breaking.map(p => p.number), [3]);
});
check('the Slack and Markdown summaries', () => {
  const dg = G.digestOf(prs.slice(0, 2), monday, keysOf);
  assert.strictEqual(G.digestText(dg, 'orthus', 'slack', l => '@' + l),
    '*orthus — week of Sep 21–Sep 27*: 2 PRs merged by 2 people\n\n*Features*\n• alpha (<https://gh/pr/1|#1>, <https://jira/ORTH-5|ORTH-5>) — @alice\n\n*Fixes*\n• beta (<https://gh/pr/2|#2>) — @bob');
  assert.ok(G.digestText(dg, 'orthus', 'md').includes('• alpha ([#1](https://gh/pr/1), [ORTH-5](https://jira/ORTH-5)) — alice'));
});
check('the week\'s perf: first and last nightly inside it, none with fewer than two', () => {
  const nights = ['2026-09-20', '2026-09-21', '2026-09-23', '2026-09-27', '2026-09-28'].map((date, i) => ({ date, r: 90 + i, g: 1.3 - i / 10 }));
  const P = G.weekPerf(nights, monday * G.DAY, (monday + 7) * G.DAY, n => ({ ratio: n.r, geo: n.g }));
  assert.deepStrictEqual([P.first, P.last, P.nights, P.ratio], ['2026-09-21', '2026-09-27', 3, [91, 93]]);
  assert.strictEqual(G.weekPerf(nights.slice(0, 2), monday * G.DAY, (monday + 7) * G.DAY, n => ({ ratio: n.r, geo: n.g })), null);
  const text = G.digestText(G.digestOf([], monday, keysOf), 'orthus', 'slack', l => l, P, { ratio: 'TPC-C', geo: 'TPC-H' });
  assert.ok(text.endsWith('*Perf*: TPC-C 91.0% → 93.0% · TPC-H 1.20 s → 1.00 s (nightlies 2026-09-21 → 2026-09-27)'), text);
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
