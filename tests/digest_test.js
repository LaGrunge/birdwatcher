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
const G = new Function(prelude + code + '\nreturn { ccType, subjectOf, digestOf, digestText, weekPerf, leadOf, weekStart, dayOf, DAY };')();

const T = iso => Math.floor(new Date(iso) / 1000);
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); } };

check('conventional-commit titles, behind ticket keys and DNM tags', () => {
  assert.deepStrictEqual(G.ccType('feat(api)!: add x'), { type: 'feat', scope: 'api', breaking: true, subject: 'add x' });
  assert.deepStrictEqual(G.ccType('Fix: y'), { type: 'fix', scope: '', breaking: false, subject: 'y' });
  assert.strictEqual(G.ccType('PROJ-273 fix(handler): release cursors').subject, 'release cursors');
  assert.strictEqual(G.ccType('PROJ-112: fix(handler): name the row').type, 'fix');
  assert.strictEqual(G.ccType('DNM feat(ddl): partitions').type, 'feat');
  assert.strictEqual(G.ccType('PROJ-12 add z'), null);
  assert.strictEqual(G.ccType('chore: '), null);
  assert.strictEqual(G.ccType('wip(x): nope'), null);   // not a type
  assert.strictEqual(G.subjectOf({ title: 'PROJ-12 add z' }), 'add z');
});

const monday = G.weekStart(G.dayOf(T('2026-09-23T00:00:00Z')));   // Mon Sep 21
const pr = (number, title, merged, author = 'alice', extra = {}) => ({ number, title, url: `https://gh/pr/${number}`, author, merged: T(merged), ...extra });
const keysOf = p => [...p.title.matchAll(/\b(PROJ)-(\d+)\b/g)].map(m => [`${m[1]}-${m[2]}`, `https://jira/${m[1]}-${m[2]}`]);
const prs = [
  pr(1, 'PROJ-5 feat(core): alpha', '2026-09-21T10:00:00Z'),
  pr(2, 'fix: beta', '2026-09-22T10:00:00Z', 'bob'),
  pr(3, 'PROJ-5 refactor!: gamma', '2026-09-23T10:00:00Z'),
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
  assert.deepStrictEqual(dg.byTracker.map(t => [t.key, t.prs.map(p => p.number)]), [['PROJ-5', [1, 3]]]);
  assert.deepStrictEqual(dg.untracked.map(p => p.number), [2, 4]);
  assert.deepStrictEqual(dg.authors, [{ login: 'alice', n: 2 }, { login: 'bob', n: 2 }]);
  assert.deepStrictEqual(dg.breaking.map(p => p.number), [3]);
});
check('the Slack and Markdown summaries', () => {
  const dg = G.digestOf(prs.slice(0, 2), monday, keysOf);
  assert.strictEqual(G.digestText(dg, 'acme', 'slack', l => '@' + l),
    '*acme — week of Sep 21–Sep 27*: 2 PRs merged by 2 people\n\n*Features*\n• alpha (<https://gh/pr/1|#1>, <https://jira/PROJ-5|PROJ-5>) — @alice\n\n*Fixes*\n• beta (<https://gh/pr/2|#2>) — @bob');
  assert.ok(G.digestText(dg, 'acme', 'md').includes('• alpha ([#1](https://gh/pr/1), [PROJ-5](https://jira/PROJ-5)) — alice'));
});
check('the week\'s perf: the median of its nightlies against the week before', () => {
  const nights = [['2026-09-14', 80, 2], ['2026-09-16', 99, 1.6], ['2026-09-18', 82, 1.8],
    ['2026-09-21', 91, 1.3], ['2026-09-23', 60, 9], ['2026-09-26', 93, 1.1], ['2026-09-27', 95, 1.0], ['2026-09-28', 10, 1]]
    .map(([date, r, g]) => ({ date, r, g }));
  const get = n => ({ ratio: n.r, geo: n.g });
  const P = G.weekPerf(nights, monday * G.DAY, (monday + 7) * G.DAY, get);
  assert.deepStrictEqual([P.first, P.last, P.nights, P.prevNights, P.ratio, P.geo.map(x => +x.toFixed(6))], ['2026-09-21', '2026-09-27', 4, 3, [82, 92], [1.8, 1.2]]);
  const lone = G.weekPerf(nights.slice(3), monday * G.DAY, (monday + 7) * G.DAY, get);
  assert.deepStrictEqual([lone.prevNights, lone.ratio[0]], [0, null]);
  assert.strictEqual(G.weekPerf(nights.slice(0, 3), monday * G.DAY, (monday + 7) * G.DAY, get), null);
  const text = G.digestText(G.digestOf([], monday, keysOf), 'acme', 'slack', l => l, P, { ratio: 'TPC-C', geo: 'TPC-H' });
  assert.ok(text.endsWith('*Perf*, weekly median, last week → this week: TPC-C 82.0% → 92.0% · TPC-H 1.80 s → 1.20 s (4 nightlies 2026-09-21 → 2026-09-27)'), text);
});
check('the lead story: breaking, then a feature, then the most reviewed, then the latest', () => {
  const rv = n => Array.from({ length: n }, () => ['r', 0, 'x', 'approved', 0]);
  const pr = (number, title, reviews, merged) => ({ number, title, merged, log: rv(reviews) });
  const lead = xs => G.leadOf(xs).number;
  assert.strictEqual(lead([pr(1, 'fix: a', 9, 1), pr(2, 'feat: b', 1, 2), pr(3, 'feat!: c', 0, 3)]), 3);
  assert.strictEqual(lead([pr(1, 'fix: a', 9, 1), pr(2, 'feat: b', 1, 2), pr(4, 'feat: d', 2, 1)]), 4);
  assert.strictEqual(lead([pr(1, 'fix: a', 2, 1), pr(2, 'chore: b', 2, 5), pr(3, 'misc', 1, 9)]), 2);
  assert.strictEqual(G.leadOf([]), null);
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
