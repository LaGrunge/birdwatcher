// Birdwatcher plugin: a run's pinned inputs from the KEY=VALUE lines one CI
// step prints. Load it after config.js and before board.js; it does nothing
// until the config has `pins`, one entry or a list of them (one per repo):
//
//   pins: {
//     repos: ['acme/app'],              // omit for every repo
//     steps: ['resolve-deps'],          // the first of these a pipeline has is read
//     marker: 'Pinned inputs:',         // only the block after this line; omit for the whole log
//     ignore: ['APP_COMMIT'],           // keys that are not inputs
//     compare: { LIB_SHA: 'https://github.com/acme/lib/compare/{from}...{to}' },
//   },
//
// When main or a cron goes red, the board compares the pins of the last green
// and the first red run, to tell a moved dependency from a code change.
(function () {
  const entries = [(window.BIRDWATCHER_CONFIG || {}).pins || []].flat()
    .filter(c => c && typeof c === 'object' && Array.isArray(c.steps) && c.steps.length);
  const plugins = window.BIRDWATCHER_PLUGINS = window.BIRDWATCHER_PLUGINS || [];
  for (const c of entries) plugins.push({
    name: 'kv-pins',
    repos: Array.isArray(c.repos) ? c.repos : undefined,
    pins: {
      steps: c.steps.map(String),
      parse: (log, kit) => kit.kv(log, { marker: String(c.marker || ''), ignore: Array.isArray(c.ignore) ? c.ignore : [] }),
      link: (key, from, to) => {
        const t = (c.compare || {})[key];
        return typeof t === 'string' ? t.replace('{from}', encodeURIComponent(from)).replace('{to}', encodeURIComponent(to)) : '';
      },
    },
  });
})();
