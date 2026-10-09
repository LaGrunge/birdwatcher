#!/usr/bin/env node
// Birdwatcher flakes server: the CI weather data as a small read-only REST API,
// for people (the board's CI weather tab) and for agents that triage, fix and
// file flaky tests. Zero dependencies. The logic is board.js's own: the pure
// blocks between its @timeline / @game / @runs markers are loaded as they are,
// so the board and the server can't disagree.
//
//   WOODPECKER_TOKEN=… node server/flakes.js --config flakes.json          # serve, sync every pollSec
//   WOODPECKER_TOKEN=… node server/flakes.js --config flakes.json --once   # sync once, print a summary, exit
//
// Config (JSON, see server/flakes.example.json): server (where the API is
// read; publicUrl, if set, is what links point to), repos, dataDir,
// parsers (which steps hold tests, and how to read them), port, host,
// basePath, days, pollSec, allowOrigin. Woodpecker is read with one token
// from the environment; responses never carry it. Nothing here writes to
// Woodpecker, GitHub or anywhere but dataDir.
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

// ---------------------------------------------------------------- the board's logic
function loadBoard(file = path.join(__dirname, '..', 'board.js')) {
  let code = '', inside = false;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (/\/\/ @(timeline|game|runs)-begin/.test(line)) { inside = true; continue; }
    if (/\/\/ @(timeline|game|runs)-end/.test(line)) { inside = false; continue; }
    if (inside) code += line + '\n';
  }
  const prelude = 'const tsOf = iso => iso ? Math.floor(new Date(iso) / 1000) : 0; const safeUrl = u => u; const pc = { automation: [] }; const pcSave = () => {};\n';
  return new Function(prelude + code + `\nreturn { trimRun, flakes, verdictOf, prOf, dayOf, DAY, RUNS_DAYS, RUNS_V, WX_EVENTS, RUN_LIVE,
    logExcerpt, recurring, flakeBrief, parserFor, testFlakes, whyClusters, reasonOf, testBrief, testFingerprint, TEST_PARSERS, testsFrom, testParser };`)();
}
const B = loadBoard();

// ---------------------------------------------------------------- config
function readConfig(argv) {
  const at = argv.indexOf('--config');
  const file = at >= 0 ? argv[at + 1] : process.env.FLAKES_CONFIG;
  if (!file) throw new Error('no config: pass --config <file.json> or set FLAKES_CONFIG');
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!c.server || !Array.isArray(c.repos) || !c.repos.length) throw new Error('config needs `server` and `repos`');
  const token = process.env[c.tokenEnv || 'WOODPECKER_TOKEN'];
  if (!token) throw new Error(`no Woodpecker token in $${c.tokenEnv || 'WOODPECKER_TOKEN'}`);
  return {
    server: c.server.replace(/\/+$/, ''), publicUrl: (c.publicUrl || c.server).replace(/\/+$/, ''), token, repos: c.repos, parsers: c.parsers || [],
    dataDir: path.resolve(path.dirname(file), c.dataDir || 'flakes-data'),
    port: c.port || 8090, host: c.host || '127.0.0.1', basePath: (c.basePath || '/flakes').replace(/\/+$/, ''),
    days: Math.min(90, c.days || B.RUNS_DAYS), events: c.events === 'all' ? 'all' : 'ci',
    pollSec: c.pollSec || 120, parallel: c.parallel || 4, allowOrigin: c.allowOrigin || [],
  };
}

// ---------------------------------------------------------------- Woodpecker
function makeWp(cfg, stats) {
  return async function wp(p) {
    stats.requests++;
    const r = await fetch(`${cfg.server}/api${p}`, { headers: { Authorization: `Bearer ${cfg.token}`, Accept: 'application/json' } });
    if (!r.ok) throw new Error(`Woodpecker ${r.status} on ${p}`);
    return r.json();
  };
}
async function pmap(items, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) { const x = items[i++]; await fn(x); } }));
}
const now = () => Math.floor(Date.now() / 1000);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
function writeJson(f, v) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f + '.tmp', JSON.stringify(v)); fs.renameSync(f + '.tmp', f); }

// ---------------------------------------------------------------- the store
// Per repo in dataDir/<repo id>/: runs.json (trimmed pipelines, as the board
// keeps them) and logs/<pipeline>-<step id>.json (a read log: its excerpt and,
// for a step with a parser, its tests; never the log itself). A finished
// pipeline never changes, so neither does anything read from it.
function makeStore(cfg, wp) {
  const repos = new Map();   // full name → { id, name, forge, runs: {n: rec}, logs: Map, state }
  // A log is re-read when the parser config or the parsers' code changed.
  const parserCode = [B.testsFrom, B.testParser, ...Object.values(B.TEST_PARSERS)].map(String).join('\n');
  const parserKey = crypto.createHash('sha1').update(JSON.stringify(cfg.parsers) + parserCode).digest('hex').slice(0, 8);
  const dirOf = R => path.join(cfg.dataDir, String(R.id));
  const logFile = (R, n, id) => path.join(dirOf(R), 'logs', `${n}-${id}.json`);

  async function open(name) {
    const meta = await wp(`/repos/lookup/${name}`);
    const R = { id: meta.id, name: meta.full_name || name, forge: meta.forge_url || '', runs: {}, logs: new Map(),
      state: { syncing: false, lastSync: 0, errors: [], logsPending: 0 } };
    R.runs = readJson(path.join(dirOf(R), 'runs.json'), {});
    const ld = path.join(dirOf(R), 'logs');
    for (const f of fs.existsSync(ld) ? fs.readdirSync(ld) : []) { const v = readJson(path.join(ld, f)); if (v) R.logs.set(`${v.n}|${v.key}`, v); }
    repos.set(R.name, R);
    return R;
  }

  // The same walk as the board's loadRuns(): list pages until one has nothing new, then each new finished pipeline's detail once.
  async function syncRuns(R) {
    const cutoff = now() - cfg.days * B.DAY, after = encodeURIComponent(new Date(cutoff * 1000).toISOString());
    for (const [k, r] of Object.entries(R.runs)) if (r.c < cutoff - B.DAY) delete R.runs[k];
    const want = [];
    for (let page = 1; page <= 60; page++) {
      const chunk = await wp(`/repos/${R.id}/pipelines?after=${after}&per_page=50&page=${page}`);
      let known = 0;
      for (const p of chunk || []) {
        const c = R.runs[p.number], done = !B.RUN_LIVE.includes(p.status);
        if (c?.wf && done && (c.v || 0) >= B.RUNS_V) { known++; continue; }
        if (done) want.push(p.number); else R.runs[p.number] = B.trimRun(p);
      }
      if (!chunk || chunk.length < 50 || known === chunk.length) break;
    }
    for (const r of Object.values(R.runs)) if (r.wf && (r.v || 0) < B.RUNS_V && !want.includes(r.n)) want.push(r.n);
    let failed = 0;
    await pmap(want, cfg.parallel, async n => { try { R.runs[n] = B.trimRun(await wp(`/repos/${R.id}/pipelines/${n}`)); } catch { failed++; } });
    writeJson(path.join(dirOf(R), 'runs.json'), R.runs);
    return { fetched: want.length - failed, failed };
  }

  // One step log, read once: its excerpt, and its tests when a parser covers the step.
  async function readLog(R, n, key) {
    const have = R.logs.get(`${n}|${key}`);
    if (have && (have.parserKey === parserKey || !B.parserFor(cfg.parsers, key))) return have;
    const r = R.runs[n], i = key.indexOf(' › ');
    const st = r?.wf?.find(w => w.n === key.slice(0, i))?.st?.[key.slice(i + 3)];
    if (!st?.[3]) throw new Error(`no step ${key} with a known id in #${n}`);
    const lines = await wp(`/repos/${R.id}/logs/${n}/${st[3]}`);
    const text = (lines || []).map(l => l.data ? Buffer.from(l.data, 'base64').toString('utf8') : '').join('\n');
    const parse = B.parserFor(cfg.parsers, key);
    const v = { n, key, id: st[3], pid: st[2] || 0, at: now(), parserKey, ex: B.logExcerpt(text), tests: parse ? parse(text).tests : null };
    R.logs.set(`${n}|${key}`, v);
    writeJson(logFile(R, n, st[3]), v);
    return v;
  }
  // Every failed step a parser covers, inside the window and not read yet.
  async function syncLogs(R) {
    const cutoff = now() - cfg.days * B.DAY, todo = [];
    for (const r of Object.values(R.runs)) {
      if (!r.wf || r.c < cutoff) continue;
      for (const w of r.wf) for (const [step, [k, , , id]] of Object.entries(w.st || {})) {
        const key = `${w.n} › ${step}`;
        if ((k === 'f' || k === 'e') && id && B.parserFor(cfg.parsers, key)) { const h = R.logs.get(`${r.n}|${key}`); if (!h || h.parserKey !== parserKey) todo.push([r.n, key]); }
      }
    }
    R.state.logsPending = todo.length;
    let failed = 0;
    await pmap(todo, cfg.parallel, async ([n, key]) => { try { await readLog(R, n, key); } catch { failed++; } R.state.logsPending--; });
    return { read: todo.length - failed, failed };
  }
  async function sync(R) {
    if (R.state.syncing) return null;
    R.state.syncing = true;
    try {
      const a = await syncRuns(R), b = await syncLogs(R);
      R.state.errors = [a.failed && `${a.failed} pipelines could not be read`, b.failed && `${b.failed} logs could not be read`].filter(Boolean);
      R.state.lastSync = now();
      return { ...a, logsRead: b.read };
    } catch (e) { R.state.errors = [e.message]; return null; }
    finally { R.state.syncing = false; }
  }
  return { repos, open, sync, readLog, parserKey };
}

// ---------------------------------------------------------------- the API
// Everything is GET and JSON (a brief is text/markdown), ordered
// deterministically, with an ETag. Paths, under basePath + /v1:
//   /health                                   sync state and request count
//   /repos                                    the repos served
//   /repos/{owner}/{name}/tests               flaky, intermittent and failing tests (?kind= &status= &q= &days= &events=all &limit=)
//   /repos/{owner}/{name}/tests/{test}        one test: every failure with its build, links and output, reasons clustered
//   /repos/{owner}/{name}/tests/{test}/brief  a Markdown task to fix (or file) it
//   /repos/{owner}/{name}/clusters            failure reasons shared across tests: one cause, many tests (?kind=)
//   /repos/{owner}/{name}/steps               flaky steps and steps that only fail for real (?days= &events=all)
//   /repos/{owner}/{name}/steps/{workflow}/{step}        every failed build of a step, with links
//   /repos/{owner}/{name}/steps/{workflow}/{step}/brief  the board's step brief, its logs read on demand
//   /repos/{owner}/{name}/logs/{pipeline}/{workflow}/{step}  one step log's excerpt (read on demand)
//   /fingerprints/{fp}                        which test a ticket label points to
function makeApi(cfg, store, stats) {
  const v1 = `${cfg.basePath}/v1`;
  const iso = t => t ? new Date(t * 1000).toISOString() : null;
  const pub = cfg.publicUrl || cfg.server;
  const links = (R, n, pid, id) => ({
    ui: `${pub}/repos/${R.id}/pipeline/${n}${pid ? `/${pid}` : ''}`,
    log: id ? `${pub}/api/repos/${R.id}/logs/${n}/${id}` : null,
  });
  const window_ = q => ({ days: Math.max(1, Math.min(cfg.days, +q.get('days') || cfg.days)), events: q.get('events') === 'all' || cfg.events === 'all' ? 'all' : 'ci' });
  const recs = R => Object.values(R.runs);
  const parsedOf = R => new Map([...R.logs.entries()].filter(([, v]) => v.tests).map(([k, v]) => [k, v]));
  const testsOf = (R, w) => B.testFlakes(recs(R), parsedOf(R), now(), w.days, B.WX_EVENTS[w.events], R.name);
  const change = o => ({ event: o.ev, sha: o.sha, pr: o.pr || null, ref: o.ref || null });
  const testSummary = (R, T) => ({
    test: T.test, fingerprint: T.fingerprint, kind: T.kind, status: T.status, steps: T.steps, workflows: T.workflows,
    counts: T.counts, rate: +T.rate.toFixed(4), firstSeen: iso(T.firstAt), lastSeen: iso(T.lastAt),
    reason: B.whyClusters(T.occurrences)[0]?.text || null,
    url: `${v1}/repos/${R.name}/tests/${encodeURIComponent(T.test)}`,
  });
  const testDetail = (R, T) => ({
    ...testSummary(R, T),
    clusters: B.whyClusters(T.occurrences).map(c => ({ reason: c.text, signature: c.sig, builds: c.builds })),
    occurrences: T.occurrences.map(o => ({ id: `${o.n}:${o.id || o.pid}`, pipeline: o.n, step: o.key, at: iso(o.at), ...change(o),
      attempt: o.attempt, attempts: o.attempts, kind: o.kind, passedIn: o.passN || null, logLine: o.line, reason: B.reasonOf(o.why), output: o.why,
      links: { ...links(R, o.n, o.pid, o.id), excerpt: `${v1}/repos/${R.name}/logs/${o.n}/${o.key.split(' › ').map(encodeURIComponent).join('/')}` } })),
    brief: `${v1}/repos/${R.name}/tests/${encodeURIComponent(T.test)}/brief`,
  });
  const stepEvents = (R, X, key) => [
    ...X.events.filter(e => e.key === key).map(e => ({ ...e, kind: 'flake' })),
    ...X.real.filter(e => e.key === key).map(e => ({ ...e, kind: 'fail' })),
  ].sort((a, b) => b.at - a.at || b.n - a.n);
  const stepId = (R, n, key) => { const i = key.indexOf(' › '); return R.runs[n]?.wf?.find(w => w.n === key.slice(0, i))?.st?.[key.slice(i + 3)]?.[3] || 0; };

  async function route(method, url) {
    if (method !== 'GET') return [405, { error: 'read-only API: GET only' }];
    const u = new URL(url, 'http://x'), q = u.searchParams;
    if (!u.pathname.startsWith(v1 + '/') && u.pathname !== v1) return [404, { error: `not under ${v1}` }];
    const parts = u.pathname.slice(v1.length).split('/').filter(Boolean).map(decodeURIComponent);
    if (parts[0] === 'health') return [200, { ok: [...store.repos.values()].every(R => !R.state.errors.length), woodpeckerRequests: stats.requests, startedAt: iso(stats.startedAt),
      repos: [...store.repos.values()].map(R => ({ repo: R.name, pipelines: Object.keys(R.runs).length, logsRead: R.logs.size, logsPending: R.state.logsPending, syncing: R.state.syncing, lastSync: iso(R.state.lastSync), errors: R.state.errors })) }];
    if (parts[0] === 'repos' && parts.length === 1) return [200, { repos: [...store.repos.values()].map(R => ({ repo: R.name, id: R.id, forge: R.forge, tests: `${v1}/repos/${R.name}/tests`, steps: `${v1}/repos/${R.name}/steps` })) }];
    if (parts[0] === 'fingerprints' && parts[1]) {
      for (const R of store.repos.values()) {
        const T = testsOf(R, { days: cfg.days, events: 'all' }).find(t => t.fingerprint === parts[1]);
        if (T) return [200, testSummary(R, T)];
      }
      return [404, { error: `no test with fingerprint ${parts[1]} in the last ${cfg.days} days` }];
    }
    if (parts[0] !== 'repos' || parts.length < 4) return [404, { error: 'unknown path', see: `${v1}/repos` }];
    const R = store.repos.get(`${parts[1]}/${parts[2]}`);
    if (!R) return [404, { error: `repo ${parts[1]}/${parts[2]} is not served` }];
    const w = window_(q), rest = parts.slice(3);
    if (rest[0] === 'tests') {
      const all = testsOf(R, w);
      if (rest.length === 1) {
        const kinds = (q.get('kind') || '').split(',').filter(Boolean), sts = (q.get('status') || '').split(',').filter(Boolean), needle = (q.get('q') || '').toLowerCase();
        const list = all.filter(T => (!kinds.length || kinds.includes(T.kind)) && (!sts.length || sts.includes(T.status)) && (!needle || T.test.toLowerCase().includes(needle)));
        const limit = Math.max(1, Math.min(500, +q.get('limit') || 100));
        return [200, { repo: R.name, window: w, asOf: iso(R.state.lastSync), total: list.length, tests: list.slice(0, limit).map(T => testSummary(R, T)) }];
      }
      const T = all.find(t => t.test === rest[1]);
      if (!T) return [404, { error: `no failures of ${rest[1]} in the window` }];
      if (rest[2] === 'brief') return [200, B.testBrief(T, { repo: R.name, days: w.days, uiUrl: (n, pid) => links(R, n, pid).ui, apiUrl: (n, id) => links(R, n, 0, id).log }), 'text/markdown; charset=utf-8'];
      return [200, testDetail(R, T)];
    }
    if (rest[0] === 'clusters') {
      const kinds = (q.get('kind') || 'flaky,intermittent').split(',').filter(Boolean);
      const by = new Map();
      for (const T of testsOf(R, w).filter(t => kinds.includes(t.kind))) {
        for (const c of B.whyClusters(T.occurrences)) {
          const C = by.get(c.sig) || (by.set(c.sig, { reason: c.text, signature: c.sig, tests: [], builds: new Set() }), by.get(c.sig));
          C.tests.push({ test: T.test, fingerprint: T.fingerprint, kind: T.kind, builds: c.builds.length, url: `${v1}/repos/${R.name}/tests/${encodeURIComponent(T.test)}` });
          c.builds.forEach(n => C.builds.add(n));
        }
      }
      const list = [...by.values()].map(C => ({ ...C, builds: [...C.builds].sort((a, b) => b - a), fingerprint: `cl-${B.testFingerprint(R.name, C.signature).slice(3)}` }))
        .sort((a, b) => b.tests.length - a.tests.length || b.builds.length - a.builds.length || (a.signature < b.signature ? -1 : 1));
      return [200, { repo: R.name, window: w, asOf: iso(R.state.lastSync), clusters: list }];
    }
    if (rest[0] === 'steps') {
      const X = B.flakes(recs(R), now(), w.days, B.WX_EVENTS[w.events]);
      const sum = s => ({ step: s.key, workflow: s.wf, name: s.step, flakes: s.flakes, failures: s.genuine, passes: s.passes, rate: +s.rate.toFixed(4), lastFlake: iso(s.lastAt), lostSec: Math.round(s.lostSec),
        hasTests: !!B.parserFor(cfg.parsers, s.key), url: `${v1}/repos/${R.name}/steps/${encodeURIComponent(s.wf)}/${encodeURIComponent(s.step)}` });
      if (rest.length === 1) return [200, { repo: R.name, window: w, asOf: iso(R.state.lastSync), flaky: X.steps.map(sum), failing: X.failing.map(sum) }];
      const key = `${rest[1]} › ${rest[2]}`, s = X.steps.find(x => x.key === key) || X.failing.find(x => x.key === key);
      if (!s) return [404, { error: `no failures of ${key} in the window` }];
      const evs = stepEvents(R, X, key);
      if (rest[3] === 'brief') {
        const flaky = X.events.filter(e => e.key === key), logs = new Map();
        const need = [...flaky.slice(0, 5).map(e => e.n), ...new Set(flaky.slice(0, 5).map(e => e.passN))].slice(0, 7);
        await pmap(need, cfg.parallel, async n => { try { const v = await store.readLog(R, n, key); logs.set(n, { ex: v.ex, stepId: v.id, pid: v.pid }); } catch {} });
        const fails = flaky.filter(e => logs.has(e.n)).map(e => ({ n: e.n, ex: logs.get(e.n).ex }));
        const passes = [...new Set(flaky.map(e => e.passN))].filter(n => logs.has(n)).map(n => ({ n, ex: logs.get(n).ex }));
        return [200, B.flakeBrief({ repo: R.name, s, flaky, real: X.real.filter(e => e.key === key), logs, cause: B.recurring(fails, passes), days: w.days,
          uiUrl: (n, pid) => links(R, n, pid).ui, apiUrl: (n, id) => links(R, n, 0, id).log }), 'text/markdown; charset=utf-8'];
      }
      return [200, { ...sum(s), occurrences: evs.map(e => ({ id: `${e.n}:${stepId(R, e.n, key) || e.pid}`, pipeline: e.n, at: iso(e.at), ...change(e), kind: e.kind, attempt: e.attempt, attempts: e.attempts,
        passedIn: e.passN || null, durationSec: e.sec, links: { ...links(R, e.n, e.pid, stepId(R, e.n, key)), passed: e.passN ? links(R, e.passN, e.passPid, stepId(R, e.passN, key)).ui : null,
          excerpt: `${v1}/repos/${R.name}/logs/${e.n}/${encodeURIComponent(rest[1])}/${encodeURIComponent(rest[2])}` } })) }];
    }
    if (rest[0] === 'logs' && rest.length === 4) {
      const n = +rest[1], key = `${rest[2]} › ${rest[3]}`;
      if (!R.runs[n]) return [404, { error: `pipeline #${n} is not in the window` }];
      try {
        const v = await store.readLog(R, n, key);
        return [200, { pipeline: n, step: key, links: links(R, n, v.pid, v.id), excerpt: v.ex, tests: v.tests }];
      } catch (e) { return [404, { error: e.message }]; }
    }
    return [404, { error: 'unknown path', see: `${v1}/repos/${R.name}/tests` }];
  }

  return async (req, res) => {
    let status, body, type = 'application/json; charset=utf-8';
    try { [status, body, type = type] = await route(req.method, req.url); }
    catch (e) { status = 500; body = { error: e.message }; }
    const text = typeof body === 'string' ? body : JSON.stringify(body, null, 1);
    const etag = `"${crypto.createHash('sha1').update(text).digest('hex').slice(0, 16)}"`;
    const origin = req.headers.origin;
    const headers = { 'Content-Type': type, ETag: etag, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' };
    if (origin && cfg.allowOrigin.includes(origin)) Object.assign(headers, { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' });
    if (status === 200 && req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    res.writeHead(status, headers);
    res.end(text);
  };
}

// ---------------------------------------------------------------- main
async function main(argv) {
  const cfg = readConfig(argv), stats = { requests: 0, startedAt: now() };
  const store = makeStore(cfg, makeWp(cfg, stats));
  for (const name of cfg.repos) await store.open(name);
  const log = (...a) => console.error(new Date().toISOString(), ...a);
  const syncAll = async () => {
    for (const R of store.repos.values()) {
      const t0 = Date.now(), r = await store.sync(R);
      log(`${R.name}: ${r ? `${r.fetched} pipelines, ${r.logsRead} logs read` : 'sync failed'}${R.state.errors.length ? ` (${R.state.errors.join('; ')})` : ''} in ${((Date.now() - t0) / 1000).toFixed(0)}s, ${stats.requests} Woodpecker requests so far`);
    }
  };
  if (argv.includes('--once')) {
    await syncAll();
    const api = makeApi(cfg, store, stats);
    for (const R of store.repos.values()) {
      const T = B.testFlakes(Object.values(R.runs), new Map([...R.logs].filter(([, v]) => v.tests)), now(), cfg.days, B.WX_EVENTS[cfg.events], R.name);
      console.log(`${R.name}: ${T.filter(t => t.kind === 'flaky').length} flaky, ${T.filter(t => t.kind === 'intermittent').length} intermittent, ${T.filter(t => t.kind === 'failing').length} failing tests`);
    }
    return api;
  }
  const server = http.createServer(makeApi(cfg, store, stats));
  server.listen(cfg.port, cfg.host, () => log(`serving ${cfg.basePath}/v1 on http://${cfg.host}:${cfg.port}`));
  const loop = async () => { await syncAll(); setTimeout(loop, cfg.pollSec * 1000); };
  loop();
  return server;
}

if (require.main === module) main(process.argv.slice(2)).catch(e => { console.error(e.message); process.exit(1); });
module.exports = { loadBoard, makeStore, makeApi, readConfig };
