<p align="center"><img src="birdwatcher.png" alt="Birdwatcher" width="280"></p>

# Birdwatcher

A status board for [Woodpecker CI](https://woodpecker-ci.org) that turns the
open pull requests of your repositories into one plan: who owes which move so
that the queue drains. It runs inside the Woodpecker UI on the viewer's own
session, or standalone as a static page.

Nine tabs. On a desktop (1200 px and wider) they sit in a rail under the
logo, one button per tab with its own icon and colour, grouped Now / Team /
CI, with the same counts as the tab strip narrower screens keep.

- **Latest** — the latest build of the default branch and every cron job, as
  cards or a compact strip (Collapse / Details), with each one's recent runs
  and failed steps; the count is how many of them are red.

  A red main or a red cron is an **incident**, owned by whoever merged to
  main last (not always fair, but always somebody: there are no on-call
  rotas). A PR that was green was green on the old main, so the merge after
  which main went red proves nothing alone: a flake, a moved dependency or
  the agents break main too, and the board claims only what the runs show.
  One red run is *unconfirmed*: rerun it. A rerun or the next run red on one
  of the same steps confirms the break, and the first red run is compared
  with the last green one: the code moved and the pins did not → *fix or
  revert* (the merges in between are the suspects, with a compare link); a
  pin moved and the code did not → *pin back or report upstream* (`LIB_SHA
  1111aaaa → 3333cccc`, linked to the dependency's compare); both → *split
  the suspects*, unless a suspect merge's own PR was green on the new pins
  (matched by commit or subject among the PR runs the board already lists),
  which clears them → *fix or revert*; neither → *check the agents*. A cron
  whose runs print no pins can't rule a dependency out → *find the break*.
  The pins come from a plugin (`plugins/kv-pins.js` and `pins` in the
  config; see [Plugins](#plugins)), read once per finished run and cached;
  without one the board compares commits only. The incident card sits on Latest and at the
  top of its owner's Actions; "Who owes what" counts it under *Main*. A red
  PR that fails only steps a confirmed main incident fails, in a run after
  main's last green one, is *Main red*: main's owner moves first, its author
  doesn't. Merging stays open.
- **Actions** (default) — the plan for the logged-in GitHub login: what each of
  their open PRs is blocked on and what they owe others as a reviewer, one
  imperative heading per bucket with the PRs under it. The buckets, first match
  wins: draft with red CI → *fix or close*; ready PR with red CI → *fix CI*;
  pipeline waiting for manual approval → *approve it* (admins only); no
  pipeline on the head commit, or only a skipped / cancelled one → *rerun
  CI*; nothing from the author for 14+ days → *revive or close* (this comes
  before "do not merge", so a parked PR is parked for two weeks at most);
  stacked on a branch no open PR carries any more → *retarget to main*;
  conflicts with main → *rebase*; approved and behind → *rebase*; approved,
  green, mergeable, every thread answered → *merge*; approved and green but
  GitHub still blocks the merge (branch protection: a second approval, a
  CODEOWNER, a required check) → the requested reviewer who hasn't approved
  owes it, otherwise the author *gets the missing approval or check*; an
  inline review thread without the author's reply, changes requested, or the
  last word is a reviewer's → *answer every review comment*; ready with nobody
  asked → *request a reviewer*; requested and unanswered for 2+ days → *ping
  the reviewers*; draft with green CI → *mark ready*; draft without CI → *run
  CI or close it*. Reviewer side: *review it* (requested, nothing from you on
  the current head) and *re-review* (the author moved after your last review,
  or the PR waits on reviewers and yours has no verdict). A push after an
  approval keeps the approval. Bots and the author never count as requested
  reviewers. "View as" shows any other login's plan.

  The matrix keeps one invariant, the board's theorem: **every open PR is
  either somebody's move (an author bucket, the admin bucket, or a reviewer
  task for a named login), or transient (CI in flight, review data loading,
  GitHub computing mergeability), or parked as "do not merge" for at most 14
  days.** So if everyone on the board does what it says, the queue drains —
  up to the review loop itself converging, which no board can promise.
  `orphan()` in `board.js` is the predicate; `tests/matrix_test.js` slices
  the matrix out of `board.js`, enumerates the whole state space (~10M
  states: draft × CI status × staleness × DNM × mergeability × branch
  protection × two reviewers' request/review/timing × author activity ×
  threads × dormancy) and fails on the first state with nobody's move. The
  "Who owes what" card shows any live exception as "unowned" — that is a
  matrix bug. `tests/timeline_test.js` guards the fold that feeds the matrix:
  a CI that posts its report comments with a human's token must not hide that
  human's reviews, review requests and inline threads, while their plain
  comments (CI narration) do not count.
- **Pull requests** — every open PR with CI status, mergeability, reviewers,
  and filters, including the same blocker buckets ("Blocked on: …").
- **Streaks** — review streaks and achievements over the last 30 days of open
  and closed PRs. A reviewer owes a review from a request (or a re-request, or
  the author's push after their changes-requested verdict) until their next
  review of that PR; drafting the PR, removing the request or closing the PR
  cancels the debt. It is due one working day later (Mon–Fri, UTC, the same
  clock for every viewer). A working day is good when it closes a debt on
  time and bad when one goes overdue; days with neither don't count, so the
  streak is review days in a row with nobody kept waiting. Badges, bronze to
  gold by count: *Lightning* (answered a request within a working hour),
  *Second look* (re-reviewed within 4 working hours of the push that answered
  you), *Deep dive* (5+ inline comments in one review), *Rescuer* (unasked,
  the first review of a PR that had waited 2+ working days), *Inbox zero* (3+
  on-time reviews in a day, ending it owing none), and streaks of 5, 10 and
  20 days. It rewards answering, not approving, so rubber-stamping earns
  nothing. Your card, then a team feed of who earned what; no ranking. The
  closed PRs load only when the tab is opened and are re-listed at most every
  10 minutes: one timeline request per closed PR, once (cached by
  `updated_at`), plus the month's inline review comments from the repo-wide
  `pulls/comments` list; open PRs cost nothing extra. The proxy needs
  `pulls/comments` in its allowlist; without it the board asks per PR, only
  for PRs a human reviewed.
- **Flow** — where a merged PR's time went, from opened to merged, in working
  hours (Mon–Fri UTC, the Streaks clock). At every instant a PR is in one
  stage, first match wins: draft; CI red (a failed pipeline's end until the
  next pipeline); CI running; then its review state — waiting for review,
  waiting for the author (changes requested, or a reviewer's comment), waiting
  to merge (approved, nothing standing against it). A push hands a
  changes-requested PR back to review and keeps an approval; an author who
  answers only in comments stays "waiting for the author" until they push. A
  hero with the median ready → merged time and the team's biggest wait, the
  median per stage, and every merged PR as a bar of its stages (click one for
  its timeline). No GitHub requests beyond Streaks' history; CI stages come
  from the Woodpecker pipeline list.
- **Weekly digest** — a newspaper of one Mon–Sun week (UTC): the merged PRs
  grouped by conventional-commit type (ticket keys and DNM/WIP tags before the
  type are skipped), a lead story (breaking changes first, then features,
  the most reviewed within each), tickets, contributors and, for the primary
  repo with a reports host, the week's nightly perf as the median of its
  nightlies against the median of the week before. "Copy for Slack" / "Markdown" put a paste-ready summary on
  the clipboard; prev / next walk the weeks the 30-day history covers. Built
  from Streaks' history: no new requests.
- **CI weather** — flaky steps, from Woodpecker only. A step flakes when the
  same commit both fails and passes it (restarts, repeated runs; manual runs
  only with "+ manual runs", since upstream validation builds may be red). A
  forecast for this week against the last, a weather map of the flakiest
  steps × days, the ranking with flake rate, real failures, PRs hit and the
  agent time lost to reruns (a restart or a repeated manual run that only
  chased flakes; not the next night's cron), and the recent flakes with
  links to the failing and the passing pipeline. Flakes across different
  commits aren't claimed: nothing proves the change in between was unrelated.
- **CI minutes** — where the agent time of the last 28 days went: this week
  against the last, the queue wait for an agent, the superseded share (killed
  runs), per day by architecture (arm64 from a `-arm64` workflow suffix), an
  animated treemap of workflows (click one for its steps; "Superseded" shows
  only the wasted time), per event, and the most expensive PRs.

  CI weather, CI minutes and Flow share one pipeline history: every pipeline
  of the last 28 days, its detail trimmed to ~1–2 KB and kept in its own
  localStorage key (a busy repo: ~700 pipelines, ~1.2 MB), so a quota error
  there never touches the main cache. First open: the list and every
  pipeline's detail once (a busy repo: ~700 same-origin requests, ~30 s,
  rendering as it goes); afterwards the first list page and whatever
  finished since, re-listed at most every 2 minutes while such a tab is open.
  None of it touches GitHub.
- **Main · perf & coverage** — the benchmark baseline, the lcov coverage
  baseline, and a nightly comparison report with a night-over-night trend,
  read from a reports host (see `reports` in the config). Only for the
  primary repo and only when a reports host is configured; loaded lazily, so
  it never delays the first two tabs.

Every PR row carries a link to its ticket when the title or the branch name
holds a key of a known tracker project (`trackers` in the config), the blocker
as a link to where the action happens (the first unanswered thread, or the PR
page), the reviewers as avatars whose ring shows their latest state (green
approved, red changes requested, blue commented, dashed requested and silent),
a "waiting Nd" age for how long it has sat in that state, and "also: …" for
the secondary blockers the primary bucket hides. Sections list the
oldest-stuck PR first. The Pull requests tab opens with **Who owes what**: one
row per person with the reviews they owe, the answers, fixes, rebases, asks
and merges the queue waits on from them, and their oldest debt; clicking a row
opens that person's plan.

The default-branch strip counts only `push` pipelines, never `manual` runs. A
pipeline that Woodpecker cancelled because a newer one superseded it
(`cancel_previous_pipeline_events`) is dropped from every history strip — its
verdict is lost, so it is neither red nor counted.

The theme button cycles light → dark → Woodpecker. The Woodpecker theme uses
Woodpecker's own palette (its `--wp-*` variables when embedded, so it follows
Woodpecker's light/dark setting); embedded, it keeps the real Woodpecker
navbar and renders the board where the router view sits.

The page paints in phases (hero → PR list → per-PR review data), caches repos,
runs, mergeability and the folded review timeline in `localStorage`, patches
single pipelines from Woodpecker's event stream, and diffs every refresh
against the live DOM, so a reload shows the full plan in about a second and
nothing flickers.

## Setup

Everything site-specific lives in `config.js`, which sets
`window.BIRDWATCHER_CONFIG`. Start from the example:

```bash
cp config.example.js config.js   # then edit
```

Every key is optional; a missing one turns its feature off.

### Inside Woodpecker

Woodpecker loads a single custom script, so serve the config and the board as
one file:

```bash
cat config.js board.js > /opt/woodpecker/custom/woodpecker.js
```

```yaml
# woodpecker server
environment:
  - WOODPECKER_CUSTOM_JS_FILE=/usr/local/www/woodpecker.js
volumes:
  - /opt/woodpecker/custom:/usr/local/www:ro
```

The board renders at `<woodpecker>/birdwatcher` (`boardPath`) and adds a link
to the navbar everywhere else. Builds, crons and step logs come through the
viewer's Woodpecker session. For the GitHub-backed parts (the Actions tab,
mergeability, reviewers) put a read-only proxy at `/github/` on the Woodpecker
host that adds a GitHub token and admits only logged-in Woodpecker users (for
example Traefik ForwardAuth on Woodpecker's `/api/user`); without it the board
falls back to Woodpecker's own pull request list. The reports host is read the
same way through `reports.proxyPath`.

| Data | Source |
|---|---|
| Builds, crons, workflows, step logs | Woodpecker API, same origin |
| Open PRs, mergeability, reviewers, review timeline, inline threads | GitHub API through `/github/…` |
| Open PRs (a repo the proxy token cannot read) | Woodpecker `/api/repos/<id>/pull_requests` |
| Failed steps and pinned inputs of red main / cron runs (incidents) | Woodpecker API, same origin; the log of a plugin's `pins.steps` |
| Pipeline history of the last 28 days, workflow and step timings (CI weather, CI minutes, Flow) | Woodpecker API, same origin |
| Benchmark / coverage tables per PR | the CI's report comments (`reportMarkers`), or the `publish` / `coverage` step logs |
| Benchmark baseline, coverage baseline, nightly report | the reports host through `reports.proxyPath` |

### Plugins

What only one repository's CI knows — which step prints a run's pinned
inputs, in which format, and where two values of a pin can be compared —
lives in a plugin, not in `board.js`. A plugin is a script that pushes an
object onto `window.BIRDWATCHER_PLUGINS`; load it after `config.js` and
before `board.js` (embedded: `cat config.js plugins/kv-pins.js board.js`).

**`plugins/kv-pins.js`** covers the common case: a step that prints its
pins as `KEY=VALUE` lines. It needs no code, only `pins` in `config.js`
(see `config.example.js`): the repos, the step names, an optional marker
line the block follows, the keys to ignore, and a compare URL template per
key (`{from}`, `{to}`).

For any other format, write your own from `plugin.example.js`. Every field
is optional:

| Field | |
|---|---|
| `repos` | full names the plugin applies to; default every repo |
| `pins.steps` | step names that print a run's pinned inputs; the first one a pipeline has is read |
| `pins.parse(log, kit)` | that step's log → `{ KEY: value }` or `null`; default `kit.kv(log)`, every `KEY=VALUE` line; `kit.kv(log, { marker, ignore })` reads only the block after the line holding `marker` |
| `pins.link(key, from, to)` | a URL comparing two values of one pin, or `''` |

A throw inside a plugin turns that feature off for the run, never the board.

### Standalone

Serve `index.html`, `config.js` and `board.js` side by side. The board asks
for a Woodpecker token and, optionally, a GitHub token (both stay in the
browser's `localStorage`). The reports cards work when the page is served
from the reports host itself or a reports base URL is set in settings.

## Tests

```bash
node tests/matrix_test.js     # the theorem over the whole state space (~1 min)
node tests/timeline_test.js   # the review timeline fold
node tests/game_test.js       # the Streaks tab: working-time clock, review debts, streaks, badges
node tests/runs_test.js       # CI minutes and CI weather: trimmed pipelines, agent time, flakes
node tests/digest_test.js     # the Weekly digest: titles, the week's grouping, the summaries
node tests/flow_test.js       # Flow: the stages of a merged PR in working time
node tests/incident_test.js   # red main: owner, cause (flake, code, pins, environment), PRs it blocks
```

## License

MIT
