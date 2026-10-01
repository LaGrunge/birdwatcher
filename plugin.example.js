// A Birdwatcher site plugin of your own: what only your repository's CI knows.
// Pins printed as KEY=VALUE lines need no code — plugins/kv-pins.js reads them
// from `pins` in config.js; write a plugin like this one for any other format.
// Load it after config.js and before board.js (inside Woodpecker:
// `cat config.js plugins/kv-pins.js plugin.js board.js > woodpecker.js`).
// Every field is optional.
(window.BIRDWATCHER_PLUGINS = window.BIRDWATCHER_PLUGINS || []).push({
  repos: ['acme/app'],                 // which repos it applies to; omit for all

  // A run's pinned inputs. When main or a cron goes red, the board compares
  // them between the last green and the first red run, to tell a moved
  // dependency from a code change.
  pins: {
    // The first of these steps a pipeline has is read.
    steps: ['resolve-deps'],
    // The step's log → { KEY: value } or null. Here: a JSON line; kit.kv reads
    // KEY=VALUE lines (with a marker, only the block after the line holding it).
    parse: log => { const m = /^pins: (\{.*\})$/m.exec(log); return m ? JSON.parse(m[1]) : null; },
    // Where two values of one pin can be compared ('' for none).
    link: (key, from, to) => ({
      LIB_SHA: `https://github.com/acme/lib/compare/${from}...${to}`,
    })[key] || '',
  },
});
