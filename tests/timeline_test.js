#!/usr/bin/env node
// The review timeline fold, checked against a real trap.
//
// The CI posts its report comments (<!-- ci-report -->,
// <!-- coverage-report -->) with a human's GitHub token. The board
// learns that login as "automation" so the CI's narration comments never
// count as review feedback — but the same human's reviews, review requests
// and inline threads must still count, otherwise a PR they sent back to the
// author shows "Request a reviewer" (seen on real PRs, 2026-09-10).
//
//   node tests/timeline_test.js        # exit 1 on any failure
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'board.js'), 'utf8').split('\n');
let code = '', inside = false;
for (const line of src) {
  if (line.includes('// @timeline-begin')) { inside = true; continue; }
  if (line.includes('// @timeline-end')) { inside = false; continue; }
  if (inside || line.includes('// @matrix-line')) code += line + '\n';
}
const prelude = `
  const tsOf = iso => iso ? Math.floor(new Date(iso) / 1000) : 0;
  const safeUrl = u => u;
  const pc = { automation: [] };
  const pcSave = () => {};
`;
const T = new Function(prelude + code + '\nreturn { summarizeTimeline, summarizeThreads, isBot, isNoise, automation };')();

const AUTHOR = 'alice', REVIEWER = 'bob';
const human = login => ({ login, type: 'User' });
const pr = { author: AUTHOR };

// A real PR as GitHub's issue timeline returned it, in order.
const events = [
  { event: 'committed', committer: { date: '2026-09-10T15:29:41Z' } },
  { event: 'review_requested', actor: human(AUTHOR), created_at: '2026-09-10T15:32:14Z', requested_reviewer: human(REVIEWER) },
  { event: 'reviewed', user: { login: 'gemini-code-assist[bot]', type: 'Bot' }, state: 'commented', submitted_at: '2026-09-10T15:32:16Z' },
  { event: 'commented', actor: human(REVIEWER), created_at: '2026-09-10T16:18:01Z', body: '<!-- ci-report -->\n# CI\n…' },
  { event: 'reviewed', user: human(REVIEWER), state: 'changes_requested', submitted_at: '2026-09-10T16:20:22Z' },
  { event: 'commented', actor: human(REVIEWER), created_at: '2026-09-10T16:26:30Z', body: '<!-- coverage-report -->\n# Coverage\n…' },
];

let failures = 0;
const check = (name, fn) => { try { fn(); console.log(`✓ ${name}`); } catch (e) { failures++; console.log(`✗ ${name}\n  ${e.message}`); } };

check('the report poster is learned as automation', () => {
  T.summarizeTimeline(events, pr);
  assert(T.automation.has(REVIEWER));
  assert(T.isNoise(human(REVIEWER)), 'their plain comments are noise');
  assert(!T.isBot(human(REVIEWER)), 'but they are not a GitHub bot');
});

check('their changes-requested review still counts (second pass, login already learned)', () => {
  const rv = T.summarizeTimeline(events, pr);
  assert.deepStrictEqual(Object.keys(rv.reviews), [REVIEWER]);
  assert.strictEqual(rv.reviews[REVIEWER].state, 'changes_requested');
  assert(rv.changesRequested && !rv.approved);
  assert.strictEqual(rv.requestedAt[REVIEWER], Math.floor(Date.parse('2026-09-10T15:32:14Z') / 1000));
});

check('report comments are not feedback, the review is', () => {
  const rv = T.summarizeTimeline(events, pr);
  assert.strictEqual(rv.lastFeedback, Math.floor(Date.parse('2026-09-10T16:20:22Z') / 1000));
});

check('a plain narration comment from the learned login is ignored', () => {
  const rv = T.summarizeTimeline([{ event: 'commented', actor: human(REVIEWER), created_at: '2026-09-10T17:00:00Z', body: 'Pushed 3 commits' }], pr);
  assert.strictEqual(rv.lastFeedback, 0);
});

check('their inline review threads stay open for the author', () => {
  const t = T.summarizeThreads([{ id: 1, user: human(REVIEWER), created_at: '2026-09-10T16:20:00Z', html_url: 'u', path: 'a.cpp', line: 3, body: 'why?' }], pr);
  assert.strictEqual(t.openThreads, 1);
});

check('GitHub bots are still dropped everywhere', () => {
  const bot = { login: 'gemini-code-assist[bot]', type: 'Bot' };
  const rv = T.summarizeTimeline([{ event: 'reviewed', user: bot, state: 'approved', submitted_at: '2026-09-10T16:20:22Z' }], pr);
  assert.deepStrictEqual(rv.reviews, {});
  assert.strictEqual(T.summarizeThreads([{ id: 1, user: bot, created_at: '2026-09-10T16:20:00Z' }], pr).openThreads, 0);
});

if (failures) { console.log(`${failures} failure(s)`); process.exit(1); }
console.log('✓ the review fold keeps a report-posting human\'s reviews');
