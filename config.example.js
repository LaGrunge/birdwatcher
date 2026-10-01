// Site settings for Birdwatcher. Copy to config.js and fill in.
//
//   * standalone: index.html loads config.js, then board.js.
//   * inside Woodpecker: serve `cat config.js board.js` as
//     WOODPECKER_CUSTOM_JS_FILE (Woodpecker takes a single file).
//
// Every key is optional; a missing one turns its feature off.
window.BIRDWATCHER_CONFIG = {
  navLabel: 'Birdwatcher',             // link added to Woodpecker's navbar
  boardPath: '/birdwatcher',           // route the board renders at inside Woodpecker
  server: 'https://woodpecker.example.com',   // default Woodpecker server (standalone)
  primaryRepo: 'acme/app',             // listed first; the only repo with the Main tab
  loginPrefix: '',                     // stripped from GitHub logins for display, e.g. 'acme-'

  // Project key → browse URL prefix; PROJ-123 in a PR title or branch becomes a link.
  trackers: {
    PROJ: 'https://acme.atlassian.net/browse/',
  },

  // A run's pinned inputs, read by plugins/kv-pins.js: the KEY=VALUE lines one
  // step prints. When main or a cron goes red, the board compares them between
  // the last green and the first red run, to tell a moved dependency from a
  // code change. One entry, or a list of them (one per repo).
  pins: {
    repos: ['acme/app'],                 // omit for every repo
    steps: ['resolve-deps'],             // the first of these a pipeline has is read
    marker: 'Pinned inputs:',            // only the block after this line; omit for the whole log
    ignore: ['APP_COMMIT'],              // keys that are not inputs (the run's own commit, a format version)
    compare: { LIB_SHA: 'https://github.com/acme/lib/compare/{from}...{to}' },
  },

  // HTML comment markers (<!-- ci-report -->) of the CI's PR report comments.
  reportMarkers: { bench: 'ci-report', cov: 'coverage-report' },

  // Where the Main tab reads the benchmark baseline, the lcov coverage
  // baseline and the nightly report. Leave out to hide the Main tab.
  reports: {
    name: 'the reports host',          // how the board refers to it in messages
    host: 'reports.example.com',       // also the only host whose links a report may surface
    proxyPath: '/reports',             // same-origin proxy to `host` when embedded in Woodpecker
    standaloneUrl: 'https://reports.example.com/birdwatcher/index.html',
    paths: {
      bench:         '/app/benchmarks/baseline.json',
      covInfo:       '/app/coverage/baseline.info',
      covPipelines:  '/app/coverage/pipelines/',
      nightlyDir:    '/app/nightly_bench/',
      nightlyLatest: '/app/nightly_bench/latest.json',
    },
    // The nightly report compares your product with a baseline system.
    // `key` is the JSON field prefix (tpcc.<key>_tpmc, tpch.<key>_geomean_s,
    // per_txn[i].<key>, per_query[i].<key>_s); `label` is what the board shows.
    nightly: {
      subject:  { key: 'app', label: 'App' },
      baseline: { key: 'ref', label: 'Reference', legend: 'Reference (SQL)', versionKey: 'ref' },
    },
  },
};
