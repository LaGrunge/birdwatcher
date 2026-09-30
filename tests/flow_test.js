#!/usr/bin/env node
// Flow: the stages of a merged PR's life in working time.
//
//   node tests/flow_test.js        # exit 1 on any failure
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8').split('\n');
let code = '', inside = false;
for (const line of src) {
  if (/\/\/ @(game|runs|flow)-begin/.test(line)) { inside = true; continue; }
  if (/\/\/ @(game|runs|flow)-end/.test(line)) { inside = false; continue; }
  if (inside) code += line + '\n';
}
const prelude = `
  const tsOf = iso => iso ? Math.floor(new Date(iso) / 1000) : 0;
  const isBot = u => !u || u.type === 'Bot';
`;
const G = new Function(prelude + code + '\nreturn { ciSpans, flowOf, flowStats };')();

const T = iso => Math.floor(new Date(iso) / 1000);
const H = 3600;
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message}`); } };
const at = (d, h, m = 0) => T(`2026-09-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`);
// Sep 28 2026 is a Monday.
const pr = (log, extra = {}) => ({ number: 1, title: 't', url: 'u', author: 'alice', created: at(28, 9), merged: at(29, 15), log, ...extra });
const contiguous = f => f.segs.every((s, i) => i === 0 ? s.a === f.created : s.a === f.segs[i - 1].b) && f.segs[f.segs.length - 1].b === f.merged;

check('review, author, review again after the push, then waiting to merge', () => {
  const f = G.flowOf(pr([['q', at(28, 9), 'bob'], ['r', at(28, 12), 'bob', 'changes_requested', 0], ['p', at(29, 9)], ['r', at(29, 11), 'bob', 'approved', 0], ['c', at(29, 15)]]), []);
  assert.deepStrictEqual(f.segs.map(s => [s.s, s.w / H]), [['review', 3], ['author', 21], ['review', 2], ['merge', 4]]);
  assert.deepStrictEqual(f.sum, { draft: 0, red: 0, building: 0, review: 5 * H, author: 21 * H, merge: 4 * H });
  assert.strictEqual(f.total, 30 * H);
  assert.strictEqual(f.neck, 'author');
  assert.ok(contiguous(f));
});
check('a red pipeline is carved out of the wait until the next pipeline starts', () => {
  const runs = [{ st: 'failure', c: at(28, 12, 30), f: at(28, 13) }, { st: 'success', c: at(29, 9, 5), f: at(29, 10) }];
  const f = G.flowOf(pr([['q', at(28, 9), 'bob'], ['r', at(28, 12), 'bob', 'changes_requested', 0], ['p', at(29, 9)], ['r', at(29, 11), 'bob', 'approved', 0]]), runs);
  assert.deepStrictEqual(f.segs.map(s => s.s), ['review', 'author', 'building', 'red', 'building', 'review', 'merge']);
  assert.strictEqual(f.sum.red, 20 * H + 5 * 60);        // Mon 13:00 → Tue 09:05
  assert.strictEqual(f.sum.building, 30 * 60 + 55 * 60);  // 12:30–13:00 and 09:05–10:00
  assert.ok(contiguous(f));
});
check('a draft counts as draft until it is ready, and again when converted back', () => {
  const f = G.flowOf(pr([['q', at(28, 10), 'bob'], ['y', at(28, 12)], ['d', at(29, 9)], ['y', at(29, 10)], ['r', at(29, 11), 'bob', 'approved', 0]]), []);
  assert.deepStrictEqual(f.segs.map(s => [s.s, s.w / H]), [['draft', 3], ['review', 21], ['draft', 1], ['review', 1], ['merge', 4]]);
  assert.strictEqual(f.active, f.total - 4 * H);
});
check('two reviewers: a standing changes request beats an approval until a push and a re-review', () => {
  const f = G.flowOf(pr([['r', at(28, 10), 'bob', 'changes_requested', 0], ['r', at(28, 11), 'carol', 'approved', 0], ['p', at(29, 9)], ['r', at(29, 12), 'bob', 'approved', 0]]), []);
  assert.deepStrictEqual(f.segs.map(s => s.s), ['review', 'author', 'review', 'merge']);
});
check('the weekend is not waiting time', () => {
  const f = G.flowOf(pr([['q', at(25, 17), 'bob'], ['r', at(28, 10), 'bob', 'approved', 0]], { created: at(25, 17), merged: at(28, 11) }), []);
  assert.deepStrictEqual(f.segs.map(s => [s.s, s.w / H]), [['review', 7 + 10], ['merge', 1]]);   // Fri 17:00–24:00 + Mon 00:00–10:00
});
check('stats: medians per stage, and the bottleneck is the biggest queue, not a running CI', () => {
  const mk = (sum) => ({ sum: { draft: 0, red: 0, building: 0, review: 0, author: 0, merge: 0, ...sum }, active: 0, wall: 0 });
  const S = G.flowStats([mk({ review: 10, building: 100 }), mk({ review: 30, author: 5 }), mk({ review: 20, author: 50 })]);
  assert.strictEqual(S.stages.review.median, 20);
  assert.strictEqual(S.bottleneck, 'review');   // review 60 vs author 55; building 100 is nobody's queue
  assert.strictEqual(Math.round(S.neckShare * 100), 52);
});
check('CI spans: a killed run is no verdict, a running one lasts until the next', () => {
  assert.deepStrictEqual(G.ciSpans([{ st: 'killed', c: 10, f: 20 }, { st: 'running', c: 30, f: 0 }]), [{ s: 'building', a: 10, b: 20 }, { s: 'building', a: 30, b: Infinity }]);
});

if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
console.log('\nall passed');
