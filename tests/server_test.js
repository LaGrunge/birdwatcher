#!/usr/bin/env node
// The flakes server against a stub Woodpecker: sync, the endpoints, ETags,
// read-only, no token in any response, and a warm restart that only lists.
//
//   node tests/server_test.js        # exit 1 on any failure
'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { makeStore, makeApi } = require('../server/flakes.js');

const TOKEN = 'secret-token-123';
const NOW = Math.floor(Date.now() / 1000), H = 3600;
const b64 = s => Buffer.from(s).toString('base64');
const MTR_FAIL = 'main.beta  w1 [ fail ]\nmysqltest: At line 3: query failed: 2013: Lost connection\nmain.beta  w1 [ retry-fail ]\nFailing test(s): main.beta';
const MTR_RETRY = 'main.gamma  w1 [ fail ]\nAt line 9: timeout\nmain.gamma  w1 [ retry-pass ]\nmain.beta  w1 [ fail ]\nmysqltest: At line 3: query failed: 2013: Lost connection\nmain.beta  w1 [ retry-fail ]';
// #10 fails mtr (beta), #11 restarts it on the same commit and passes, #12 fails beta for good and gamma passes on a retry.
const step = (id, pid, name, state, a) => ({ id, pid, name, state, type: 'commands', started: a, finished: a + 600 });
const pipe = (n, sha, state, a, parent, mtr) => ({ number: n, event: 'pull_request', status: state, created: a, started: a, finished: a + 900,
  ref: `refs/pull/${n === 12 ? 8 : 7}/head`, commit: sha, parent,
  workflows: [{ name: 'base', state, started: a, finished: a + 900, agent_id: 1, children: [step(n * 10 + 1, 2, 'build', 'success', a), step(n * 10 + 2, 3, 'mtr', mtr, a + 300)] }] });
const PIPES = { 10: pipe(10, 'aaa111', 'failure', NOW - 5 * H, 0, 'failure'), 11: pipe(11, 'aaa111', 'success', NOW - 4 * H, 10, 'success'), 12: pipe(12, 'bbb222', 'failure', NOW - 2 * H, 0, 'failure') };
const LOGS = { '10/102': MTR_FAIL, '12/122': MTR_RETRY };
const hits = [];
const wpStub = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), p = u.pathname;
  hits.push(p);
  const send = (code, v) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(v)); };
  let m;
  // A caller's access check: a reader's cookie or token may see repo 5, nobody else.
  if (p === '/api/repos/5' && req.headers.authorization !== `Bearer ${TOKEN}`) return send(req.headers.cookie === 'user_sess=reader' || req.headers.authorization === 'Bearer reader' ? 200 : 403, {});
  if (req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, {});
  if (p === '/api/repos/lookup/acme/app') return send(200, { id: 5, full_name: 'acme/app', forge_url: 'https://forge/acme/app' });
  if (p === '/api/repos/5/pipelines') return send(200, u.searchParams.get('page') === '1' ? Object.values(PIPES).map(({ workflows, ...x }) => x).reverse() : []);
  if ((m = /^\/api\/repos\/5\/pipelines\/(\d+)$/.exec(p))) return PIPES[m[1]] ? send(200, PIPES[m[1]]) : send(404, {});
  if ((m = /^\/api\/repos\/5\/logs\/(\d+)\/(\d+)$/.exec(p))) return send(200, (LOGS[`${m[1]}/${m[2]}`] || 'ok').split('\n').map((l, i) => ({ line: i, data: b64(l) })));
  send(404, {});
});

let failed = 0;
const check = async (name, fn) => { try { await fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.stack.split('\n').slice(0, 3).join('\n     ')}`); } };

(async () => {
  await new Promise(r => wpStub.listen(0, '127.0.0.1', r));
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flakes-test-'));
  const cfg = { server: `http://127.0.0.1:${wpStub.address().port}`, publicUrl: 'https://ci.example', token: TOKEN, repos: ['acme/app'], dataDir, parsers: [{ steps: ['mtr'], parser: 'mtr' }],
    port: 0, host: '127.0.0.1', basePath: '/flakes', days: 28, events: 'ci', pollSec: 120, parallel: 2, allowOrigin: ['https://board.example'], checkAccess: false };
  const wp = async p => { const r = await fetch(`${cfg.server}/api${p}`, { headers: { Authorization: `Bearer ${cfg.token}` } }); if (!r.ok) throw new Error(`${r.status} ${p}`); return r.json(); };
  const stats = { requests: 0, startedAt: NOW };
  const store = makeStore(cfg, wp), R = await store.open('acme/app');
  const api = http.createServer(makeApi(cfg, store, stats));
  await new Promise(r => api.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${api.address().port}/flakes/v1`;
  const get = async (p, headers = {}) => { const r = await fetch(base + p, { headers }); return { status: r.status, headers: r.headers, text: await r.text() }; };
  const json = async p => JSON.parse((await get(p)).text);
  const bodies = [];

  await check('a cold sync reads every pipeline once and the failed mtr logs only', async () => {
    const r = await store.sync(R);
    assert.deepStrictEqual([r.fetched, r.logsRead], [3, 2]);
    assert.deepStrictEqual(hits.filter(h => h.includes('/logs/')).sort(), ['/api/repos/5/logs/10/102', '/api/repos/5/logs/12/122']);
  });
  await check('tests: flaky ones first, with kind, counts and a fingerprint', async () => {
    const d = await json('/repos/acme/app/tests');
    bodies.push(JSON.stringify(d));
    assert.deepStrictEqual(d.tests.map(t => [t.test, t.kind]), [['main.beta', 'flaky'], ['main.gamma', 'flaky']]);
    const beta = d.tests[0];
    assert.deepStrictEqual([beta.counts.failures, beta.counts.rerun, beta.counts.fail], [2, 1, 1]);
    assert.match(beta.fingerprint, /^fl-[0-9a-f]{8}$/);
    assert.ok(beta.reason.includes('Lost connection'));
    assert.strictEqual((await json('/repos/acme/app/tests?kind=failing')).total, 0);
  });
  await check('one test: occurrences link to the step log, the API log and the excerpt', async () => {
    const d = await json('/repos/acme/app/tests/main.beta');
    bodies.push(JSON.stringify(d));
    const o = d.occurrences.find(x => x.pipeline === 10);
    assert.deepStrictEqual([o.kind, o.passedIn, o.pr, o.step, o.id], ['rerun', 11, 7, 'base › mtr', '10:102']);
    assert.strictEqual(o.links.ui, 'https://ci.example/repos/5/pipeline/10/3');   // publicUrl, not the internal API address
    assert.strictEqual(o.links.log, 'https://ci.example/api/repos/5/logs/10/102');
    assert.strictEqual(o.links.excerpt, '/flakes/v1/repos/acme/app/logs/10/base/mtr');
    assert.strictEqual(d.clusters[0].builds.length, 2);
  });
  await check('the brief is Markdown with the fingerprint label and the builds', async () => {
    const r = await get('/repos/acme/app/tests/main.gamma/brief');
    bodies.push(r.text);
    assert.match(r.headers.get('content-type'), /^text\/markdown/);
    assert.ok(r.text.startsWith('# Flaky test `main.gamma`'));
    assert.ok(r.text.includes('passed on a retry in the same run'));
  });
  await check('steps, a step, its brief, an excerpt, clusters and a fingerprint lookup', async () => {
    const s = await json('/repos/acme/app/steps');
    bodies.push(JSON.stringify(s));
    assert.deepStrictEqual(s.flaky.map(x => [x.step, x.flakes, x.hasTests]), [['base › mtr', 1, true]]);
    const one = await json('/repos/acme/app/steps/base/mtr');
    assert.deepStrictEqual(one.occurrences.map(o => [o.pipeline, o.kind]), [[12, 'fail'], [10, 'flake']]);
    const brief = await get('/repos/acme/app/steps/base/mtr/brief');
    assert.ok(brief.text.includes('## In the failing logs, never in the passing ones'));
    const ex = await json('/repos/acme/app/logs/12/base/mtr');
    assert.deepStrictEqual(ex.tests.map(t => [t.test, t.result]), [['main.gamma', 'flaky'], ['main.beta', 'fail']]);
    const cl = await json('/repos/acme/app/clusters');
    assert.ok(cl.clusters.length >= 2 && /^cl-/.test(cl.clusters[0].fingerprint));
    const fp = (await json('/repos/acme/app/tests')).tests[0].fingerprint;
    assert.strictEqual((await json(`/fingerprints/${fp}`)).test, 'main.beta');
  });
  await check('ETag revalidation answers 304; CORS only for a listed origin', async () => {
    const a = await get('/repos/acme/app/tests', { Origin: 'https://board.example' });
    assert.strictEqual(a.headers.get('access-control-allow-origin'), 'https://board.example');
    assert.strictEqual((await get('/repos/acme/app/tests', { 'If-None-Match': a.headers.get('etag') })).status, 304);
    assert.strictEqual((await get('/repos/acme/app/tests', { Origin: 'https://evil.example' })).headers.get('access-control-allow-origin'), null);
  });
  await check('read-only, unknown paths are 404s, and no response carries the token', async () => {
    assert.strictEqual((await fetch(`${base}/repos/acme/app/tests`, { method: 'POST' })).status, 405);
    assert.strictEqual((await get('/repos/acme/other/tests')).status, 404);
    assert.strictEqual((await get('/nope')).status, 404);
    bodies.push((await get('/health')).text);
    assert.ok(bodies.every(b => !b.includes(TOKEN)));
  });
  await check('with checkAccess, a repo is served only to callers Woodpecker lets read it', async () => {
    const guarded = http.createServer(makeApi({ ...cfg, checkAccess: true }, store, stats));
    await new Promise(r => guarded.listen(0, '127.0.0.1', r));
    const g = (p, headers = {}) => fetch(`http://127.0.0.1:${guarded.address().port}/flakes/v1${p}`, { headers });
    assert.strictEqual((await g('/repos/acme/app/tests')).status, 404);                                              // no credentials
    assert.strictEqual((await g('/repos/acme/app/tests', { Cookie: 'user_sess=stranger' })).status, 404);            // logged in, no access
    assert.strictEqual((await g('/repos/acme/app/tests', { Cookie: 'user_sess=reader' })).status, 200);
    assert.strictEqual((await g('/repos/acme/app/tests/main.beta/brief', { Authorization: 'Bearer reader' })).status, 200);
    assert.deepStrictEqual((await (await g('/repos', { Cookie: 'user_sess=stranger' })).json()).repos, []);
    const fp = (await json('/repos/acme/app/tests')).tests[0].fingerprint;
    assert.strictEqual((await g(`/fingerprints/${fp}`, { Cookie: 'user_sess=stranger' })).status, 404);
    guarded.close();
  });
  await check('a brief fences log text it quotes and says it is untrusted', async () => {
    const md = (await get('/repos/acme/app/tests/main.beta/brief')).text;
    assert.ok(md.includes('untrusted data'));
    assert.ok(md.indexOf('untrusted data') < md.indexOf('```text'));
  });
  await check('a restart from the data dir lists the first page and reads nothing else', async () => {
    hits.length = 0;
    const R2 = await makeStore(cfg, wp).open('acme/app');
    assert.strictEqual(R2.logs.size, 3);   // two from the sync, one excerpt read on demand
    const r = await makeStore(cfg, wp).sync(R2);
    assert.deepStrictEqual([r.fetched, r.logsRead], [0, 0]);
    assert.deepStrictEqual(hits.filter(h => !h.endsWith('/lookup/acme/app')), ['/api/repos/5/pipelines']);
  });

  api.close(); wpStub.close();
  fs.rmSync(dataDir, { recursive: true, force: true });
  if (failed) { console.log(`\n${failed} failed`); process.exit(1); }
  console.log('\nall passed');
})();
