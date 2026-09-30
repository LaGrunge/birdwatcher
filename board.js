// Birdwatcher — a Woodpecker CI status board.
//
// One file, two homes:
//   * Woodpecker UI  — served as WOODPECKER_CUSTOM_JS_FILE, concatenated after
//                      the site's config.js. Renders at <woodpecker><boardPath>
//                      on top of the session, adds a navbar link everywhere else.
//   * index.html     — standalone shell (loads config.js, then this file).
//
// Everything site-specific (servers, repos, trackers, the reports host) comes
// from window.BIRDWATCHER_CONFIG; see config.example.js. Styles and markup are
// inlined below so the file is self-contained.
(() => {
  const CSS = "/* Birdwatcher — scoped under #birdwatcher (native CSS nesting) */\n  @keyframes spin { to { transform: rotate(360deg); } }\n  @keyframes pulse { 0%,100% { transform: scale(1); opacity: .2; } 50% { transform: scale(1.12); opacity: .08; } }\n  @keyframes pillpulse { 0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--sc) 30%, transparent); } 50% { box-shadow: 0 0 0 5px transparent; } }\n  @keyframes draw { to { stroke-dashoffset: 0; } }\n  @keyframes tick { 0% { transform: rotate(0); } 50% { transform: rotate(6deg); } }\n  @keyframes blink { 50% { opacity: .3; } }\n  @keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }\n  @keyframes shimmer { to { background-position: -200% 0; } }\n  @keyframes growup { from { transform: scaleY(0); } }\n  @keyframes drift { 0%,100% { transform: translateX(0); } 50% { transform: translateX(3px); } }\n  @keyframes drop { 0% { transform: translateY(-3px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(5px); opacity: 0; } }\n  @keyframes flash { 0%,70%,100% { opacity: 1; } 75% { opacity: .2; } 80% { opacity: 1; } 85% { opacity: .3; } }\n  @keyframes growright { from { transform: scaleX(0); } }\n  @keyframes flicker { 0%,100% { transform: scale(1) rotate(-2deg); } 30% { transform: scale(1.05,1.1) rotate(2deg); } 55% { transform: scale(.97,1.02) rotate(-1deg); } 80% { transform: scale(1.04,1.07) rotate(1.5deg); } }\n  @keyframes ember { 0% { transform: translateY(0) scale(1); opacity: 0; } 15% { opacity: .95; } 100% { transform: translateY(-34px) scale(.2); opacity: 0; } }\n  @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }\n  @keyframes ringdraw { from { stroke-dashoffset: 452.4; } }\n  @keyframes shine { to { transform: translateX(120%); } }\n#birdwatcher {\n  & {\n    --bg: #f4f5f8;\n    --bg-glow-a: rgba(59,130,246,.10);\n    --bg-glow-b: rgba(12,163,12,.08);\n    --surface: #ffffff;\n    --surface-2: #f7f8fb;\n    --border: rgba(15,23,42,.10);\n    --border-strong: rgba(15,23,42,.18);\n    --text: #0f172a;\n    --text-2: #475569;\n    --text-3: #8b93a7;\n    --accent: #2563eb;\n    --good: #0ca30c;\n    --bad: #d03b3b;\n    --warn: #d99a00;\n    --run: #2563eb;\n    --none: #8b93a7;\n    --shadow: 0 1px 2px rgba(15,23,42,.06), 0 8px 24px -12px rgba(15,23,42,.18);\n    --shadow-lg: 0 2px 4px rgba(15,23,42,.06), 0 24px 48px -24px rgba(15,23,42,.30);\n    --radius: 16px;\n    --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;\n    --sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, sans-serif;\n    color-scheme: light dark;\n  }\n  @media (prefers-color-scheme: dark) {\n    &:not([data-theme=\"light\"]) {\n      --bg: #0a0d13;\n      --bg-glow-a: rgba(59,130,246,.14);\n      --bg-glow-b: rgba(34,197,94,.10);\n      --surface: #11151d;\n      --surface-2: #171c26;\n      --border: rgba(255,255,255,.07);\n      --border-strong: rgba(255,255,255,.14);\n      --text: #e8ebf2;\n      --text-2: #a3abbe;\n      --text-3: #6b7387;\n      --accent: #60a5fa;\n      --good: #22c55e;\n      --bad: #ef4444;\n      --warn: #fab219;\n      --run: #60a5fa;\n      --none: #6b7387;\n      --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.6);\n      --shadow-lg: 0 2px 4px rgba(0,0,0,.4), 0 24px 48px -24px rgba(0,0,0,.8);\n    }\n  }\n  &[data-theme=\"dark\"] {\n    --bg: #0a0d13; --bg-glow-a: rgba(59,130,246,.14); --bg-glow-b: rgba(34,197,94,.10);\n    --surface: #11151d; --surface-2: #171c26; --border: rgba(255,255,255,.07); --border-strong: rgba(255,255,255,.14);\n    --text: #e8ebf2; --text-2: #a3abbe; --text-3: #6b7387; --accent: #60a5fa;\n    --good: #22c55e; --bad: #ef4444; --warn: #fab219; --run: #60a5fa; --none: #6b7387;\n    --shadow: 0 1px 2px rgba(0,0,0,.4), 0 8px 24px -12px rgba(0,0,0,.6);\n    --shadow-lg: 0 2px 4px rgba(0,0,0,.4), 0 24px 48px -24px rgba(0,0,0,.8);\n  }\n\n  * { margin: 0; padding: 0; box-sizing: border-box; }\n  & { -webkit-font-smoothing: antialiased; position: relative; isolation: isolate; }\n  & {\n    font-family: var(--sans);\n    background: var(--bg);\n    color: var(--text);\n    min-height: 100vh;\n    font-size: 14px;\n    line-height: 1.45;\n    position: relative;\n    overflow-x: hidden;\n  }\n  &::before, &::after {\n    content: \"\"; position: fixed; z-index: -1; pointer-events: none;\n    width: 70vw; height: 70vw; border-radius: 50%; filter: blur(80px);\n  }\n  &::before { top: -35vw; left: -20vw; background: radial-gradient(closest-side, var(--bg-glow-a), transparent); }\n  &::after { bottom: -40vw; right: -25vw; background: radial-gradient(closest-side, var(--bg-glow-b), transparent); }\n\n  a { color: inherit; text-decoration: none; }\n  a:hover { text-decoration: underline; text-decoration-color: var(--text-3); }\n  button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }\n  .mono { font-family: var(--mono); font-feature-settings: \"tnum\"; }\n  .muted { color: var(--text-2); }\n  .faint { color: var(--text-3); }\n  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n\n  .wrap { max-width: 1280px; margin: 0 auto; padding: 24px 24px 64px; position: relative; }\n\n  /* ---------- top bar ---------- */\n  .topbar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }\n  .brand { display: flex; align-items: center; gap: 12px; }\n  .bw-logo { display: block; flex: none; line-height: 0; border-radius: 12px; transition: transform .15s ease; }\n  .bw-logo:hover { transform: scale(1.04); }\n  .bw-logo:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }\n  .bw-logo img { width: 100%; height: auto; display: block; }\n  .brand .bw-logo { width: 56px; }\n  /* Beside the feed: the big logo sits in the left gutter once the viewport\n     has room for it next to the 1280px column; the topbar one steps aside. */\n  .bw-side { display: none; position: absolute; top: 20px; right: 100%; width: 168px; margin-right: 8px; }\n  @media (min-width: 1660px) { .bw-side { display: block; } .brand .bw-logo { display: none; } }\n  .brand h1 { font-size: 18px; font-weight: 700; letter-spacing: -.01em; }\n  .brand h1 span { color: var(--text-3); font-weight: 500; }\n  .topbar .spacer { flex: 1; }\n  .refresh { display: flex; align-items: center; gap: 10px; color: var(--text-2); font-size: 13px; }\n  .refresh .ring { width: 22px; height: 22px; transform: rotate(-90deg); }\n  .refresh .ring circle { fill: none; stroke-width: 3; }\n  .refresh .ring .track { stroke: var(--border-strong); }\n  .refresh .ring .prog { stroke: var(--accent); stroke-linecap: round; transition: stroke-dashoffset 1s linear; }\n  .iconbtn {\n    width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;\n    border: 1px solid var(--border); background: var(--surface); color: var(--text-2); box-shadow: var(--shadow);\n    transition: transform .15s, color .15s, border-color .15s;\n  }\n  .iconbtn:hover { color: var(--text); border-color: var(--border-strong); transform: translateY(-1px); }\n  .iconbtn.spin svg { animation: spin 1s linear infinite; }\n\n  /* ---------- tabs ---------- */\n  .tabs { display: flex; gap: 6px; padding: 4px; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); width: fit-content; box-shadow: var(--shadow); margin-bottom: 24px; flex-wrap: wrap; }\n  .tab { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; font-weight: 600; color: var(--text-2); transition: background .15s, color .15s; }\n  .tab:hover { color: var(--text); }\n  .tab.active { background: var(--surface-2); color: var(--text); box-shadow: inset 0 0 0 1px var(--border); }\n  .tab .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--none); }\n  .tab .cnt { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: var(--surface-2); color: var(--text-3); border: 1px solid var(--border); }\n\n  /* ---------- sections ---------- */\n  .section-title { display: flex; align-items: baseline; gap: 10px; margin: 28px 0 12px; }\n  .section-title h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-2); }\n  .section-title .sub { font-size: 12px; color: var(--text-3); }\n\n  .hero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; }\n\n  .card {\n    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);\n    box-shadow: var(--shadow); position: relative; overflow: hidden;\n    animation: rise .4s cubic-bezier(.2,.7,.2,1) both;\n  }\n  .card::before { content: \"\"; position: absolute; inset: 0 0 auto 0; height: 3px; background: var(--sc, var(--none)); opacity: .9; }\n  .card.failure::after, .card.error::after, .card.killed::after {\n    content: \"\"; position: absolute; inset: 0; pointer-events: none;\n    background: radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--bad) 14%, transparent), transparent 60%);\n  }\n  .card.success::after { content: \"\"; position: absolute; inset: 0; pointer-events: none;\n    background: radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--good) 10%, transparent), transparent 60%); }\n  .card.running::after, .card.started::after { content: \"\"; position: absolute; inset: 0; pointer-events: none;\n    background: radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--run) 14%, transparent), transparent 60%); }\n\n  .hero { padding: 20px 20px 16px; display: grid; grid-template-columns: 72px 1fr; gap: 16px; position: relative; z-index: 1; }\n  .hero .kicker { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); margin-bottom: 6px; }\n  .hero .kicker .branch { font-family: var(--mono); text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--text-2); background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: 1px 7px; }\n  .hero .headline { font-size: 18px; font-weight: 700; letter-spacing: -.01em; line-height: 1.25; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }\n  .hero .msg { color: var(--text-2); font-size: 13px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\n  .hero .meta { display: flex; align-items: center; gap: 14px; margin-top: 12px; color: var(--text-3); font-size: 12px; flex-wrap: wrap; }\n  .hero .meta .who { display: flex; align-items: center; gap: 6px; color: var(--text-2); }\n  .hero .meta .who img { width: 18px; height: 18px; border-radius: 50%; }\n  .hero-foot { padding: 12px 20px 16px; border-top: 1px solid var(--border); display: flex; align-items: center; gap: 14px; flex-wrap: wrap; position: relative; z-index: 1; }\n  .hero-foot .hist { display: flex; gap: 3px; align-items: flex-end; flex-wrap: wrap; max-width: 100%; }\n  .hero-foot .hist a { display: block; width: 9px; height: 18px; border-radius: 3px; background: var(--c); opacity: .85; transition: transform .12s, opacity .12s; }\n  .hero-foot .hist a:hover { transform: scaleY(1.2); opacity: 1; }\n  .hero-foot .hist a.cur { outline: 2px solid var(--surface); box-shadow: 0 0 0 4px var(--c); }\n  .hero-foot .steps { display: flex; gap: 6px; flex-wrap: wrap; }\n\n  /* ---------- status glyph (big) ---------- */\n  .glyph { width: 72px; height: 72px; position: relative; display: grid; place-items: center; }\n  .glyph .ring { position: absolute; inset: 0; border-radius: 50%; }\n  .glyph svg.icon { width: 30px; height: 30px; position: relative; color: #fff; stroke: currentColor; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }\n  .glyph .disc { position: absolute; inset: 8px; border-radius: 50%; background: var(--sc); display: grid; place-items: center; box-shadow: 0 8px 20px -8px var(--sc); }\n  .glyph.success .ring { background: conic-gradient(var(--sc) 360deg, transparent 0); opacity: .18; }\n  .glyph.success svg.icon path { stroke-dasharray: 40; stroke-dashoffset: 40; animation: draw .5s .15s ease-out forwards; }\n  .glyph.failure .ring, .glyph.error .ring, .glyph.killed .ring { background: var(--sc); opacity: .2; animation: pulse 2s ease-in-out infinite; }\n  .glyph.running .ring, .glyph.started .ring { background: conic-gradient(from 0deg, transparent 0 60%, var(--sc) 100%); animation: spin 1.1s linear infinite; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px)); mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px)); }\n  .glyph.running .disc, .glyph.started .disc { background: color-mix(in srgb, var(--sc) 85%, transparent); }\n  .glyph.pending .ring, .glyph.blocked .ring { background: var(--sc); opacity: .18; }\n  .glyph.pending svg.icon, .glyph.blocked svg.icon { animation: tick 2s steps(1) infinite; }\n  .glyph.none .disc, .glyph.skipped .disc, .glyph.declined .disc { background: var(--surface-2); border: 2px dashed var(--border-strong); box-shadow: none; }\n  .glyph.none svg.icon, .glyph.skipped svg.icon, .glyph.declined svg.icon { color: var(--text-3); }\n\n  /* ---------- status pill ---------- */\n  .pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px 4px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; letter-spacing: .01em; color: var(--sc); background: color-mix(in srgb, var(--sc) 12%, transparent); border: 1px solid color-mix(in srgb, var(--sc) 30%, transparent); white-space: nowrap; }\n  .pill svg { width: 13px; height: 13px; stroke: currentColor; stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }\n  .pill.running svg, .pill.started svg { animation: spin 1s linear infinite; }\n  .pill.failure, .pill.error, .pill.killed { animation: pillpulse 2.4s ease-in-out infinite; }\n  .pill.none { color: var(--text-3); background: transparent; border-style: dashed; border-color: var(--border-strong); }\n\n  .tag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 6px; border: 1px solid var(--border); color: var(--text-2); background: var(--surface-2); white-space: nowrap; flex: none; max-width: 100%; }\n  .tag.draft { color: var(--text-3); border-style: dashed; }\n  .tag.dnm { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, transparent); background: color-mix(in srgb, var(--warn) 10%, transparent); }\n  .tag.stale { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, transparent); background: color-mix(in srgb, var(--warn) 10%, transparent); }\n  .tag.head { color: var(--good); border-color: color-mix(in srgb, var(--good) 35%, transparent); background: color-mix(in srgb, var(--good) 8%, transparent); }\n  .tag.err { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 40%, transparent); background: color-mix(in srgb, var(--bad) 8%, transparent); }\n  .tag.conflict { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 45%, transparent); background: color-mix(in srgb, var(--bad) 12%, transparent); font-weight: 700; }\n  .tag.mergeable { color: var(--good); border-color: color-mix(in srgb, var(--good) 35%, transparent); background: color-mix(in srgb, var(--good) 8%, transparent); }\n\n  .step { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 999px; color: var(--text-2); background: var(--surface-2); border: 1px solid var(--border); }\n  .step i { width: 7px; height: 7px; border-radius: 50%; background: var(--sc); display: inline-block; }\n  .step.running i, .step.started i { animation: blink 1s ease-in-out infinite; }\n\n  /* ---------- summary tiles ---------- */\n  .tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 24px; }\n  .tile { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; box-shadow: var(--shadow); display: flex; align-items: center; gap: 12px; cursor: pointer; transition: transform .15s, border-color .15s; animation: rise .4s cubic-bezier(.2,.7,.2,1) both; }\n  .tile:hover { transform: translateY(-1px); border-color: var(--border-strong); }\n  .tile.active { border-color: var(--sc, var(--accent)); box-shadow: 0 0 0 3px color-mix(in srgb, var(--sc, var(--accent)) 18%, transparent), var(--shadow); }\n  .tile .num { font-size: 26px; font-weight: 800; letter-spacing: -.03em; line-height: 1; }\n  .tile .lbl { font-size: 12px; color: var(--text-2); font-weight: 500; }\n  .tile .mark { width: 10px; height: 38px; border-radius: 6px; background: var(--sc, var(--text-3)); opacity: .9; }\n\n  /* ---------- PR list ---------- */\n  .prlist { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; animation: rise .4s cubic-bezier(.2,.7,.2,1) both; }\n  .pr { display: grid; grid-template-columns: 48px 1fr auto; gap: 14px; padding: 14px 18px; border-top: 1px solid var(--border); align-items: center; position: relative; transition: background .15s; cursor: pointer; }\n  .pr:first-child { border-top: 0; }\n  .pr:hover { background: var(--surface-2); }\n  .pr::before { content: \"\"; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 0 3px 3px 0; background: var(--sc, transparent); }\n  .avatar { width: 44px; height: 44px; border-radius: 50%; position: relative; display: grid; place-items: center; }\n  .avatar img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; display: block; background: var(--surface-2); }\n  .avatar::before { content: \"\"; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--sc, var(--border-strong)); }\n  .avatar.running::before, .avatar.started::before { border-style: dashed; animation: spin 6s linear infinite; }\n  .avatar .badge { position: absolute; right: -2px; bottom: -2px; width: 18px; height: 18px; border-radius: 50%; background: var(--sc, var(--none)); border: 2px solid var(--surface); display: grid; place-items: center; }\n  .avatar .badge svg { width: 9px; height: 9px; stroke: #fff; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; }\n  .avatar.none .badge { display: none; }\n  .avatar .initials { width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 14px; color: #fff; background: linear-gradient(135deg, #64748b, #334155); }\n  .pr .title { font-weight: 600; font-size: 14px; display: flex; align-items: center; gap: 8px; min-width: 0; }\n  .pr .title a { min-width: 0; }\n  .pr .sub { display: flex; align-items: center; gap: 10px; margin-top: 4px; color: var(--text-3); font-size: 12px; flex-wrap: wrap; }\n  .pr .sub .num { font-family: var(--mono); color: var(--text-2); }\n  .pr .sub .ticket { font-family: var(--mono); font-weight: 600; color: var(--accent); text-decoration: none; display: inline-flex; align-items: center; gap: 3px; }\n  .pr .sub .ticket:hover { text-decoration: underline; }\n  .pr .sub .br { font-family: var(--mono); font-size: 11px; color: var(--text-3); max-width: 320px; }\n  .pr .right { display: flex; align-items: center; gap: 12px; justify-self: end; }\n  .pr .right .stat { text-align: right; font-size: 12px; color: var(--text-3); line-height: 1.3; }\n  .pr .right .stat b { display: block; color: var(--text-2); font-weight: 600; font-family: var(--mono); }\n  .pr .right .plink { font-family: var(--mono); font-size: 12px; color: var(--text-2); padding: 4px 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); }\n  .pr .right .plink:hover { border-color: var(--border-strong); text-decoration: none; color: var(--text); }\n  .pr .chev { color: var(--text-3); transition: transform .2s; }\n  .pr.open .chev { transform: rotate(180deg); }\n  .pr-detail { grid-column: 1 / -1; display: none; padding: 10px 0 0 62px; }\n  .pr.open .pr-detail { display: block; animation: rise .25s ease both; }\n  .pr-detail .steps { display: flex; gap: 6px; flex-wrap: wrap; }\n  .pr-detail .hist { display: flex; gap: 3px; align-items: center; margin-top: 10px; }\n  .pr-detail .hist a { width: 9px; height: 14px; border-radius: 3px; background: var(--c); opacity: .85; display: block; }\n  .pr-detail .hist a:hover { opacity: 1; }\n  .pr-detail .hist .lbl { font-size: 11px; color: var(--text-3); margin-left: 8px; }\n\n  .filters { display: flex; gap: 6px; flex-wrap: wrap; margin: 0 0 12px; align-items: center; }\n  .chip { padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; color: var(--text-2); border: 1px solid var(--border); background: var(--surface); transition: all .15s; }\n  .chip:hover { border-color: var(--border-strong); color: var(--text); }\n  .chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }\n  .filters .search { margin-left: auto; padding: 7px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font: inherit; font-size: 13px; width: 240px; }\n  .filters .search:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent); }\n\n  /* ---------- notices ---------- */\n  .notice { display: flex; gap: 12px; align-items: flex-start; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; margin-bottom: 16px; box-shadow: var(--shadow); }\n  .notice svg { flex: none; width: 18px; height: 18px; stroke: var(--warn); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; margin-top: 1px; }\n  .notice.err svg { stroke: var(--bad); }\n  .notice b { color: var(--text); }\n  .notice button.link { color: var(--accent); font-weight: 600; padding: 0; }\n  .empty { padding: 40px; text-align: center; color: var(--text-3); }\n\n  /* ---------- skeleton ---------- */\n  .sk { background: linear-gradient(90deg, var(--surface-2) 25%, color-mix(in srgb, var(--surface-2) 60%, var(--surface)) 50%, var(--surface-2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }\n  .sk-card { height: 150px; border-radius: var(--radius); }\n  .sk-row { height: 72px; border-radius: 0; border-top: 1px solid var(--border); }\n\n  /* ---------- settings dialog ---------- */\n  dialog { border: 1px solid var(--border); border-radius: 18px; background: var(--surface); color: var(--text); padding: 0; width: min(560px, calc(100vw - 32px)); box-shadow: var(--shadow-lg); }\n  dialog::backdrop { background: rgba(0,0,0,.45); backdrop-filter: blur(6px); }\n  dialog .dhead { padding: 20px 24px 0; }\n  dialog h3 { font-size: 17px; font-weight: 700; }\n  dialog p { color: var(--text-2); font-size: 13px; margin-top: 4px; }\n  dialog form { padding: 20px 24px 24px; display: grid; gap: 16px; }\n  .field label { display: block; font-size: 12px; font-weight: 600; color: var(--text-2); margin-bottom: 6px; }\n  .field input { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border-strong); background: var(--surface-2); color: var(--text); font: inherit; font-family: var(--mono); font-size: 13px; }\n  .field input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent); }\n  .field .hint { font-size: 12px; color: var(--text-3); margin-top: 6px; }\n  .field .hint a { color: var(--accent); }\n  .actions { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }\n  .btn { padding: 9px 16px; border-radius: 10px; font-weight: 600; font-size: 13px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); }\n  .btn.primary { background: var(--accent); color: #fff; border-color: transparent; }\n  .btn.primary:hover { filter: brightness(1.08); }\n  .segmented { display: inline-flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }\n  .segmented button { padding: 7px 12px; font-size: 12px; font-weight: 600; color: var(--text-2); }\n  .segmented button.active { background: var(--surface-2); color: var(--text); }\n  .kbd { font-family: var(--mono); font-size: 11px; padding: 1px 6px; border: 1px solid var(--border-strong); border-bottom-width: 2px; border-radius: 5px; color: var(--text-2); }\n\n  /* ---------- insights (benchmarks / coverage / nightly) ---------- */\n  .insights { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px; }\n  .insights .card { padding: 18px 20px 16px; }\n  .insights .card.wide { grid-column: 1 / -1; }\n  .ihead { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }\n  .ihead h3 { font-size: 14px; font-weight: 700; letter-spacing: -.01em; }\n  .ihead .sub { font-size: 12px; color: var(--text-3); }\n  .ihead .links { margin-left: auto; display: flex; gap: 10px; font-size: 12px; }\n  .ihead .links a { color: var(--accent); display: inline-flex; align-items: center; gap: 4px; }\n  .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; }\n  .metric { padding: 10px 12px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); min-width: 0; }\n  .metric .l { font-size: 11px; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }\n  .metric .v { font-size: 22px; font-weight: 800; letter-spacing: -.03em; line-height: 1.15; margin-top: 4px; font-variant-numeric: tabular-nums; }\n  .metric .v small { font-size: 12px; font-weight: 500; color: var(--text-3); margin-left: 3px; letter-spacing: 0; }\n  .metric .s { font-size: 11px; color: var(--text-3); margin-top: 2px; }\n  .hero-num { font-size: 48px; font-weight: 800; letter-spacing: -.04em; line-height: 1; font-variant-numeric: tabular-nums; }\n  .hero-num small { font-size: 16px; font-weight: 600; color: var(--text-3); letter-spacing: 0; }\n  .delta { display: inline-flex; align-items: center; gap: 4px; font-family: var(--mono); font-size: 12px; font-weight: 600; padding: 2px 7px; border-radius: 6px; }\n  .delta.good { color: var(--good); background: color-mix(in srgb, var(--good) 12%, transparent); }\n  .delta.bad { color: var(--bad); background: color-mix(in srgb, var(--bad) 12%, transparent); }\n  .delta.flat { color: var(--text-2); background: var(--surface-2); }\n  .delta.na { color: var(--text-3); }\n  .meter { height: 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 15%, transparent); overflow: hidden; margin-top: 8px; }\n  .meter i { display: block; height: 100%; border-radius: 999px; background: var(--accent); transition: width .6s cubic-bezier(.2,.7,.2,1); }\n  .cmp { width: 100%; border-collapse: collapse; font-size: 12.5px; }\n  .cmp th { text-align: left; font-size: 11px; color: var(--text-3); font-weight: 600; text-transform: uppercase; letter-spacing: .06em; padding: 6px 8px; border-bottom: 1px solid var(--border); }\n  .cmp td { padding: 7px 8px; border-bottom: 1px solid var(--border); vertical-align: middle; }\n  .cmp tr:last-child td { border-bottom: 0; }\n  .cmp td.n, .cmp th.n { text-align: right; font-family: var(--mono); font-variant-numeric: tabular-nums; white-space: nowrap; }\n  .cmp td.n b { font-weight: 600; color: var(--text); }\n  .cmp .name { font-weight: 600; }\n  .cmp .name small { display: block; color: var(--text-3); font-weight: 400; font-size: 11px; }\n  .bars { display: grid; gap: 6px; }\n  .bar-row { display: grid; grid-template-columns: 72px 1fr 64px; gap: 10px; align-items: center; font-size: 12px; }\n  .bar-row .lbl { font-family: var(--mono); color: var(--text-2); font-size: 11.5px; }\n  .bar-row .track { display: grid; gap: 2px; }\n  .bar-row .track i { display: block; height: 7px; border-radius: 4px; min-width: 2px; }\n  .bar-row .track i.a { background: var(--s-a); }\n  .bar-row .track i.b { background: var(--s-b); }\n  .bar-row .val { font-family: var(--mono); color: var(--text-3); font-size: 11px; text-align: right; white-space: nowrap; }\n  .legend { display: flex; gap: 14px; font-size: 12px; color: var(--text-2); margin: 4px 0 10px; }\n  .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: -1px; margin-right: 5px; }\n  .spark { width: 100%; height: 56px; display: block; overflow: visible; }\n  .spark path { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }\n  .spark .area { fill: color-mix(in srgb, var(--accent) 14%, transparent); stroke: none; }\n  .spark circle { fill: var(--accent); stroke: var(--surface); stroke-width: 2; }\n  .spark .g { stroke: var(--border-strong); stroke-width: 1; stroke-dasharray: 2 3; }\n  .sparkbox { display: grid; grid-template-columns: auto 1fr; gap: 6px; align-items: stretch; }\n  .sparkbox .sy { display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; height: var(--sh, 56px); padding: 1px 0 2px; font-size: 9.5px; line-height: 1; color: var(--text-3); white-space: nowrap; }\n  .sparkbox .sy.one { justify-content: center; }\n  .sparkbox .sy i { font-style: normal; opacity: .7; margin-left: 1px; }\n  & { --s-a: #7c8db5; --s-b: #2563eb; }\n  &[data-theme=\"dark\"], &:not([data-theme=\"light\"]) { }\n  @media (prefers-color-scheme: dark) { &:not([data-theme=\"light\"]) { --s-a: #6b7793; --s-b: #60a5fa; } }\n  &[data-theme=\"dark\"] { --s-a: #6b7793; --s-b: #60a5fa; }\n  .pr-detail .reports { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }\n  .pr-detail .rep { flex: 1 1 380px; min-width: max-content; border: 1px solid var(--border); border-radius: 12px; background: var(--surface-2); padding: 10px 12px; }\n  .pr-detail .rep .rh { display: flex; align-items: baseline; gap: 8px; font-size: 12px; font-weight: 700; margin-bottom: 6px; }\n  .pr-detail .rep .rh .faint { font-weight: 500; }\n  .pr-detail .rep .rh a { margin-left: auto; color: var(--accent); font-weight: 500; }\n  .pr-detail .rep .cmp { font-size: 12px; }\n  .pr-detail .rep .cmp td, .pr-detail .rep .cmp th { padding: 4px 6px; }\n  .hint { padding: 14px 16px; border-radius: 12px; border: 1px dashed var(--border-strong); color: var(--text-2); font-size: 13px; }\n  .hint b { color: var(--text); }\n  .hint code { font-family: var(--mono); font-size: 12px; background: var(--surface-2); padding: 1px 5px; border-radius: 4px; overflow-wrap: anywhere; }\n\n  /* ---------- woodpecker theme: exactly Woodpecker's shell colors ----------\n     Light: page bg-100 #fff, panel bg-100 with border bg-400 (gray-300), text gray-700/600/500.\n     Dark:  page bg-300 #2d313d, panel bg-200 #303440 with border bg-100 #434858, text gray-200/300/400.\n     Embedded the html[data-theme] Woodpecker sets picks the variant; standalone prefers-color-scheme does. */\n  &[data-theme=\"woodpecker\"] {\n    --bg: #ffffff; --surface: #ffffff; --surface-2: oklch(98.5% .002 247.839);\n    --border: oklch(87.2% .01 258.338); --border-strong: oklch(70.7% .022 261.325);\n    --text: oklch(37.3% .034 259.733); --text-2: oklch(44.6% .03 256.802); --text-3: oklch(55.1% .027 264.364);\n    --accent: oklch(54.6% .245 262.881); --good: #16a34a; --bad: #b91c1c; --warn: #ca8a04; --run: #0891b2; --none: #4b5563;\n    --prim: #369943; --prim-text: #fff; --tab-line: #369943;\n    --ctl: oklch(96.7% .003 264.542); --ctl-2: oklch(92.8% .006 264.531); --ctl-text: oklch(44.6% .03 256.802);\n    --nav: #369943; --nav-text: #fff;\n  }\n  :root[data-theme=\"dark\"] &[data-theme=\"woodpecker\"] {\n    --bg: #2d313d; --surface: #303440; --surface-2: #383c4a;\n    --border: #434858; --border-strong: #4c5165;\n    --text: oklch(92.8% .006 264.531); --text-2: oklch(87.2% .01 258.338); --text-3: oklch(70.7% .022 261.325);\n    --accent: oklch(70.7% .165 254.624); --good: #29904f; --bad: #ef5350; --warn: #e2be2d; --run: #1b869f; --none: oklch(70.7% .022 261.325);\n    --prim: #383c4a; --prim-text: oklch(92.8% .006 264.531); --tab-line: oklch(92.8% .006 264.531);\n    --ctl: #303440; --ctl-2: #383c4a; --ctl-text: oklch(87.2% .01 258.338);\n    --nav: #2a2e3a; --nav-text: oklch(87.2% .01 258.338);\n  }\n  @media (prefers-color-scheme: dark) { :root:not([data-theme]) &[data-theme=\"woodpecker\"] {\n    --bg: #2d313d; --surface: #303440; --surface-2: #383c4a;\n    --border: #434858; --border-strong: #4c5165;\n    --text: oklch(92.8% .006 264.531); --text-2: oklch(87.2% .01 258.338); --text-3: oklch(70.7% .022 261.325);\n    --accent: oklch(70.7% .165 254.624); --good: #29904f; --bad: #ef5350; --warn: #e2be2d; --run: #1b869f; --none: oklch(70.7% .022 261.325);\n    --prim: #383c4a; --prim-text: oklch(92.8% .006 264.531); --tab-line: oklch(92.8% .006 264.531);\n    --ctl: #303440; --ctl-2: #383c4a; --ctl-text: oklch(87.2% .01 258.338);\n    --nav: #2a2e3a; --nav-text: oklch(87.2% .01 258.338);\n  } }\n  &[data-theme=\"woodpecker\"] {\n    --shadow: none; --shadow-lg: 0 10px 30px -10px rgba(0,0,0,.35); --radius: 6px;\n    --sans: var(--font-sans, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', Arial, sans-serif);\n    --mono: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace);\n    --s-a: var(--text-3); --s-b: var(--accent);\n    &::before, &::after { display: none; }\n    .card, .prlist, .tile, .strip, .notice, .owes, .action .ahead, .hint, dialog, .pr-detail .rep, .metric, .threads a { border-radius: var(--radius); box-shadow: none; }\n    .card::before, .card::after, .pr::before { display: none; }\n    .card, .tile, .prlist, .action, .pr-detail { animation: none; }\n    .brand h1 { font-size: 20px; font-weight: 600; }\n    .tabs, .tabs.repos { background: none; border: 0; border-radius: 0; padding: 0; box-shadow: none; gap: 0; }\n    .tabs.views { width: 100%; border-bottom: 1px solid var(--border); margin: 24px 0 16px; }\n    .tab { border-radius: 0; padding: 8px 14px 9px; border-bottom: 2px solid transparent; margin-bottom: -1px; font-weight: 600; color: var(--text-2); }\n    .tab:hover { color: var(--text); background: none; }\n    .tab.active { background: none; box-shadow: none; color: var(--text); border-bottom-color: var(--tab-line); }\n    .tabs.repos .tab { border-bottom: 0; margin: 0; padding: 4px 8px; border-radius: var(--radius); border: 1px solid transparent; }\n    .tabs.repos .tab.active { border-color: var(--ctl-2); background: var(--ctl); }\n    .tab .cnt, .tag, .age, .pr .right .plink, .kbd, .hero .kicker .branch, .strip .kicker .branch { border-radius: 4px; }\n    .chip, .btn, .iconbtn, .herotoggle, .viewas select, .filters .search, .segmented, .field input { border-radius: var(--radius); background: var(--ctl); border: 1px solid var(--ctl-2); color: var(--ctl-text); box-shadow: none; }\n    .chip:hover, .iconbtn:hover, .herotoggle:hover, .btn:hover { background: var(--ctl-2); color: var(--text); transform: none; }\n    .chip.active { background: var(--prim); color: var(--prim-text); border-color: transparent; font-weight: 700; }\n    .btn.primary { background: var(--prim); color: var(--prim-text); border-color: transparent; }\n    .pill { background: transparent; border: 0; padding: 2px 4px; animation: none; font-weight: 600; }\n    .pill svg { width: 15px; height: 15px; }\n    .glyph .ring { animation: none; }\n    .glyph.failure .ring, .glyph.error .ring, .glyph.killed .ring { animation: none; opacity: .12; }\n    .tile { padding: 12px 14px; }\n    .tile .num { font-size: 22px; font-weight: 600; letter-spacing: 0; }\n    .tile.active { box-shadow: 0 0 0 2px var(--tab-line); border-color: transparent; }\n    .hero .headline, .hero-num, .metric .v, .action .ahead h3, .brand h1 { letter-spacing: 0; }\n    .hero-num, .metric .v { font-weight: 600; }\n    .action .ahead { background: var(--surface-2); border: 1px solid var(--border); border-left: 4px solid var(--sc); padding: 9px 14px; }\n    .action .ahead h3 { font-size: 16px; font-weight: 600; }\n    .action .ahead .cnt { font-weight: 600; }\n    .pr { padding: 12px 16px; }\n    .pr:hover { background: var(--ctl); }\n    .section-title h2 { color: var(--text-3); }\n    .strip { border-left-width: 3px; padding: 7px 12px; }\n    .hero-foot .hist a, .strip .hist a, .pr-detail .hist a { border-radius: 2px; }\n    .avatar::before { border-width: 1px; }\n    .rv { border-width: 2px; }\n    .live { box-shadow: none; }\n  }\n  /* Standalone in the woodpecker theme: our topbar becomes the Woodpecker navbar. */\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar { background: var(--nav); color: var(--nav-text); margin: -24px -24px 20px; padding: 10px 24px; border-bottom: 1px solid var(--border); }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .brand h1, &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .brand h1 span, &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .refresh { color: var(--nav-text); }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .iconbtn { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.25); color: var(--nav-text); }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .iconbtn:hover { background: rgba(255,255,255,.22); }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .tabs.repos .tab { color: var(--nav-text); opacity: .85; }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .tabs.repos .tab.active { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.3); color: var(--nav-text); }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .tabs.repos .tab .cnt { background: rgba(255,255,255,.14); color: var(--nav-text); border-color: transparent; }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .refresh .ring .track { stroke: rgba(255,255,255,.35); }\n  &[data-theme=\"woodpecker\"]:not(.embedded) .topbar .refresh .ring .prog { stroke: var(--nav-text); }\n  /* Embedded in the woodpecker theme: inside Woodpecker's shell, under its navbar. */\n  &.embedded.inshell { position: static; inset: auto; overflow: visible; z-index: auto; min-height: 0; flex: 1; width: 100%; }\n  &.embedded.inshell .brand h1 { display: none; }\n  &.embedded.inshell .brand .bw-logo { width: 44px; }\n  &.embedded.inshell .wrap { padding-top: 16px; }\n  /* ---------- hero strip ---------- */\n  .section-title .herotoggle { margin-left: auto; font-size: 12px; font-weight: 600; color: var(--text-2); display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); }\n  .section-title .herotoggle:hover { color: var(--text); border-color: var(--border-strong); }\n  .section-title .herotoggle .chev svg { transition: transform .2s; }\n  .section-title .herotoggle .chev.up svg { transform: rotate(180deg); }\n  .strips { display: grid; gap: 6px; }\n  .strip { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow); border-left: 4px solid var(--sc); min-width: 0; }\n  .strip .kicker { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-3); white-space: nowrap; display: inline-flex; gap: 6px; align-items: center; }\n  .strip .kicker .branch { font-family: var(--mono); text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--text-2); background: var(--surface-2); border: 1px solid var(--border); border-radius: 6px; padding: 0 6px; }\n  .strip .num { color: var(--text-2); font-size: 12px; }\n  .strip .msg { flex: 1; min-width: 80px; color: var(--text-2); font-size: 13px; }\n  .strip .fail { color: var(--bad); font-size: 12px; font-weight: 600; max-width: 320px; }\n  .strip .meta { color: var(--text-3); font-size: 12px; white-space: nowrap; }\n  .strip .hist a { width: 7px; height: 14px; }\n  .strip .hist a.cur { box-shadow: 0 0 0 3px var(--c); }\n  /* ---------- row extras ---------- */\n  .age { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 6px; color: var(--text-2); background: var(--surface-2); border: 1px solid var(--border); white-space: nowrap; }\n  .age.warm { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 40%, transparent); background: color-mix(in srgb, var(--warn) 10%, transparent); }\n  .age.hot { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 40%, transparent); background: color-mix(in srgb, var(--bad) 10%, transparent); }\n  .also { font-size: 11px; color: var(--text-3); white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; }\n  .also .bad { color: var(--bad); font-weight: 600; }\n  .also .warn { color: var(--warn); font-weight: 600; }\n  .also .none { color: var(--text-2); font-weight: 600; }\n  a.tag.bucket svg { width: 10px; height: 10px; }\n  a.tag.bucket:hover { text-decoration: none; filter: brightness(.92); }\n  .rvs { display: inline-flex; gap: 4px; align-items: center; margin-left: 2px; }\n  .rv { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; border: 2px solid var(--border-strong); background: var(--surface-2); overflow: hidden; }\n  .rv img { width: 100%; height: 100%; object-fit: cover; display: block; }\n  .rv i { font-style: normal; font-size: 9px; font-weight: 700; color: var(--text-2); }\n  .rv.asked { border-style: dashed; }\n  .rv.ok { border-color: var(--good); }\n  .rv.cr { border-color: var(--bad); }\n  .rv.cm { border-color: var(--run); }\n  .threads { margin-top: 10px; display: grid; gap: 4px; }\n  .threads .th { font-size: 12px; font-weight: 700; margin-bottom: 2px; }\n  .threads a { display: flex; gap: 10px; align-items: center; font-size: 12px; padding: 5px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); min-width: 0; }\n  .threads a:hover { border-color: var(--border-strong); text-decoration: none; }\n  .threads a .mono { flex: 1; min-width: 0; font-size: 11.5px; }\n  /* ---------- who owes what ---------- */\n  .owes { padding: 16px 20px 12px; margin-bottom: 20px; }\n  .owes .cmp td.zero { color: var(--text-3); }\n  .owes .cmp td.n.acc { color: var(--accent); font-weight: 700; }\n  .owes .cmp td.n.warn { color: var(--warn); font-weight: 700; }\n  .owes .cmp td.n.bad { color: var(--bad); font-weight: 700; }\n  .owes .cmp td.n.good { color: var(--good); font-weight: 700; }\n  .owes tr.who { cursor: pointer; }\n  .owes tr.who:hover td { background: var(--surface-2); }\n  /* ---------- actions / view tabs / repo switcher ---------- */\n  .tabs.views { margin: 28px 0 16px; }\n  .tabs.repos { margin-bottom: 0; padding: 3px; box-shadow: none; }\n  .tabs.repos .tab { padding: 5px 10px; font-size: 12px; }\n  .ptabs { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0 0 16px; }\n  .viewas { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-2); margin-left: auto; }\n  .viewas select { font: inherit; font-size: 13px; padding: 6px 10px; border-radius: 999px; border: 1px solid var(--border); background: var(--surface); color: var(--text); }\n  .action { margin-bottom: 30px; animation: rise .4s cubic-bezier(.2,.7,.2,1) both; }\n  .action .ahead { display: flex; align-items: center; gap: 12px; margin: 0 0 10px; padding: 11px 16px; flex-wrap: wrap; border-radius: 12px; background: color-mix(in srgb, var(--sc) 9%, var(--surface)); border: 1px solid color-mix(in srgb, var(--sc) 30%, transparent); border-left: 6px solid var(--sc); box-shadow: var(--shadow); }\n  .action .ahead .bar { display: none; }\n  .action .ahead h3 { font-size: 18px; font-weight: 800; letter-spacing: -.02em; color: var(--text); line-height: 1.2; }\n  .action .ahead .cnt { font-size: 13px; font-weight: 800; min-width: 26px; text-align: center; padding: 2px 9px; border-radius: 999px; color: #fff; background: var(--sc); }\n  .action .ahead .sub { font-size: 12.5px; color: var(--text-2); }\n  .allclear { padding: 36px; text-align: center; }\n  .allclear .big { font-size: 20px; font-weight: 700; margin-bottom: 6px; }\n  .allclear p { max-width: 520px; margin: 0 auto; }\n  .allclear button.link, .hint button.link { color: var(--accent); font-weight: 600; padding: 0; }\n  .tag.bucket { color: var(--bc); border-color: color-mix(in srgb, var(--bc) 40%, transparent); background: color-mix(in srgb, var(--bc) 9%, transparent); }\n  .tag.task { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); background: color-mix(in srgb, var(--accent) 9%, transparent); font-weight: 700; }\n  .filters.blockers { margin-top: -6px; }\n  &.settled .action { animation: none; }\n\n  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .001s !important; animation-iteration-count: 1 !important; } }\n\n  @media (max-width: 1500px) { .brand h1 span { display: none; } }\n  /* ---------- phones (≤720px) ----------\n     Everything below only re-flows what the desktop layout keeps on one line:\n     the PR row becomes avatar + text on top and a full-width status line under\n     it, tags wrap instead of overflowing, wide tables scroll inside their card. */\n  @media (max-width: 720px) {\n    .wrap { padding: 12px 12px 48px; }\n    /* top bar: brand + buttons on the first line, repo switcher + refresh clock on the second */\n    .topbar { gap: 10px; margin-bottom: 14px; }\n    .topbar .brand { margin-right: auto; }\n    .topbar .spacer { display: none; }\n    .topbar .tabs.repos { order: 10; flex: 1 1 auto; min-width: 0; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }\n    .topbar .tabs.repos::-webkit-scrollbar { display: none; }\n    .topbar .tabs.repos .tab { white-space: nowrap; flex: none; }\n    .topbar .tabs.repos .tab .org { display: none; }\n    .topbar .refresh { order: 11; font-size: 12px; }\n    .brand h1 { font-size: 17px; }\n    .brand .bw-logo { width: 40px; }\n    &[data-theme=\"woodpecker\"]:not(.embedded) .topbar { margin: -12px -12px 14px; padding: 8px 12px; }\n    /* section titles: heading + toggle on one line, the subtitle underneath */\n    .section-title { flex-wrap: wrap; row-gap: 2px; margin: 22px 0 10px; }\n    .section-title .sub { flex-basis: 100%; order: 3; }\n    .section-title .herotoggle { margin-left: auto; }\n    /* view tabs fill the width */\n    .tabs.views { width: 100%; margin: 20px 0 14px; }\n    .tabs.views .tab { flex: 1 1 auto; justify-content: center; padding: 8px 10px; }\n    .ptabs { gap: 8px; }\n    .viewas { margin-left: 0; width: 100%; }\n    .viewas select { flex: 1; min-width: 0; }\n    /* latest: hero cards and strips */\n    .hero { grid-template-columns: 56px 1fr; gap: 12px; padding: 16px 16px 12px; }\n    .glyph { width: 56px; height: 56px; }\n    .glyph .disc { inset: 6px; }\n    .glyph svg.icon { width: 24px; height: 24px; }\n    .hero .headline { font-size: 17px; }\n    .hero-foot { padding: 10px 16px 14px; }\n    .strip { flex-wrap: wrap; row-gap: 4px; column-gap: 8px; padding: 8px 12px; }\n    .strip .msg { flex: 1 1 100%; }\n    .strip .fail { flex: 1 1 100%; max-width: none; }\n    .strip .meta { white-space: normal; }\n    .strip .hist { margin-left: auto; }\n    /* summary tiles: three per row */\n    .tiles { grid-template-columns: repeat(auto-fit, minmax(96px, 1fr)); gap: 8px; margin-top: 16px; }\n    .tile { padding: 10px 10px; gap: 8px; border-radius: 12px; }\n    .tile .num { font-size: 22px; }\n    .tile .mark { height: 32px; width: 8px; }\n    /* filters: chips wrap, the search box takes the whole line */\n    .chip { padding: 8px 12px; }\n    .filters .search { margin-left: 0; width: 100%; padding: 9px 12px; font-size: 14px; }\n    /* action headings: title + count on one line, the subtitle underneath */\n    .action { margin-bottom: 22px; }\n    .action .ahead { padding: 10px 12px; gap: 8px 10px; }\n    .action .ahead h3 { flex: 1 1 0; min-width: 0; font-size: 17px; }\n    .action .ahead .sub { flex-basis: 100%; }\n    /* PR row: avatar | text, then a full-width status line, then the detail */\n    .pr { grid-template-columns: 40px 1fr; gap: 8px 12px; padding: 12px 14px; }\n    .avatar { width: 40px; height: 40px; }\n    .avatar img, .avatar .initials { width: 36px; height: 36px; }\n    .pr .title { flex-wrap: wrap; gap: 4px 6px; }\n    .pr .title a.truncate { flex: 1 1 100%; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }\n    .also { white-space: normal; }\n    .pr .sub { gap: 6px 10px; }\n    .pr .sub .br { max-width: 100%; }\n    .pr .right { grid-column: 1 / -1; justify-self: stretch; flex-wrap: wrap; justify-content: flex-end; gap: 8px; padding-top: 2px; }\n    .pr .right .stat { margin-right: auto; text-align: left; min-width: 0; }\n    .pr .right .pill, .pr .right .plink, .pr .chev { flex: none; }\n    .pr-detail { padding: 8px 0 0; }\n    .pr-detail .rep { flex: 1 1 100%; min-width: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; }\n    .pr-detail .rep .cmp { min-width: max-content; }\n    .threads a { flex-wrap: wrap; }\n    .threads a .mono { flex: 1 1 100%; }\n    /* who owes what: the table scrolls inside the card, the name column stays put */\n    .owes { padding: 14px 12px 8px; margin-bottom: 14px; }\n    .owes .cmp { font-size: 12px; }\n    .owes .cmp td, .owes .cmp th { padding: 7px 6px; }\n    .owes .cmp td:first-child, .owes .cmp th:first-child { position: sticky; left: 0; z-index: 1; background: var(--surface); box-shadow: 1px 0 0 var(--border); }\n    .owes tr.who:hover td:first-child { background: var(--surface-2); }\n    .ihead .links { margin-left: 0; flex-basis: 100%; }\n    /* insights: the numeric tables scroll, the bar chart keeps its label column short */\n    .insights .card { padding: 14px 14px 12px; }\n    .insights .cmp { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }\n    .bar-row { grid-template-columns: 56px 1fr 56px; gap: 6px; }\n    .hero-num { font-size: 40px; }\n    /* settings dialog */\n    dialog .dhead { padding: 16px 16px 0; }\n    dialog form { padding: 16px; }\n    .actions { flex-wrap: wrap; }\n    .actions > .faint { flex-basis: 100%; }\n    .allclear { padding: 24px 16px; }\n    .empty { padding: 28px 16px; }\n  }\n  &.embedded { position: fixed; inset: 0; overflow: auto; z-index: 1000; min-height: 0; }\n  &.embedded .standalone-only { display: none; }\n  &.settled .card, &.settled .tile, &.settled .prlist, &.settled .pr-detail { animation: none; }\n  .live { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--good); margin-right: 6px; box-shadow: 0 0 0 3px color-mix(in srgb, var(--good) 20%, transparent); vertical-align: 1px; }\n  .streak-big { display: flex; align-items: baseline; gap: 8px; margin: 2px 0 12px; }\n  .streak-big b { font-size: 44px; font-weight: 800; letter-spacing: -.04em; line-height: 1; font-variant-numeric: tabular-nums; }\n  .streak-big small { font-size: 13px; color: var(--text-3); }\n  .game { display: grid; grid-template-columns: minmax(280px, 5fr) 8fr; gap: 16px; align-items: stretch; }\n  .game .card { padding: 18px 20px 16px; }\n  .game .card.wide { grid-column: 1 / -1; }\n  @media (max-width: 860px) { .game { grid-template-columns: 1fr; } }\n  .game .gi { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; display: block; }\n  .game .m-locked { --m1: var(--surface-2); --m2: var(--surface-2); --m3: var(--border-strong); }\n  .game .m-bronze { --m1: #f6c79b; --m2: #c47a3a; --m3: #7a4520; }\n  .game .m-silver { --m1: #ffffff; --m2: #b9c3cf; --m3: #6b7684; }\n  .game .m-gold { --m1: #fff0b3; --m2: #f2b320; --m3: #95650a; }\n  .game .hero-streak { display: flex; flex-direction: column; align-items: center; text-align: center; isolation: isolate; }\n  .game .hero-streak .ihead { align-self: stretch; }\n  .game .hero-streak .glow { position: absolute; inset: -30% -20% auto; height: 80%; z-index: -1; pointer-events: none; opacity: 0; transition: opacity .6s;\n    background: radial-gradient(closest-side, color-mix(in srgb, #f97316 26%, transparent), transparent); }\n  .game .hero-streak.lit .glow { opacity: 1; animation: breathe 5s ease-in-out infinite; }\n  .game .sring { position: relative; width: 184px; height: 184px; margin: 2px 0 10px; }\n  .game .sring svg { width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible; }\n  .game .sring circle { fill: none; stroke-width: 13; }\n  .game .sring .bg { stroke: color-mix(in srgb, var(--warn) 14%, var(--surface-2)); }\n  .game .sring .fg { stroke: url(#bw-ring); stroke-linecap: round; animation: ringdraw 1.4s cubic-bezier(.2,.7,.2,1) both; filter: drop-shadow(0 0 6px color-mix(in srgb, #f97316 45%, transparent)); }\n  .game .sring .core { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }\n  .game .sring .core b { font-size: 60px; font-weight: 800; letter-spacing: -.05em; line-height: .95;\n    background: linear-gradient(180deg, var(--text) 30%, color-mix(in srgb, #f97316 70%, var(--text))); -webkit-background-clip: text; background-clip: text; color: transparent; }\n  .game .hero-streak:not(.lit) .sring .core b { background: none; color: var(--text-3); }\n  .game .sring .core small { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .12em; color: var(--text-3); margin-top: 4px; }\n  .game .flame { position: relative; color: var(--text-3); margin-bottom: 2px; }\n  .game .flame .gi { width: 26px; height: 26px; }\n  .game .lit .flame { color: #f97316; }\n  .game .lit .flame .gi { fill: color-mix(in srgb, #fbbf24 55%, transparent); transform-origin: 50% 90%; animation: flicker 2.6s ease-in-out infinite; filter: drop-shadow(0 0 8px color-mix(in srgb, #f97316 70%, transparent)); }\n  .game .flame i { position: absolute; left: 50%; bottom: 60%; width: 4px; height: 4px; border-radius: 50%; background: #fbbf24; opacity: 0; animation: ember 2.4s ease-out infinite; }\n  .game .flame i:nth-child(3) { margin-left: -7px; animation-delay: .8s; background: #f97316; }\n  .game .flame i:nth-child(4) { margin-left: 5px; animation-delay: 1.6s; }\n  .game .goal { font-size: 13px; color: var(--text-2); }\n  .game .goal b { color: var(--text); }\n  .game .best { font-size: 12px; color: var(--text-3); margin-top: 3px; }\n  .game .best b { color: var(--text-2); }\n  .game .owes-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 14px; }\n  .game .owe { display: inline-flex; align-items: baseline; gap: 6px; padding: 4px 10px; border-radius: 999px; font: 600 12px var(--mono); border: 1px solid var(--border); color: var(--text-2); text-decoration: none; transition: transform .15s, border-color .15s; }\n  .game .owe small { font: 500 11px var(--sans); color: var(--text-3); }\n  .game .owe:hover { transform: translateY(-1px); border-color: var(--border-strong); }\n  .game .owe.late { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 45%, transparent); background: color-mix(in srgb, var(--bad) 9%, transparent); }\n  .game .owe.soon { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 45%, transparent); background: color-mix(in srgb, var(--warn) 8%, transparent); }\n  .game .owe.clear { font-family: var(--sans); font-weight: 500; color: var(--good); border-color: color-mix(in srgb, var(--good) 35%, transparent); }\n  .game .days-body { display: grid; grid-template-columns: auto 1fr; gap: 24px; align-items: start; }\n  .game .days-body .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  @media (max-width: 1100px) { .days-body { grid-template-columns: 1fr; } }\n  .game .heat { display: flex; gap: 6px; margin: 2px 0 10px; overflow-x: auto; padding: 4px 2px; }\n  .game .heat .dows, .game .heat .wk { display: grid; grid-template-rows: 16px repeat(5, 32px); gap: 6px; }\n  .game .heat .dows span { font-size: 10.5px; color: var(--text-3); line-height: 32px; padding-right: 6px; }\n  .game .heat .mo { font-size: 10.5px; font-weight: 600; color: var(--text-3); white-space: nowrap; line-height: 14px; }\n  .game .heat i { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; font: 600 11px var(--mono); font-style: normal; color: var(--text-3); transition: transform .12s; }\n  .game .heat i.l2, .game .heat i.l3, .game .heat i.l4, .game .heat i.late { color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,.25); }\n  .game .heat-legend i { display: block; transition: transform .12s; }\n  .game .heat i:not(.void):hover { transform: scale(1.18); }\n  .game .heat i.void { background: transparent; }\n  .game .l0 { background: var(--surface-2); box-shadow: inset 0 0 0 1px var(--border); }\n  .game .l1 { background: color-mix(in srgb, var(--good) 32%, var(--surface)); }\n  .game .l2 { background: color-mix(in srgb, var(--good) 55%, var(--surface)); }\n  .game .l3 { background: color-mix(in srgb, var(--good) 78%, var(--surface)); }\n  .game .l4 { background: var(--good); box-shadow: 0 0 10px -2px color-mix(in srgb, var(--good) 70%, transparent); }\n  .game .late { background: var(--bad); }\n  .game .heat i.today { outline: 2px solid var(--text-2); outline-offset: 2px; }\n  .game .heat-legend { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-3); margin-bottom: 14px; flex-wrap: wrap; }\n  .game .heat-legend i { width: 12px; height: 12px; border-radius: 3px; }\n  .game .heat-legend span:nth-of-type(2) { margin-right: 12px; }\n  .game .metric .meter { height: 5px; border-radius: 3px; margin: 7px 0 4px; background: color-mix(in srgb, var(--good) 16%, var(--surface-2)); overflow: hidden; }\n  .game .metric .meter i { display: block; height: 100%; border-radius: 3px; background: var(--good); }\n  .game .metric.hot .v { color: var(--bad); }\n  .game .metric .s { font-size: 11px; color: var(--text-3); margin-top: 2px; }\n  .game .achs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }\n  @media (max-width: 720px) { .game .achs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }\n  .game .ach { position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 16px 12px 12px; border-radius: 14px; border: 1px solid var(--border);\n    background: linear-gradient(180deg, color-mix(in srgb, var(--m2, transparent) 10%, var(--surface-2)), var(--surface-2)); transition: transform .2s, box-shadow .2s, border-color .2s; }\n  .game .ach:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--border-strong); }\n  .game .ach.t1 { border-color: color-mix(in srgb, #c47a3a 45%, var(--border)); }\n  .game .ach.t2 { border-color: color-mix(in srgb, #9aa5b3 60%, var(--border)); }\n  .game .ach.t3 { border-color: color-mix(in srgb, #f2b320 60%, var(--border)); box-shadow: 0 10px 28px -16px color-mix(in srgb, #f2b320 80%, transparent); }\n  .game .ach b { font-size: 13.5px; margin-top: 10px; }\n  .game .ach small { font-size: 11px; color: var(--text-3); line-height: 1.35; margin-top: 3px; min-height: 30px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }\n  .game .ach.t0 b { color: var(--text-2); }\n  .game .medal { position: relative; display: grid; place-items: center; width: 58px; height: 58px; border-radius: 50%; overflow: hidden; flex: none;\n    background: radial-gradient(circle at 34% 28%, var(--m1), var(--m2) 58%, var(--m3));\n    box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--m3) 55%, transparent), inset 0 -6px 10px -4px color-mix(in srgb, var(--m3) 60%, transparent), 0 8px 18px -8px color-mix(in srgb, var(--m2) 85%, transparent);\n    color: color-mix(in srgb, var(--m3) 80%, #1a1a1a); }\n  .game .medal .gi { width: 26px; height: 26px; stroke-width: 2.2; filter: drop-shadow(0 1px 0 color-mix(in srgb, var(--m1) 70%, transparent)); }\n  .game .medal::after { content: ''; position: absolute; inset: -20%; background: linear-gradient(100deg, transparent 38%, rgba(255,255,255,.65) 50%, transparent 62%); transform: translateX(-120%); }\n  .game .ach:hover .medal:not(.m-locked)::after { animation: shine .9s ease-out; }\n  .game .medal.m-locked { background: var(--surface); box-shadow: inset 0 0 0 2px var(--border-strong); color: var(--text-3); }\n  .game .medal.m-locked::before { content: ''; position: absolute; inset: 5px; border-radius: 50%; border: 1.5px dashed var(--border-strong); }\n  .game .medal.m-locked .gi { opacity: .55; filter: none; }\n  .game .medal.mini { width: 22px; height: 22px; display: inline-grid; vertical-align: -6px; margin: 0 5px 0 3px; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--m3) 55%, transparent); }\n  .game .medal.mini .gi { width: 12px; height: 12px; stroke-width: 2.6; }\n  .game .sprog { align-self: stretch; height: 4px; border-radius: 2px; margin-top: 12px; background: color-mix(in srgb, var(--m2) 18%, var(--surface)); overflow: hidden; }\n  .game .sprog i { display: block; height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--m3), var(--m2)); }\n  .game .ach-foot { align-self: stretch; display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font: 500 11px var(--mono); color: var(--text-3); }\n  .game .pips { display: flex; gap: 3px; }\n  .game .pips i { width: 7px; height: 7px; border-radius: 50%; background: var(--border-strong); }\n  .game .pips i.on { background: radial-gradient(circle at 35% 30%, var(--m1), var(--m2) 60%, var(--m3)); }\n  .game .tl { position: relative; padding-left: 4px; }\n  .game .tl::before { content: ''; position: absolute; left: 19px; top: 8px; bottom: 8px; width: 2px; border-radius: 1px; background: linear-gradient(180deg, var(--border-strong), transparent); }\n  .game .tl-day { position: relative; margin: 14px 0 6px 44px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); }\n  .game .tl-day:first-child { margin-top: 0; }\n  .game .tl-row { position: relative; display: flex; align-items: center; gap: 12px; padding: 6px 8px 6px 0; border-radius: 10px; font-size: 13px; transition: background .15s; }\n  .game .tl-row:hover { background: color-mix(in srgb, var(--text) 4%, transparent); }\n  .game .tl-row.up { background: linear-gradient(90deg, color-mix(in srgb, #f2b320 10%, transparent), transparent 70%); }\n  .game .tl-body { flex: 1; min-width: 0; line-height: 1.6; }\n  .game .tl-body .who { font-weight: 700; }\n  .game .tl-body a { color: var(--accent); font-family: var(--mono); font-size: 12px; }\n  .game .tl-at { font-size: 11.5px; font-family: var(--mono); white-space: nowrap; }\n  .game .gav { position: relative; z-index: 1; flex: none; width: 32px; height: 32px; border-radius: 50%; overflow: hidden; background: var(--surface-2); box-shadow: 0 0 0 3px var(--surface); display: grid; place-items: center; }\n  .game .gav img { width: 100%; height: 100%; object-fit: cover; display: block; }\n  .game .gav i { font: 700 11px var(--sans); font-style: normal; color: var(--text-2); }\n  .game .up-tag { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em;\n    color: color-mix(in srgb, var(--m3) 85%, #111); background: linear-gradient(135deg, var(--m1), var(--m2)); box-shadow: 0 2px 8px -3px color-mix(in srgb, var(--m2) 90%, transparent); }\n.mins { display: grid; grid-template-columns: minmax(280px, 5fr) 8fr; gap: 16px; align-items: stretch; --c-amd: #2563eb; --c-arm: #0d9488; }\n  @media (prefers-color-scheme: dark) { &:not([data-theme=\"light\"]) .mins { --c-amd: #4f8ff7; --c-arm: #12a594; } }\n  &[data-theme=\"dark\"] .mins { --c-amd: #4f8ff7; --c-arm: #12a594; }\n  .mins .card { padding: 18px 20px 16px; }\n  .mins .card.wide { grid-column: 1 / -1; }\n  @media (max-width: 860px) { .mins { grid-template-columns: 1fr; } }\n  .mins .hero-num { margin: 4px 0 6px; animation: rise .5s cubic-bezier(.2,.7,.2,1) both; }\n  .mins .mins-delta { font-size: 12.5px; margin-bottom: 16px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }\n  .mins .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .mins .mins-hot .v { color: var(--bad); }\n  .mins .metric .s { font-size: 11px; color: var(--text-3); margin-top: 2px; }\n  .mins .mins-cols { display: flex; align-items: flex-end; gap: 3px; height: 170px; padding-bottom: 18px; position: relative; }\n  .mins .mins-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; position: relative; cursor: default; }\n  .mins .mins-col .stack { display: flex; flex-direction: column; border-radius: 4px 4px 1px 1px; overflow: hidden; min-height: 2px; transition: filter .15s; transform-origin: bottom; animation: growup .7s cubic-bezier(.2,.7,.2,1) both; }\n  .mins .mins-col:hover .stack { filter: brightness(1.15) saturate(1.1); }\n  .mins .mins-col.we .stack { opacity: .7; }\n  .mins .stack i { display: block; flex: none; }\n  .mins .stack .amd, .mins .mins-legend .amd { background: var(--c-amd); }\n  .mins .stack .arm, .mins .mins-legend .arm { background: var(--c-arm); }\n  .mins .stack .w, .mins .mins-legend .w, .mins .tm-waste { background: repeating-linear-gradient(135deg, color-mix(in srgb, var(--bad) 85%, transparent) 0 3px, color-mix(in srgb, var(--bad) 35%, transparent) 3px 6px); }\n  .mins .mins-col .dl { position: absolute; left: 0; bottom: -17px; font-size: 10px; color: var(--text-3); white-space: nowrap; }\n  .mins .mins-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 11.5px; color: var(--text-2); margin-top: 10px; }\n  .mins .mins-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 3px; vertical-align: -1px; margin-right: 5px; }\n  .mins .mins-q { font-size: 11px; margin: 14px 0 4px; }\n  .mins .mins-crumbs .link { font-weight: 600; }\n  .mins .tm { position: relative; height: clamp(300px, 38vw, 470px); border-radius: 12px; overflow: hidden; background: var(--surface-2); }\n  @media (max-width: 600px) { .mins .tm { height: 420px; } }\n  .mins .tm-cell { position: absolute; border-radius: 8px; overflow: hidden; padding: 8px 10px; color: #fff; will-change: left, top, width, height;\n    background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 88%, #fff), var(--tc) 55%, color-mix(in srgb, var(--tc) 80%, #000));\n    box-shadow: inset 0 0 0 1px rgba(255,255,255,.12); transition: filter .15s, box-shadow .15s; }\n  .mins .tm-cell:hover { filter: brightness(1.12) saturate(1.1); box-shadow: inset 0 0 0 2px rgba(255,255,255,.55); z-index: 1; }\n  .mins .tm-cell.pick { cursor: zoom-in; }\n  .mins .tm-cell b { position: relative; display: block; font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-shadow: 0 1px 2px rgba(0,0,0,.25); }\n  .mins .tm-cell small { position: relative; display: block; font: 500 11px var(--mono); opacity: .85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }\n  .mins .tm-cell.mid small { display: none; }\n  .mins .tm-cell.tiny b, .mins .tm-cell.tiny small { display: none; }\n  .mins .tm-waste { position: absolute; left: 0; right: 0; bottom: 0; opacity: .9; }\n  .mins .mins-bar { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(60px, 1fr) auto; gap: 10px; align-items: center; padding: 6px 0; font-size: 12.5px; border-bottom: 1px solid var(--border); }\n  .mins .mins-bar:last-child { border-bottom: 0; }\n  .mins .mins-bar .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  .mins .mins-bar .nm a { color: var(--accent); font-family: var(--mono); }\n  .mins .mins-bar .tr { height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--accent) 12%, var(--surface-2)); overflow: hidden; }\n  .mins .mins-bar .tr i { display: block; height: 100%; border-radius: 4px; background: var(--accent); transform-origin: left; animation: growright .7s cubic-bezier(.2,.7,.2,1) both; }\n  .mins .mins-bar .vl { font-size: 12px; color: var(--text-2); }\n  @media (prefers-reduced-motion: reduce) { .mins .hero-num, .mins .mins-col .stack, .mins .mins-bar .tr i { animation: none; } }\n.wx { display: grid; grid-template-columns: minmax(280px, 5fr) 8fr; gap: 16px; align-items: stretch;\n    --wx-sun: #f59e0b; --wx-cloud: #94a3b8; --wx-rain: #3b82f6; --wx-storm: #7c3aed; }\n  .wx .card { padding: 18px 20px 16px; }\n  .wx .card.wide { grid-column: 1 / -1; }\n  @media (max-width: 860px) { .wx { grid-template-columns: 1fr; } }\n  .wx .wx-g { width: 16px; height: 17px; display: block; overflow: visible; fill: none; stroke-linecap: round; stroke-linejoin: round; }\n  .wx .wx-g .sun circle { fill: var(--wx-sun); stroke: none; }\n  .wx .wx-g .rays { stroke: var(--wx-sun); stroke-width: 3; transform-origin: 24px 24px; }\n  .wx .wx-g .cloud { fill: color-mix(in srgb, var(--wx-cloud) 55%, var(--surface)); stroke: var(--wx-cloud); stroke-width: 2.5; }\n  .wx .wx-g-rain .cloud { fill: color-mix(in srgb, var(--wx-rain) 25%, var(--surface)); stroke: var(--wx-rain); }\n  .wx .wx-g-storm .cloud { fill: color-mix(in srgb, var(--wx-storm) 45%, var(--surface)); stroke: var(--wx-storm); }\n  .wx .wx-g .drops { stroke: var(--wx-rain); stroke-width: 2.5; }\n  .wx .wx-g .bolt { fill: #facc15; stroke: #a16207; stroke-width: 1.2; }\n  .wx .wx-hero { position: relative; isolation: isolate; }\n  .wx .wx-hero::after { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; opacity: .9;\n    background: radial-gradient(120% 70% at 20% 0%, color-mix(in srgb, var(--wx-tint) 22%, transparent), transparent 70%); }\n  .wx .wx-hero.wx-sun { --wx-tint: var(--wx-sun); }\n  .wx .wx-hero.wx-cloud { --wx-tint: var(--wx-cloud); }\n  .wx .wx-hero.wx-rain { --wx-tint: var(--wx-rain); }\n  .wx .wx-hero.wx-storm { --wx-tint: var(--wx-storm); }\n  .wx .wx-now { display: flex; align-items: center; gap: 18px; margin: 6px 0 16px; }\n  .wx .wx-g.big { width: 104px; height: 112px; flex: none; filter: drop-shadow(0 8px 18px color-mix(in srgb, var(--wx-tint) 45%, transparent)); }\n  .wx .wx-g.big .rays { animation: spin 24s linear infinite; }\n  .wx .wx-g.big .cloud { animation: drift 6s ease-in-out infinite; }\n  .wx .wx-g.big .drops path { animation: drop 1.1s linear infinite; }\n  .wx .wx-g.big .drops path:nth-child(2) { animation-delay: .35s; }\n  .wx .wx-g.big .drops path:nth-child(3) { animation-delay: .7s; }\n  .wx .wx-g.big .bolt { animation: flash 3.2s ease-in-out infinite; }\n  .wx .wx-verdict { font-size: 14px; font-weight: 600; margin-top: 6px; }\n  .wx .wx-delta { font-size: 12.5px; margin-top: 6px; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }\n  .wx .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .wx .metric .s { font-size: 11px; color: var(--text-3); margin-top: 2px; }\n  .wx .wx-map { overflow-x: auto; padding-bottom: 4px; }\n  .wx .wx-row { display: flex; align-items: center; gap: 3px; margin-bottom: 3px; min-width: max-content; }\n  .wx .wx-name { width: 150px; flex: none; font-size: 11.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; position: sticky; left: 0; z-index: 2; background: var(--surface); }\n  @media (max-width: 600px) { .wx .wx-name { width: 112px; } }\n  .wx .wx-rank td.name { white-space: nowrap; }\n  .wx .wx-name small { display: block; font: 400 10px var(--sans); color: var(--text-3); }\n  .wx .wx-cell, .wx .wx-dh { width: 20px; height: 22px; flex: none; border-radius: 5px; display: grid; place-items: center; position: relative; font-style: normal; transition: transform .12s; }\n  .wx .wx-dh { height: 14px; font-size: 9.5px; color: var(--text-3); white-space: nowrap; justify-items: start; overflow: visible; }\n  .wx .wx-cell:not(.wx-void):hover { transform: scale(1.25); z-index: 1; }\n  .wx .wx-cell .wx-g { width: 14px; height: 15px; }\n  .wx .wx-cell.wx-void { box-shadow: inset 0 0 0 1px var(--border); opacity: .6; }\n  .wx .wx-cell.wx-sun { background: color-mix(in srgb, var(--wx-sun) 12%, var(--surface-2)); }\n  .wx .wx-cell.wx-cloud { background: color-mix(in srgb, var(--wx-cloud) 26%, var(--surface-2)); }\n  .wx .wx-cell.wx-rain { background: color-mix(in srgb, var(--wx-rain) 26%, var(--surface-2)); }\n  .wx .wx-cell.wx-storm { background: color-mix(in srgb, var(--wx-storm) 40%, var(--surface-2)); box-shadow: 0 0 10px -2px color-mix(in srgb, var(--wx-storm) 70%, transparent); }\n  .wx .wx-cell.we { opacity: .75; }\n  .wx .wx-cell.real::after, .wx .wx-realdot { content: ''; position: absolute; right: 1px; top: 1px; width: 5px; height: 5px; border-radius: 50%; background: var(--bad); }\n  .wx .wx-realdot { position: static; display: inline-block; margin-right: 5px; }\n  .wx .wx-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; font-size: 11.5px; color: var(--text-3); }\n  .wx .wx-legend span { display: inline-flex; align-items: center; gap: 5px; }\n  .wx .wx-legend b { color: var(--text-2); font-weight: 600; }\n  .wx .wx-rank tbody tr { cursor: pointer; transition: background .12s; }\n  .wx .wx-rank tbody tr:hover, .wx .wx-rank tbody tr.on { background: color-mix(in srgb, var(--warn) 8%, transparent); }\n  .wx .wx-rank td.prs a { color: var(--accent); font-family: var(--mono); font-size: 12px; }\n  .wx .wx-rate { position: relative; width: 140px; height: 18px; border-radius: 5px; background: color-mix(in srgb, var(--warn) 10%, var(--surface-2)); overflow: hidden; }\n  .wx .wx-rate i { position: absolute; inset: 0 auto 0 0; background: color-mix(in srgb, var(--warn) 55%, transparent); transform-origin: left; animation: growright .7s cubic-bezier(.2,.7,.2,1) both; }\n  .wx .wx-rate span { position: relative; font-size: 11px; line-height: 18px; padding-left: 6px; }\n  .wx .wx-tl-day { margin: 14px 0 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--text-3); }\n  .wx .wx-tl-day:first-child { margin-top: 0; }\n  .wx .wx-tl-row { display: flex; align-items: center; gap: 10px; padding: 6px 4px; border-radius: 8px; font-size: 13px; line-height: 1.5; }\n  .wx .wx-tl-row:hover { background: color-mix(in srgb, var(--text) 4%, transparent); }\n  .wx .wx-tl-row > div { flex: 1; min-width: 0; }\n  .wx .wx-tl-row .wx-g { width: 18px; height: 20px; flex: none; }\n  .wx .wx-tl-row a { color: var(--accent); }\n  .wx .wx-at { font-size: 11.5px; font-family: var(--mono); white-space: nowrap; }\n  @media (prefers-reduced-motion: reduce) { .wx .wx-g.big .rays, .wx .wx-g.big .cloud, .wx .wx-g.big .drops path, .wx .wx-g.big .bolt, .wx .wx-rate i { animation: none; } }\n.dg { --serif: 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif; }\n  .ptabs .dg-nav { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; font-weight: 600; color: var(--text-2); }\n  .ptabs .dg-nav .btn { padding: 6px 12px; font-size: 12.5px; }\n  .ptabs .dg-nav .btn[disabled] { opacity: .4; cursor: default; }\n  .ptabs .dg-nav .dg-copy:first-of-type { margin-left: 8px; }\n  .ptabs .dg-nav .dg-copied { color: var(--good); border-color: color-mix(in srgb, var(--good) 45%, transparent); }\n  .dg .dg-paper { padding: 26px 30px 24px; background: linear-gradient(180deg, color-mix(in srgb, #f5e9c8 7%, var(--surface)), var(--surface) 240px); }\n  @media (max-width: 600px) { .dg .dg-paper { padding: 18px 16px; } }\n  .dg .dg-masthead { text-align: center; border-bottom: 3px double var(--border-strong); padding-bottom: 16px; margin-bottom: 20px; }\n  .dg .dg-dateline { display: flex; justify-content: space-between; gap: 10px; font: 600 11px var(--sans); text-transform: uppercase; letter-spacing: .12em; color: var(--text-3);\n    border-top: 1px solid var(--border-strong); border-bottom: 1px solid var(--border-strong); padding: 5px 0; flex-wrap: wrap; }\n  .dg .dg-masthead h1 { font: 700 clamp(30px, 5.4vw, 56px)/1.05 var(--serif); letter-spacing: -.01em; margin: 14px 0 14px; animation: rise .6s cubic-bezier(.2,.7,.2,1) both; }\n  .dg .dg-strip { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; text-align: left; }\n  @media (max-width: 600px) { .dg .dg-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); } }\n  .dg .dg-kicker { font: 700 11px var(--sans); text-transform: uppercase; letter-spacing: .14em; color: var(--accent); margin-bottom: 8px; display: flex; gap: 8px; align-items: baseline; }\n  .dg .dg-kicker span { color: var(--text-3); font-weight: 600; letter-spacing: .04em; }\n  .dg .dg-lead { border-bottom: 1px solid var(--border-strong); padding-bottom: 18px; margin-bottom: 18px; }\n  .dg .dg-lead h2 { font: 700 clamp(22px, 3.2vw, 34px)/1.15 var(--serif); letter-spacing: -.01em; margin: 2px 0 10px; text-transform: none; }\n  .dg .dg-lead h2 a { color: var(--text); text-decoration: none; background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: background-size .3s; }\n  .dg .dg-lead h2 a:hover { background-size: 100% 1px; }\n  .dg .dg-byline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: var(--text-2); }\n  .dg .dg-av { width: 28px; height: 28px; border-radius: 50%; overflow: hidden; flex: none; display: inline-grid; place-items: center; background: var(--surface-2); box-shadow: 0 0 0 2px var(--surface); }\n  .dg .dg-av.sm { width: 18px; height: 18px; }\n  .dg .dg-av img { width: 100%; height: 100%; object-fit: cover; display: block; }\n  .dg .dg-av i { font: 700 10px var(--sans); font-style: normal; color: var(--text-2); }\n  .dg a.mono { color: var(--accent); font-size: 12px; }\n  .dg .dg-tk { display: inline-block; padding: 1px 7px; border-radius: 999px; font: 600 11px var(--mono); color: var(--text-2); border: 1px solid var(--border); text-decoration: none; }\n  .dg .dg-tk:hover { border-color: var(--border-strong); color: var(--text); }\n  .dg .dg-tk small { color: var(--text-3); }\n  .dg .dg-cols { columns: 3 240px; column-gap: 30px; column-rule: 1px solid var(--border); }\n  .dg .dg-section { break-inside: avoid-column; margin-bottom: 18px; }\n  .dg .dg-item { break-inside: avoid; padding: 8px 0 10px; border-bottom: 1px dotted var(--border-strong); animation: rise .45s cubic-bezier(.2,.7,.2,1) both; }\n  .dg .dg-item:last-child { border-bottom: 0; }\n  .dg .dg-subj { font: 500 15px/1.35 var(--serif); color: var(--text); }\n  .dg .dg-scope { font: 600 10.5px var(--mono); color: var(--text-3); margin-right: 6px; text-transform: lowercase; }\n  .dg .dg-brk { font: 700 9.5px var(--sans); text-transform: uppercase; letter-spacing: .08em; color: var(--bad); border: 1px solid color-mix(in srgb, var(--bad) 45%, transparent); border-radius: 4px; padding: 0 4px; vertical-align: 2px; }\n  .dg .dg-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 5px; font-size: 11.5px; color: var(--text-3); }\n  .dg .dg-foot { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; border-top: 3px double var(--border-strong); padding-top: 16px; margin-top: 6px; }\n  .dg .dg-people { display: flex; flex-wrap: wrap; gap: 8px; }\n  .dg .dg-person { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px 3px 3px; border-radius: 999px; background: var(--surface-2); border: 1px solid var(--border); font-size: 12px; }\n  .dg .dg-person small { font: 600 11px var(--mono); color: var(--text-3); }\n  .dg .dg-tickets { display: flex; flex-wrap: wrap; gap: 6px; }\n  .dg .dg-untracked { font-size: 11.5px; margin-top: 8px; }\n  .dg .dg-perf { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; }\n  .dg .dg-quiet { text-align: center; padding: 30px 0 10px; }\n  .dg .dg-quiet-t { font: italic 700 30px var(--serif); }\n  @media (prefers-reduced-motion: reduce) { .dg .dg-masthead h1, .dg .dg-item { animation: none; } }\n.flow { display: grid; grid-template-columns: minmax(280px, 5fr) 8fr; gap: 16px; align-items: stretch; }\n  .flow .card { padding: 18px 20px 16px; }\n  .flow .card.wide { grid-column: 1 / -1; }\n  @media (max-width: 860px) { .flow { grid-template-columns: 1fr; } }\n  .flow .hero-num { margin: 4px 0 4px; animation: rise .5s cubic-bezier(.2,.7,.2,1) both; }\n  .flow .flow-wall { font-size: 12px; margin-bottom: 14px; }\n  .flow .flow-neck { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 12px; margin-bottom: 14px;\n    background: color-mix(in srgb, var(--nc) 12%, var(--surface-2)); border: 1px solid color-mix(in srgb, var(--nc) 40%, transparent); }\n  .flow .flow-neck .dot { width: 12px; height: 12px; border-radius: 50%; background: var(--nc); flex: none; box-shadow: 0 0 0 4px color-mix(in srgb, var(--nc) 22%, transparent); animation: pillpulse 2.4s ease-in-out infinite; --sc: var(--nc); }\n  .flow .flow-neck b { display: block; font-size: 14px; }\n  .flow .flow-neck small { font-size: 11.5px; color: var(--text-3); }\n  .flow .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }\n  .flow .metric .s { font-size: 11px; color: var(--text-3); margin-top: 2px; }\n  .flow .flow-sw { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 6px; vertical-align: 0; flex: none; }\n  .flow .flow-share { display: flex; gap: 2px; height: 16px; border-radius: 8px; overflow: hidden; margin: 2px 0 16px; }\n  .flow .flow-share i { min-width: 3px; transition: filter .15s; transform-origin: left; animation: growright .8s cubic-bezier(.2,.7,.2,1) both; }\n  .flow .flow-share i:hover, .flow .flow-bar i:hover { filter: brightness(1.2) saturate(1.1); }\n  .flow .flow-med { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(60px, 1fr) auto; gap: 10px; align-items: center; padding: 5px 0; font-size: 12.5px; }\n  .flow .flow-med .nm { display: flex; align-items: center; white-space: nowrap; overflow: hidden; }\n  .flow .flow-med .tr { height: 8px; border-radius: 4px; background: var(--surface-2); overflow: hidden; }\n  .flow .flow-med .tr i { display: block; height: 100%; border-radius: 4px; transform-origin: left; animation: growright .7s cubic-bezier(.2,.7,.2,1) both; }\n  .flow .flow-med .vl { font-size: 12px; color: var(--text-2); }\n  .flow .flow-note { font-size: 11px; margin-top: 8px; }\n  .flow .flow-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }\n  .flow .flow-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 11.5px; color: var(--text-2); margin-bottom: 10px; }\n  .flow .flow-legend span { display: inline-flex; align-items: center; }\n  .flow .flow-row { padding: 9px 8px; border-radius: 10px; cursor: pointer; transition: background .15s; border-bottom: 1px solid var(--border); }\n  .flow .flow-row:hover, .flow .flow-row.open { background: color-mix(in srgb, var(--text) 4%, transparent); }\n  .flow .flow-title { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 7px; min-width: 0; }\n  .flow .flow-title .t { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n  .flow .flow-title a { color: var(--accent); font-size: 12px; }\n  .flow .flow-total { font-size: 12px; color: var(--text-2); white-space: nowrap; }\n  .flow .flow-av { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex: none; display: inline-grid; place-items: center; background: var(--surface-2); }\n  .flow .flow-av img { width: 100%; height: 100%; object-fit: cover; display: block; }\n  .flow .flow-av i { font: 700 9px var(--sans); font-style: normal; color: var(--text-2); }\n  .flow .flow-bar { display: flex; gap: 2px; height: 12px; border-radius: 6px; overflow: hidden; transition: width .5s cubic-bezier(.2,.7,.2,1); min-width: 24px; }\n  .flow .flow-bar i { min-width: 2px; transform-origin: left; animation: growright .7s cubic-bezier(.2,.7,.2,1) both; }\n  .flow .flow-detail { display: grid; gap: 4px; margin-top: 10px; padding: 8px 10px; border-radius: 8px; background: var(--surface-2); font-size: 12px; }\n  .flow .flow-detail div { display: grid; grid-template-columns: auto 150px 70px 1fr; align-items: center; gap: 6px; }\n  @media (max-width: 600px) { .flow .flow-detail div { grid-template-columns: auto 1fr auto; } .flow .flow-detail .faint { grid-column: 2 / -1; } }\n  @media (prefers-reduced-motion: reduce) { .flow .hero-num, .flow .flow-share i, .flow .flow-med .tr i, .flow .flow-bar i, .flow .flow-neck .dot { animation: none; } }\n  .bw-tip { position: fixed; z-index: 9999; pointer-events: none; max-width: 280px; padding: 6px 10px; border-radius: 8px; font: 500 12px/1.4 var(--sans); color: var(--bg); background: var(--text);\n    box-shadow: var(--shadow-lg); transform: translate(-50%, calc(-100% - 8px)); opacity: 0; transition: opacity .12s; }\n  .bw-tip.on { opacity: 1; }\n  @media (prefers-reduced-motion: reduce) { .game .sring .fg, .game .lit .flame .gi, .game .flame i, .game .hero-streak.lit .glow, .game .ach:hover .medal::after { animation: none; } }\n}\n";
  const MARKUP = "<div class=\"wrap\">\n  <a class=\"bw-logo bw-side\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Birdwatcher on GitHub\"><img alt=\"Birdwatcher\"></a>\n  <header class=\"topbar\">\n    <div class=\"brand\">\n      <a class=\"bw-logo\" target=\"_blank\" rel=\"noopener noreferrer\" title=\"Birdwatcher on GitHub\"><img alt=\"Birdwatcher\"></a>\n      <h1>Birdwatcher <span>\u00b7 Woodpecker status board</span></h1>\n    </div>\n    <nav class=\"tabs repos\" id=\"ob-repos\" hidden></nav>\n    <div class=\"spacer\"></div>\n    <div class=\"refresh\" id=\"ob-refreshBox\" title=\"Auto-refresh\">\n      <svg class=\"ring\" viewBox=\"0 0 24 24\"><circle class=\"track\" cx=\"12\" cy=\"12\" r=\"9\"/><circle class=\"prog\" id=\"ob-ringProg\" cx=\"12\" cy=\"12\" r=\"9\" stroke-dasharray=\"56.5\" stroke-dashoffset=\"0\"/></svg>\n      <span id=\"ob-updatedAt\" class=\"faint\">\u2014</span>\n    </div>\n    <button class=\"iconbtn\" id=\"ob-btnRefresh\" title=\"Refresh now (r)\" aria-label=\"Refresh\">\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 12a9 9 0 1 1-2.64-6.36\"/><path d=\"M21 3v6h-6\"/></svg>\n    </button>\n    <button class=\"iconbtn\" id=\"ob-btnTheme\" title=\"Toggle theme (t)\" aria-label=\"Theme\">\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.4A5.5 5.5 0 0 1 12 3z\"/></svg>\n    </button>\n    <button class=\"iconbtn standalone-only\" id=\"ob-btnSettings\" title=\"Settings (,)\" aria-label=\"Settings\">\n      <svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z\"/></svg>\n    </button>\n  </header>\n\n  <div id=\"ob-notices\"></div>\n  <section id=\"ob-hero\"></section>\n  <nav class=\"tabs\" id=\"ob-tabs\" hidden></nav>\n  <main id=\"ob-content\"></main>\n</div>\n\n<dialog id=\"ob-settings\">\n  <div class=\"dhead\">\n    <h3>Connection</h3>\n    <p>Tokens are stored only in this browser's <span class=\"mono\">localStorage</span> and used directly from the page. Inside Woodpecker only the optional GitHub token applies: builds, PRs and reports come through your Woodpecker session.</p>\n  </div>\n  <form method=\"dialog\" id=\"ob-settingsForm\">\n    <div class=\"field standalone-only\">\n      <label for=\"ob-fServer\">Woodpecker server</label>\n      <input id=\"ob-fServer\" placeholder=\"https://woodpecker.example.com\" autocomplete=\"off\" spellcheck=\"false\">\n    </div>\n    <div class=\"field standalone-only\">\n      <label for=\"ob-fWp\">Woodpecker personal access token</label>\n      <input id=\"ob-fWp\" type=\"password\" autocomplete=\"off\" spellcheck=\"false\">\n      <div class=\"hint\">Woodpecker UI \u2192 your avatar \u2192 <b>Settings \u2192 API</b>. Needs read access to the repos.</div>\n    </div>\n    <div class=\"field standalone-only\">\n      <label for=\"ob-fGh\">GitHub token <span class=\"faint\">(optional)</span></label>\n      <input id=\"ob-fGh\" type=\"password\" autocomplete=\"off\" spellcheck=\"false\" placeholder=\"github_pat_\u2026 or ghp_\u2026\">\n      <div class=\"hint\">Fine-grained token with <b>Pull requests: read</b> on the repos, or a classic token with <span class=\"mono\">repo</span> scope. Adds head-commit freshness (Head / Outdated build) and avatars for PRs that never ran CI; the open-PR list and the CI report tables work without it.</div>\n    </div>\n    <div class=\"field standalone-only\">\n      <label for=\"ob-fViewer\">Your GitHub login <span class=\"faint\">(optional)</span></label>\n      <input id=\"ob-fViewer\" autocomplete=\"off\" spellcheck=\"false\" placeholder=\"taken from the GitHub token when empty\">\n      <div class=\"hint\">Who the <b>Actions</b> tab plans for. Inside Woodpecker this is always the logged-in user.</div>\n    </div>\n    <div class=\"field standalone-only\">\n      <label for=\"ob-fPg\">Reports base URL <span class=\"faint\">(optional)</span></label>\n      <input id=\"ob-fPg\" autocomplete=\"off\" spellcheck=\"false\" placeholder=\"leave empty \u2014 auto when the board is opened from the reports host\">\n      <div class=\"hint\" style=\"border:0;padding:0;margin-top:6px;font-size:12px;color:var(--text-3)\">Benchmarks, coverage and the nightly report are read from the reports host. When this page is served from that host itself the browser reuses its Basic-Auth session and nothing needs configuring here.</div>\n    </div>\n    <div class=\"actions\">\n      <span class=\"faint\" style=\"margin-right:auto;font-size:12px\">Shortcuts: <span class=\"kbd\">r</span> refresh \u00b7 <span class=\"kbd\">t</span> theme \u00b7 <span class=\"kbd\">,</span> settings</span>\n      <button type=\"button\" class=\"btn\" id=\"ob-btnCancel\">Cancel</button>\n      <button type=\"submit\" class=\"btn primary\">Save &amp; reload</button>\n    </div>\n  </form>\n</dialog>\n";
  const LOGO = 'data:image/webp;base64,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';
  'use strict';
  // ---------------------------------------------------------------- environment
  // Two ways to run:
  //  * embedded  — loaded by Woodpecker as WOODPECKER_CUSTOM_JS_FILE on every UI
  //                page. Renders the board only at <root><boardPath>, elsewhere
  //                just adds a nav link. API calls ride on the Woodpecker session;
  //                the reports data and GitHub (open PRs, mergeability, CI
  //                comments) come through same-origin proxies (reports.proxyPath
  //                and /github/).
  //  * standalone — index.html (served from the reports host or opened locally).
  //                Tokens live in localStorage.
  const RP = (window.WOODPECKER_ROOT_PATH || '').replace(/\/+$/, '');
  const EMBEDDED = typeof window.WOODPECKER_VERSION === 'string';
  // Site settings (config.js, see config.example.js). Every key is optional.
  const SITE = window.BIRDWATCHER_CONFIG || {};
  const NAV_LABEL = SITE.navLabel || 'Birdwatcher';
  const BOARD_ROUTE = SITE.boardPath || '/birdwatcher';
  const BOARD_PATH = RP + BOARD_ROUTE;
  const HOME = 'https://github.com/LaGrunge/birdwatcher';
  const GH_PROXY = RP + '/github';   // same-origin proxy → api.github.com (embedded only)
  const LS = 'wp-status-board';
  const DEFAULT_SERVER = (SITE.server || '').replace(/\/+$/, '');
  const PRIMARY_REPO = SITE.primaryRepo || '';    // listed first; the only repo with the Main tab
  const LOGIN_PREFIX = SITE.loginPrefix || '';    // stripped from logins for display
  const shortLogin = l => LOGIN_PREFIX && (l || '').startsWith(LOGIN_PREFIX) ? l.slice(LOGIN_PREFIX.length) : (l || '');
  const MARKERS = { bench: 'ci-report', cov: 'coverage-report', ...(SITE.reportMarkers || {}) };
  // The reports host: benchmark baseline, lcov baseline, nightly report. Off when unset.
  const REPORTS = SITE.reports || {};
  const REPORTS_NAME = REPORTS.name || 'the reports host';
  const REPORTS_HOST = REPORTS.host || '';
  const REPORTS_PUBLIC = REPORTS_HOST ? 'https://' + REPORTS_HOST : '';
  const PG = REPORTS.paths || {};
  // Ticket links: project key → browse URL prefix.
  const TRACKERS = SITE.trackers || {};
  // @matrix-begin
  const REFRESH_SEC = 60;        // polling period without a live event stream
  const REFRESH_LIVE_SEC = 300;  // safety-net poll while the SSE stream is connected
  const PR_PAGES_MAX = 16;     // 16 × 50 pipelines deep when hunting for stale PRs
  const HISTORY = 12;
  const SILENT_DAYS = 2;       // a requested review with no answer for this long = "reviewers silent"
  const DORMANT_DAYS = 14;     // no author activity for this long = "revive or close"
  const META_PARALLEL = 10;    // concurrent GitHub per-PR requests (mergeability, timeline, threads)
  const RENDER_MIN_MS = 250;   // renders are coalesced to this while data streams in
  const NIGHTS = 14;
  // @matrix-end

  if (EMBEDDED && location.pathname.replace(/\/+$/, '') !== BOARD_PATH) { injectNavLink(); return; }

  // ---------------------------------------------------------------- nav link (embedded, other pages)
  function injectNavLink() {
    const tryInject = () => {
      if (document.getElementById('birdwatcher-link')) return true;
      const repos = [...document.querySelectorAll('nav a, header a')].find(a => (a.getAttribute('href') || '').replace(/\/+$/, '') === RP + '/repos');
      if (!repos) return false;
      const a = repos.cloneNode(false);
      a.id = 'birdwatcher-link'; a.href = BOARD_PATH; a.textContent = NAV_LABEL;
      a.removeAttribute('aria-current');
      a.className = repos.className.replace(/router-link-(exact-)?active/g, '').trim();
      repos.after(a);
      return true;
    };
    tryInject();
    new MutationObserver(() => tryInject()).observe(document.documentElement, { childList: true, subtree: true });
  }

  // ---------------------------------------------------------------- mount
  const root = document.createElement('div');
  root.id = 'birdwatcher';
  root.innerHTML = MARKUP;
  root.querySelectorAll('.bw-logo').forEach(a => { a.href = HOME; a.querySelector('img').src = LOGO; });
  const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
  if (!document.querySelector(`link[href="${FONTS}"]`)) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = FONTS; document.head.appendChild(l); }
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);
  if (EMBEDDED) { root.classList.add('embedded'); document.title = 'Birdwatcher · CI status board'; }
  document.body.appendChild(root);   // applyTheme() (after loadCfg) may move it into Woodpecker's shell
  const el = name => root.querySelector('#ob-' + name);
  const $ = (sel, r = root) => r.querySelector(sel);

  const ICONS = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    spin: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.56"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
    skip: '<svg viewBox="0 0 24 24"><path d="M5 5l7 7-7 7M13 5l7 7-7 7"/></svg>',
    dash: '<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>',
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
    chev: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    ext: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    // theme button: sun (light), moon (dark), the Woodpecker bird (woodpecker theme; path from Woodpecker's favicon)
    sun: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-.5 0-1-.1-1.4A5.5 5.5 0 0 1 12 3z"/></svg>',
    bird: '<svg width="18" height="18" viewBox="0 0 22 22" fill="currentColor"><path d="M1.263 2.744C2.41 3.832 2.845 4.932 4.118 5.08l.036.007c-.588.606-1.09 1.402-1.443 2.423-.38 1.096-.488 2.285-.614 3.659-.19 2.046-.401 4.364-1.556 7.269-2.486 6.258-1.12 11.63.332 17.317.664 2.604 1.348 5.297 1.642 8.107a.857.857 0 00.633.744.86.86 0 00.922-.323c.227-.313.524-.797.86-1.424.84 3.323 1.355 6.13 1.783 8.697a.866.866 0 001.517.41c2.88-3.463 3.763-8.636 2.184-12.674.459-2.433 1.402-4.45 2.398-6.583.536-1.15 1.08-2.318 1.55-3.566.228-.084.569-.314.79-.441l1.707-.981-.256 1.052a.864.864 0 001.678.408l.68-2.858 1.285-2.95a.863.863 0 10-1.581-.687l-1.152 2.669-2.383 1.372a18.97 18.97 0 00.508-2.981c.432-4.86-.718-9.074-3.066-11.266-.163-.157-.208-.281-.247-.26.095-.12.249-.26.358-.374 2.283-1.693 6.047-.147 8.319.75.589.232.876-.337.316-.67-1.95-1.153-5.948-4.196-8.188-6.193-.313-.275-.527-.607-.89-.913C9.825.555 4.072 3.057 1.355 2.569c-.102-.018-.166.103-.092.175m10.98 5.899c-.06 1.242-.603 1.8-1 2.208-.217.224-.426.436-.524.738-.236.714.008 1.51.66 2.143 1.974 1.84 2.925 5.527 2.538 9.86-.291 3.288-1.448 5.763-2.671 8.385-1.031 2.207-2.096 4.489-2.577 7.259a.853.853 0 00.056.48c1.02 2.434 1.135 6.197-.672 9.46a96.586 96.586 0 00-1.97-8.711c1.964-4.488 4.203-11.75 2.919-17.668-.325-1.497-1.304-3.276-2.387-4.207-.208-.18-.402-.237-.495-.167-.084.06-.151.238-.062.444.55 1.266.879 2.599 1.226 4.276 1.125 5.443-.956 12.49-2.835 16.782l-.116.259-.457.982c-.356-2.014-.85-3.95-1.33-5.84-1.38-5.406-2.68-10.515-.401-16.254 1.247-3.137 1.483-5.692 1.672-7.746.116-1.263.216-2.355.526-3.252.905-2.605 3.062-3.178 4.744-2.852 1.632.316 3.24 1.593 3.156 3.42zm-2.868.62a1.177 1.177 0 10.736-2.236 1.178 1.178 0 10-.736 2.237z"/></svg>',
  };

  // One status vocabulary for the whole board. `bucket` drives filters and tiles.
  // @matrix-begin (tests/matrix_test.js evaluates the marked regions in node)
  const STATUS = {
    success:  { label: 'Passing',  color: 'var(--good)', icon: 'check', bucket: 'green' },
    failure:  { label: 'Failed',   color: 'var(--bad)',  icon: 'x',     bucket: 'red' },
    error:    { label: 'Error',    color: 'var(--bad)',  icon: 'warn',  bucket: 'red' },
    killed:   { label: 'Killed',   color: 'var(--bad)',  icon: 'x',     bucket: 'red' },
    canceled: { label: 'Canceled', color: 'var(--none)', icon: 'x',     bucket: 'other' },
    running:  { label: 'Running',  color: 'var(--run)',  icon: 'spin',  bucket: 'running' },
    started:  { label: 'Running',  color: 'var(--run)',  icon: 'spin',  bucket: 'running' },
    pending:  { label: 'Queued',   color: 'var(--warn)', icon: 'clock', bucket: 'waiting' },
    blocked:  { label: 'Approval', color: 'var(--warn)', icon: 'lock',  bucket: 'waiting' },
    skipped:  { label: 'Skipped',  color: 'var(--none)', icon: 'skip',  bucket: 'other' },
    declined: { label: 'Declined', color: 'var(--none)', icon: 'x',     bucket: 'other' },
    none:     { label: 'No build', color: 'var(--none)', icon: 'dash',  bucket: 'nobuild' },
  };
  const st = s => STATUS[s] || STATUS.none;
  const statusOf = p => p ? (STATUS[p.status] ? p.status : 'none') : 'none';
  const LIVE = ['running', 'started', 'pending', 'blocked'];
  // A cancelled pipeline that a newer one on the same branch / PR followed was
  // superseded (the repo's cancel_previous_pipeline_events): its verdict is
  // lost, so it is dropped instead of painted as a red mark. Only the newest
  // run keeps a killed / canceled status — that one really was cancelled.
  // `runs` is newest first.
  const SUPERSEDABLE = ['killed', 'canceled'];
  const dropSuperseded = runs => runs.filter((p, i) => i === 0 || !SUPERSEDABLE.includes(p.status));
  // @matrix-end

  const VIEWS = ['actions', 'prs', 'streaks', 'flow', 'digest', 'weather', 'minutes', 'main'];
  const state = {
    cfg: { server: DEFAULT_SERVER, wpToken: '', ghToken: '', reportsBase: '', viewer: '' },
    repos: [], data: {}, insights: null, insightsP: null, hist: {}, openLogs: {}, runs: {}, minsBy: 'time', minsWf: '', wxEvents: 'ci', wxStep: '', week: 0, flowScale: 'same', flowFilter: '', flowOpen: 0, tab: null, view: 'actions', filter: 'all', search: '',
    viewer: '',          // the login the Actions tab plans for (session user unless "view as" overrides it)
    heroOpen: false,     // hero cards expanded (default: the compact strip)
    viewAs: '',
    timer: null, left: REFRESH_SEC, loading: false, renderQueued: false,
    stream: null, live: false, pending: new Set(), pendingTimer: null, lastSig: '',
  };

  // ---------------------------------------------------------------- utils
  // Anything that goes into href/src: http(s) only, so a hostile field can never become javascript:/data:.
  const safeUrl = u => /^https?:\/\//i.test(String(u || '')) ? String(u) : '';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const firstLine = s => String(s || '').split('\n')[0].trim();
  const now = () => Math.floor(Date.now() / 1000); // @matrix-line
  function ago(ts) {
    if (!ts) return '';
    const d = now() - ts;
    if (d < 45) return 'just now';
    if (d < 3600) return `${Math.round(d / 60)}m ago`;
    if (d < 86400) return `${Math.round(d / 3600)}h ago`;
    if (d < 86400 * 14) return `${Math.round(d / 86400)}d ago`;
    return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
  const agoEl = (ts, prefix = '') => `<span data-ago="${ts}" data-prefix="${esc(prefix)}">${esc(prefix)}${ago(ts)}</span>`;
  function refreshAgo() { root.querySelectorAll('[data-ago]').forEach(e => { e.textContent = (e.dataset.prefix || '') + ago(+e.dataset.ago); }); }
  function until(ts) {
    const d = ts - now();
    if (d <= 0) return 'due now';
    if (d < 3600) return `in ${Math.round(d / 60)}m`;
    if (d < 86400) return `in ${Math.round(d / 3600)}h`;
    return `in ${Math.round(d / 86400)}d`;
  }
  function dur(p) {
    if (!p || !p.started) return '';
    const end = p.finished || now();
    const s = Math.max(0, end - p.started);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }
  const prNumOf = p => { const m = /refs\/pull\/(\d+)\//.exec(p.ref || ''); return m ? +m[1] : null; };
  const isDNM = title => /\b(DNM|DO NOT MERGE|WIP)\b/i.test(title || '') || /\[do not merge\]|\(do not merge\)/i.test(title || ''); // @matrix-line
  // Ticket links. A key like PROJ-107 in the title or the branch name links to
  // its tracker; the project key picks the tracker (SITE.trackers), so this
  // works for every repo the board shows. Keys of unknown projects are left
  // alone — "ALL-3 nodes" in a title is not a ticket.
  function tickets(pr) {
    const out = new Map();
    for (const text of [pr.title || '', (pr.head || '').replace(/[/_]/g, ' ')]) for (const m of text.matchAll(/\b([A-Za-z][A-Za-z0-9]{1,9})-(\d{1,7})\b/g)) {
      const key = m[1].toUpperCase(), base = TRACKERS[key];
      if (base && !out.has(`${key}-${m[2]}`)) out.set(`${key}-${m[2]}`, base + `${key}-${m[2]}`);
    }
    return [...out];
  }
  const initials = name => (shortLogin(name) || '?').replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s\-_]+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const b64utf8 = b => { try { return new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0))); } catch { return ''; } };
  const tsOf = iso => iso ? Math.floor(new Date(iso) / 1000) : 0;
  // Run fn over items with at most n in flight; results in order, rejections kept as null.
  async function pmap(items, n, fn) {
    const out = new Array(items.length); let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) { const k = i++; try { out[k] = await fn(items[k], k); } catch { out[k] = null; } }
    }));
    return out;
  }

  // ---------------------------------------------------------------- persistent cache
  // Everything expensive to refetch, keyed so that a change invalidates it:
  //   repos  — the last repo list (hero cards start before /user/repos answers)
  //   pipes  — per PR: head sha + latest CI runs (skips the deep pipeline scan)
  //   merge  — per PR: mergeability, valid for (head sha, updated_at, main commit)
  //   meta   — per PR: the folded review timeline, valid for (head sha, updated_at)
  //   hist   — per closed PR of the last GAME_DAYS: its review log (Streaks tab), valid for updated_at
  const PC_KEY = LS + ':cache';
  const pc = { repos: null, pipes: {}, merge: {}, meta: {}, hist: {} };
  try { Object.assign(pc, JSON.parse(localStorage.getItem(PC_KEY) || '{}')); } catch {}
  let pcTimer = null;
  function pcSave() {
    clearTimeout(pcTimer);
    pcTimer = setTimeout(() => {
      try { localStorage.setItem(PC_KEY, JSON.stringify(pc)); }
      catch { pc.pipes = {}; pc.meta = {}; pc.merge = {}; pc.hist = {}; try { localStorage.removeItem(PC_KEY); } catch {} }
    }, 800);
  }
  function pcPrune(repoId, liveNumbers) {
    const keep = new Set(liveNumbers.map(n => `${repoId}/${n}`));
    for (const m of [pc.pipes, pc.merge, pc.meta]) for (const k of Object.keys(m)) if (k.startsWith(`${repoId}/`) && !keep.has(k)) delete m[k];
  }
  // The fields the board reads from a Woodpecker pipeline; the rest is dropped before caching.
  const PIPE_FIELDS = ['number', 'status', 'event', 'ref', 'refspec', 'commit', 'created', 'started', 'finished', 'title', 'message', 'author', 'author_avatar', 'forge_url', 'pr_draft', 'errors', 'sender', 'branch'];
  const trimPipe = p => { if (!p) return null; const o = {}; for (const f of PIPE_FIELDS) if (p[f] !== undefined) o[f] = f === 'errors' ? (p.errors || []).map(() => 1) : p[f]; return o; };

  // ---------------------------------------------------------------- config / theme
  function loadCfg() {
    try { Object.assign(state.cfg, JSON.parse(localStorage.getItem(LS) || '{}')); } catch {}
    state.cfg.server = EMBEDDED ? location.origin + RP : (state.cfg.server || DEFAULT_SERVER).replace(/\/+$/, '');
    if (EMBEDDED) state.cfg.ghToken = ''; // inside Woodpecker everything rides on the session; no personal tokens
    try { state.tab = localStorage.getItem(LS + ':tab'); } catch {}
    try { const v = localStorage.getItem(LS + ':view'); if (VIEWS.includes(v)) state.view = v; } catch {}
    try { state.heroOpen = localStorage.getItem(LS + ':hero') === 'open'; } catch {}
    try { const t = localStorage.getItem(LS + ':theme'); if (t) root.dataset.theme = t; } catch {}
    state.viewer = EMBEDDED ? (window.WOODPECKER_USER?.login || '') : (state.cfg.viewer || '');
  }
  const RUN_VIEWS = ['flow', 'weather', 'minutes'];   // the tabs that read the Woodpecker pipeline history
  function setView(v) {
    if (!VIEWS.includes(v)) return;
    state.view = v;
    try { localStorage.setItem(LS + ':view', v); } catch {}
    if (v === 'main') ensureInsights();
    const repo = state.repos.find(r => String(r.id) === state.tab);
    if (['streaks', 'digest', 'flow'].includes(v) && repo) ensureHistory(repo);
    if (v === 'digest') ensureInsights();
    if (RUN_VIEWS.includes(v) && repo) ensureRuns(repo);
    render(true);
  }
  function saveCfg() { try { localStorage.setItem(LS, JSON.stringify(state.cfg)); } catch {} }
  // Three themes on one button: light → dark → woodpecker → light. The
  // woodpecker theme takes Woodpecker's own palette (its --wp-* variables when
  // embedded, the same values as fallbacks standalone) and, embedded, keeps the
  // real Woodpecker navbar and sits where the router view would be.
  const THEMES = ['light', 'dark', 'woodpecker'];
  const THEME_ICON = { light: 'sun', dark: 'moon', woodpecker: 'bird' };
  const THEME_LABEL = { light: 'Light', dark: 'Dark', woodpecker: 'Woodpecker' };
  const curTheme = () => root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  function toggleTheme() {
    const next = THEMES[(THEMES.indexOf(curTheme()) + 1) % THEMES.length];
    root.dataset.theme = next;
    try { localStorage.setItem(LS + ':theme', next); } catch {}
    applyTheme();
  }
  function applyTheme() {
    const t = curTheme(), btn = el('btnTheme');
    btn.innerHTML = ICONS[THEME_ICON[t]];
    btn.title = `Theme: ${THEME_LABEL[t]} · click for ${THEME_LABEL[THEMES[(THEMES.indexOf(t) + 1) % THEMES.length]]} (t)`;
    root.classList.toggle('wp', t === 'woodpecker');
    if (EMBEDDED) placeEmbedded(t === 'woodpecker');
  }
  // Embedded placement. Default: Woodpecker's app is hidden and the board is a
  // fixed full-page layer. Woodpecker theme: the app stays, its navbar stays,
  // only the router view (main) is hidden and the board takes its place.
  let placeObserver = null;
  function placeEmbedded(inShell) {
    const app = document.getElementById('app');
    if (!app) { document.body.appendChild(root); return; }
    const settle = () => {
      const nav = app.querySelector('nav, header');
      const shell = nav?.parentElement;
      if (!inShell || !nav || !shell) return false;
      shell.querySelectorAll(':scope > main').forEach(m => { m.hidden = true; m.dataset.obHidden = '1'; });
      if (root.parentElement !== shell || root.previousElementSibling !== nav) nav.after(root);
      return true;
    };
    if (inShell) {
      app.style.display = '';
      root.classList.add('inshell');
      if (!settle()) { app.style.display = 'none'; root.classList.remove('inshell'); document.body.appendChild(root); }
      if (!placeObserver) { placeObserver = new MutationObserver(() => settle()); placeObserver.observe(app, { childList: true, subtree: true }); }
    } else {
      if (placeObserver) { placeObserver.disconnect(); placeObserver = null; }
      app.querySelectorAll('[data-ob-hidden]').forEach(m => { m.hidden = false; delete m.dataset.obHidden; });
      app.style.display = 'none';
      root.classList.remove('inshell');
      if (root.parentElement !== document.body) document.body.appendChild(root);
    }
  }

  // ---------------------------------------------------------------- API
  class ApiError extends Error { constructor(msg, status, who) { super(msg); this.status = status; this.who = who; } }
  async function wp(path) {
    const init = EMBEDDED
      ? { credentials: 'same-origin', headers: { Accept: 'application/json' } }
      : { credentials: 'omit', headers: { Authorization: `Bearer ${state.cfg.wpToken}` } };
    const r = await fetch(state.cfg.server + '/api' + path, init);
    if (!r.ok) throw new ApiError(`Woodpecker ${r.status} on ${path}`, r.status, 'woodpecker');
    return r.json();
  }
  const ghEnabled = () => EMBEDDED || !!state.cfg.ghToken;
  async function gh(path) {
    const r = EMBEDDED
      ? await fetch(GH_PROXY + path, { credentials: 'same-origin', headers: { Accept: 'application/vnd.github+json' } })
      : await fetch('https://api.github.com' + path, { headers: { Authorization: `Bearer ${state.cfg.ghToken}`, Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new ApiError(`GitHub ${r.status} on ${path}`, r.status, 'github');
    return r.json();
  }
  async function ghAll(path) {
    const out = [];
    for (let page = 1; page <= 10; page++) {
      const chunk = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      out.push(...chunk);
      if (chunk.length < 100) break;
    }
    return out;
  }
  // Open PRs straight from Woodpecker (it asks the forge with its own token):
  // only number + title, the rest is joined from the PR pipelines.
  async function wpOpenPRs(repoId) {
    const out = [];
    for (let page = 1; page <= 6; page++) {
      const chunk = await wp(`/repos/${repoId}/pull_requests?per_page=50&page=${page}`);
      out.push(...(chunk || []));
      if (!chunk || chunk.length < 50) break;
    }
    return out.map(p => ({ number: +p.index, title: p.title }));
  }
  // Mergeability is only on the per-PR endpoint and GitHub computes it lazily
  // (null until done), so cache per head sha and re-ask nulls on the next pass.
  // Conflicts appear when main moves, not only when the PR does, so the main
  // commit is part of the key. Persisted across reloads.
  async function mergeInfo(repo, pr, mainCommit = '') {
    const k = `${repo.id}/${pr.number}`, c = pc.merge[k], t = now();
    const ci = statusOf(pr.pipe);
    const fresh = c && c.sha === pr.headSha && c.updated === pr.updated && c.main === mainCommit && c.ci === ci && t - c.at < 3600;
    if (fresh && (c.mergeable !== null || t - c.at < 45)) { pr.mergeable = c.mergeable; pr.mergeState = c.state; return; }
    try {
      const d = await gh(`/repos/${repo.full_name}/pulls/${pr.number}`);
      const e = { sha: pr.headSha, updated: pr.updated, main: mainCommit, ci, mergeable: d.mergeable, state: d.mergeable_state, at: t };
      pc.merge[k] = e; pcSave(); pr.mergeable = e.mergeable; pr.mergeState = e.state;
    } catch { if (c) { pr.mergeable = c.mergeable; pr.mergeState = c.state; } }
  }

  // ---------------------------------------------------------------- review state (GitHub issue timeline)
  // One request per PR gives commits, force-pushes, reviews, review requests,
  // ready-for-review flips and comments. Folded into a small `pr.rv` record that
  // classify() turns into "what blocks this PR and who has to move".
  // Noise that must not count as review activity: bot accounts (code-review
  // and gate bots), the CI account's report comments (recognised by the
  // <!-- *-report --> markers, not by login) and slash commands.
  // Automation logins: any login that ever posted a report comment (the CI
  // account also narrates pushes as plain comments; none of that is review
  // feedback). Learned across PRs, persisted with the cache — and applied to
  // plain issue comments ONLY. The CI posts its reports with a human's token,
  // so that human's reviews, review requests and inline threads are theirs:
  // a bot never submits a verdict, and nobody can request a review from one.
  // @timeline-begin
  const isReport = body => /<!-- [\w-]+-report -->/.test(body || '');
  pc.automation = Array.isArray(pc.automation) ? pc.automation : [];
  const automation = new Set(pc.automation);
  const isBot = u => !u || u.type === 'Bot' || /\[bot\]$/.test(u.login || '');
  const isNoise = u => isBot(u) || automation.has(u?.login);   // plain comments only
  const isCommand = body => /^\s*\//.test(body || '');
  function summarizeTimeline(events, pr) {
    const rv = { loaded: true, lastPush: 0, lastFeedback: 0, lastAuthorActivity: 0, readySince: 0, requestedAt: {}, reviews: {}, avatars: {}, approved: false, changesRequested: false };
    const max = (a, b) => (b > a ? b : a);
    for (const e of events) if (e.event === 'commented' && isReport(e.body) && e.actor?.login && !automation.has(e.actor.login)) { automation.add(e.actor.login); pc.automation = [...automation]; pcSave(); }
    for (const e of events) {
      const actor = e.actor || e.user || null, login = actor?.login || '';
      switch (e.event) {
        case 'committed': rv.lastPush = max(rv.lastPush, tsOf(e.committer?.date || e.author?.date)); break;
        case 'head_ref_force_pushed': rv.lastPush = max(rv.lastPush, tsOf(e.created_at)); break;
        case 'ready_for_review': rv.readySince = tsOf(e.created_at); if (login === pr.author) rv.lastAuthorActivity = max(rv.lastAuthorActivity, rv.readySince); break;
        case 'convert_to_draft': rv.readySince = 0; break;
        case 'review_requested': if (e.requested_reviewer?.login) { rv.requestedAt[e.requested_reviewer.login] = tsOf(e.created_at); if (e.requested_reviewer.avatar_url) rv.avatars[e.requested_reviewer.login] = e.requested_reviewer.avatar_url + '&s=64'; } break;
        case 'review_request_removed': if (e.requested_reviewer?.login) delete rv.requestedAt[e.requested_reviewer.login]; break;
        case 'reviewed': {
          if (isBot(e.user)) break;
          const at = tsOf(e.submitted_at), s = String(e.state || '').toLowerCase();
          if (login === pr.author) { rv.lastAuthorActivity = max(rv.lastAuthorActivity, at); break; }
          const prev = rv.reviews[login];
          if (e.user?.avatar_url) rv.avatars[login] = e.user.avatar_url + '&s=64';
          // A plain comment never downgrades an earlier approve / changes-requested.
          rv.reviews[login] = { state: (s === 'commented' && prev && prev.state !== 'commented') ? prev.state : s, at, stateAt: s === 'commented' && prev ? prev.stateAt : at };
          rv.lastFeedback = max(rv.lastFeedback, at);
          break;
        }
        case 'commented': {
          if (isNoise(actor) || isReport(e.body) || isCommand(e.body)) break;
          const at = tsOf(e.created_at);
          if (login === pr.author) rv.lastAuthorActivity = max(rv.lastAuthorActivity, at); else rv.lastFeedback = max(rv.lastFeedback, at);
          break;
        }
      }
    }
    rv.lastAuthorActivity = max(rv.lastAuthorActivity, rv.lastPush); // pushing is the author moving
    const states = Object.values(rv.reviews).map(r => r.state);
    rv.changesRequested = states.includes('changes_requested');
    // When the newest still-standing changes-requested verdict was cast. GitHub
    // keeps that verdict until the reviewer re-reviews, so it alone can't mean
    // "the author owes something": what matters is whether the author has moved since.
    rv.changesRequestedAt = Math.max(0, ...Object.values(rv.reviews).filter(r => r.state === 'changes_requested').map(r => r.stateAt || r.at));
    rv.approved = states.includes('approved') && !rv.changesRequested;
    return rv;
  }
  // Inline review threads (pulls/N/comments). Every thread has to be answered
  // by the author: a thread whose last human word is a reviewer's is open. The
  // REST API doesn't expose "resolved", so an answer is the only way to close one here.
  function summarizeThreads(comments, pr) {
    const threads = new Map();
    for (const c of comments) {
      if (isBot(c.user)) continue;
      const root = c.in_reply_to_id || c.id;
      if (!threads.has(root)) threads.set(root, []);
      threads.get(root).push(c);
    }
    const open = [];
    for (const list of threads.values()) {
      list.sort((a, b) => tsOf(a.created_at) - tsOf(b.created_at));
      const last = list[list.length - 1], root = list[0];
      if (last.user?.login !== pr.author) open.push({ url: safeUrl(last.html_url || root.html_url), path: root.path || '', line: root.line || root.original_line || null, who: last.user?.login || '', at: tsOf(last.created_at), n: list.length });
    }
    open.sort((a, b) => a.at - b.at);
    return { threads: threads.size, openThreads: open.length, openList: open.slice(0, 30) };
  }
  // @timeline-end

  // ---------------------------------------------------------------- review game (the Streaks tab)
  // Streaks and achievements for reviewers, over the last GAME_DAYS of open
  // and closed PRs. What it rewards is the board's own currency, answering a
  // review you owe before the author has waited long, not the number of
  // approvals, so it can't be farmed by rubber-stamping.
  //
  // A reviewer owes a review from a request (or a re-request, or the author's
  // push after their changes-requested verdict) until their next review of
  // that PR; converting to draft, removing the request or closing the PR
  // cancels it. It is due GAME_SLA_H working hours later (Mon–Fri, UTC, the
  // same clock for every viewer). A working day is good when it closes a debt
  // on time and bad when a debt goes overdue on it; days with neither don't
  // count, so a streak is review days in a row with nobody kept waiting.
  // @game-begin
  const GAME_DAYS = 30;   // history window of the Streaks tab
  const GAME_SLA_H = 24;  // a review is due this many working hours after it is owed
  const DAY = 86400;
  const dayOf = t => Math.floor(t / DAY);                                   // UTC day number
  const isWeekend = day => { const w = (day + 4) % 7; return w === 0 || w === 6; };   // day 0 was a Thursday
  const weekStart = day => day - (day + 3) % 7;                                       // that week's Monday
  // Weekend time counts from the next Monday 00:00 UTC.
  function workStart(t) { let d = dayOf(t); if (!isWeekend(d)) return t; while (isWeekend(d)) d++; return d * DAY; }
  const workDay = t => dayOf(workStart(t));
  function addWork(t, sec) {
    t = workStart(t);
    while (sec > 0) { const end = (dayOf(t) + 1) * DAY, step = Math.min(sec, end - t); t += step; sec -= step; if (sec > 0) t = workStart(t); }
    return t;
  }
  function workBetween(a, b) {
    let s = 0;
    for (a = workStart(a); a < b; a = workStart(a)) { const end = Math.min(b, (dayOf(a) + 1) * DAY); s += end - a; a = end; }
    return s;
  }
  // The review history of one PR as a compact, cacheable log, oldest first:
  //   ['q', at, login] requested          ['x', at, login] request removed
  //   ['r', at, login, state, inline]     a review, with its inline comment count
  //   ['p', at] push   ['d', at] to draft   ['y', at] ready   ['c', at] closed   ['o', at] reopened
  // Bots and the author never count as reviewers.
  function reviewLog(events, comments, pr) {
    const inline = {};
    for (const c of comments) if (c.pull_request_review_id && !isBot(c.user)) inline[c.pull_request_review_id] = (inline[c.pull_request_review_id] || 0) + 1;
    const reviewer = u => !!u?.login && !isBot(u) && u.login !== pr.author;
    const log = [];
    for (const e of events) {
      const at = tsOf(e.created_at);
      switch (e.event) {
        case 'review_requested': if (reviewer(e.requested_reviewer)) log.push(['q', at, e.requested_reviewer.login]); break;
        case 'review_request_removed': if (reviewer(e.requested_reviewer)) log.push(['x', at, e.requested_reviewer.login]); break;
        case 'reviewed': if (reviewer(e.user)) log.push(['r', tsOf(e.submitted_at), e.user.login, String(e.state || '').toLowerCase(), inline[e.id] || 0]); break;
        case 'committed': log.push(['p', tsOf(e.committer?.date || e.author?.date)]); break;
        case 'head_ref_force_pushed': log.push(['p', at]); break;
        case 'convert_to_draft': log.push(['d', at]); break;
        case 'ready_for_review': log.push(['y', at]); break;
        case 'closed': case 'merged': log.push(['c', at]); break;
        case 'reopened': log.push(['o', at]); break;
      }
    }
    return log.filter(e => e[1]).sort((a, b) => a[1] - b[1]);
  }
  // Every review owed on one PR: { login, at, kind: 'request' | 'rereview', done (0 = still owed), inline }.
  function obligations(log, pr) {
    const out = [], open = new Map(), requested = new Set(), verdict = {};
    const firstFlip = log.find(e => e[0] === 'd' || e[0] === 'y');
    let draft = firstFlip ? firstFlip[0] === 'y' : !!pr.draft, closed = false;
    const owe = (login, at, kind) => { if (!draft && !closed && !open.has(login)) open.set(login, { login, at, kind }); };
    for (const [k, at, login, s, n] of log) {
      switch (k) {
        case 'q': requested.add(login); owe(login, at, 'request'); break;
        case 'x': requested.delete(login); open.delete(login); break;
        case 'r': {
          const o = open.get(login);
          if (o) { out.push({ ...o, done: at, inline: n }); open.delete(login); }
          requested.delete(login);   // GitHub drops a reviewer from the request list once they review
          if (s !== 'commented' || !verdict[login]) verdict[login] = s;
          break;
        }
        case 'p': for (const [l, v] of Object.entries(verdict)) if (v === 'changes_requested') owe(l, at, 'rereview'); break;
        case 'd': draft = true; open.clear(); break;
        case 'y': draft = false; for (const l of requested) owe(l, at, 'request'); break;
        case 'c': closed = true; open.clear(); break;
        case 'o': closed = false; break;
      }
    }
    for (const o of open.values()) out.push({ ...o, done: 0, inline: 0 });
    return out;
  }
  const ACHIEVEMENTS = {
    'lightning':   { icon: 'bolt', title: 'Lightning',   desc: 'Answered a review request within 1 working hour', tiers: [1, 5, 15] },
    'second-look': { icon: 'repeat', title: 'Second look', desc: 'Re-reviewed within 4 working hours of the push that answered your changes request', tiers: [1, 3, 10] },
    'deep-dive':   { icon: 'search', title: 'Deep dive',   desc: 'A review with 5+ inline comments', tiers: [1, 3, 10] },
    'rescuer':     { icon: 'buoy', title: 'Rescuer',     desc: 'Unasked, gave the first review to a PR that had waited 2+ working days for one', tiers: [1, 3, 5] },
    'inbox-zero':  { icon: 'inbox', title: 'Inbox zero',  desc: 'Closed 3+ reviews on time in a working day and ended it owing none', tiers: [1, 3, 10] },
    'streak-5':    { icon: 'flame', title: 'On a roll',   desc: '5 review days in a row with nobody kept waiting', streak: 5 },
    'streak-10':   { icon: 'flame', title: 'On fire',     desc: '10 review days in a row with nobody kept waiting', streak: 10 },
    'streak-20':   { icon: 'star', title: 'Unstoppable', desc: '20 review days in a row with nobody kept waiting', streak: 20 },
  };
  // prs: [{ number, title, url, author, draft, log }] → per login: streak,
  // best, day marks, debts, awards; plus every award as the team feed.
  function reviewGame(prs, t) {
    const from = t - GAME_DAYS * DAY, today = workDay(t);
    const people = new Map();
    const P = l => { if (!people.has(l)) people.set(l, { login: l, days: {}, obl: [], onTime: 0, late: 0, waits: [], reviews: 0, owed: [], awards: [], streak: 0, best: 0 }); return people.get(l); };
    const award = (login, key, at, pr = null) => { if (at >= from && at <= t) P(login).awards.push({ login, key, at, pr: pr && { number: pr.number, title: pr.title, url: pr.url } }); };
    const mark = (p, day, v, at, pr) => {
      const m = p.days[day] || (p.days[day] = { v: 'good', good: 0, at: 0, prs: [], late: [] });
      if (v === 'bad') { m.v = 'bad'; m.late.push(pr.number); } else { m.good++; m.at = Math.max(m.at, at); m.prs.push(pr.number); }
    };
    for (const pr of prs) {
      const obl = obligations(pr.log, pr);
      for (const o of obl) {
        const due = addWork(o.at, GAME_SLA_H * 3600), p = P(o.login);
        const onTime = o.done && o.done <= due;
        p.obl.push(o);
        if ((onTime ? o.done : due) < from) continue;
        if (!o.done && due > t) { p.owed.push({ ...o, due, pr }); continue; }   // owed, not late yet
        if (!onTime) { p.late++; mark(p, dayOf(due - 1), 'bad', 0, pr); if (!o.done) p.owed.push({ ...o, due, pr }); continue; }
        const took = workBetween(o.at, o.done);
        p.onTime++; p.waits.push(took); mark(p, workDay(o.done), 'good', o.done, pr);
        if (o.kind === 'request' && took <= 3600) award(o.login, 'lightning', o.done, pr);
        if (o.kind === 'rereview' && took <= 4 * 3600) award(o.login, 'second-look', o.done, pr);
      }
      for (const [k, at, login, , n] of pr.log) if (k === 'r' && at >= from) { P(login).reviews++; if (n >= 5) award(login, 'deep-dive', at, pr); }
      // Rescuer: the first review of the PR, by someone who owed none on it, after a 2+ working day wait.
      const first = pr.log.find(e => e[0] === 'r');
      if (first) {
        const waitedFrom = Math.min(...obl.filter(o => o.at < first[1]).map(o => o.at));
        const asked = obl.some(o => o.login === first[2] && o.at < first[1]);
        if (isFinite(waitedFrom) && !asked && workBetween(waitedFrom, first[1]) >= 2 * DAY) award(first[2], 'rescuer', first[1], pr);
      }
    }
    const days = [];
    for (let d = workDay(from); d <= today; d++) if (!isWeekend(d)) days.push(d);
    for (const p of people.values()) {
      // Inbox zero: a finished working day with 3+ on-time reviews and no debt still open at its end.
      for (const d of days) {
        const m = p.days[d], end = (d + 1) * DAY;
        if (d >= today || !m || m.v !== 'good' || m.good < 3) continue;
        if (!p.obl.some(o => o.at < end && (!o.done || o.done > end))) award(p.login, 'inbox-zero', end - 1);
      }
      let run = 0;
      for (const d of days) {
        const m = p.days[d];
        if (!m) continue;
        if (m.v === 'bad') { run = 0; continue; }
        run++; p.best = Math.max(p.best, run);
        for (const [key, a] of Object.entries(ACHIEVEMENTS)) if (a.streak === run) award(p.login, key, m.at);
      }
      p.streak = run;
      p.awards.sort((a, b) => b.at - a.at);
      p.owed.sort((a, b) => a.due - b.due);
    }
    const feed = [...people.values()].flatMap(p => p.awards).sort((a, b) => b.at - a.at);
    return { people, feed, days, today, from };
  }
  // @game-end

  // ---------------------------------------------------------------- pipeline history (CI minutes, CI weather, Flow)
  // Every pipeline of the last RUNS_DAYS, trimmed to what the three tabs read:
  // per workflow its agent time, state and failing step, plus the steps worth
  // keeping (all of them when the workflow did not succeed, so the weather
  // knows which passed before the failure; only the long ones otherwise).
  // A step "passed" in a workflow iff the workflow succeeded or the step is kept with state 's'.
  // @runs-begin
  const RUNS_DAYS = 28;        // four whole weeks: the weather compares two, CI minutes shows a month
  const RUNS_STEP_MIN = 120;   // seconds: a successful step shorter than this is folded into "other"
  const BAD_STEP = ['failure', 'error'];            // a verdict; killed / canceled / skipped / pending are not
  const WASTED = ['killed', 'canceled'];            // agent time spent on a run nobody reads (superseded or stopped)
  const RUN_LIVE = ['running', 'started', 'pending', 'blocked'];
  const archOf = name => /-(arm64|aarch64)$/i.test(name || '') ? 'arm64' : 'amd64';
  const prOf = ref => { const m = /refs\/pull\/(\d+)\//.exec(ref || ''); return m ? +m[1] : 0; };
  function trimRun(p) {
    const rec = { n: p.number, ev: p.event, st: p.status, c: p.created || 0, s: p.started || 0, f: p.finished || 0,
      ref: p.ref || '', sha: String(p.commit || '').slice(0, 12), par: p.parent || 0, rv: p.reviewed_by ? 1 : 0, wf: null };
    if (RUN_LIVE.includes(p.status) || !Array.isArray(p.workflows)) return rec;   // a list item, or still running
    rec.wf = p.workflows.map(w => {
      const steps = (w.children || []).filter(c => c.type !== 'clone' && c.state !== 'skipped');
      const st = {};
      for (const c of steps) {
        const sec = c.started && c.finished > c.started ? c.finished - c.started : 0;
        // A failed step of a successful workflow (failure: ignore) is kept at any length, or it would read as a pass.
        if (w.state !== 'success' || sec >= RUNS_STEP_MIN || c.state !== 'success') st[c.name] = [String(c.state || '?')[0], sec];
      }
      return { n: w.name, s: w.state, a: w.started || 0, b: w.finished || 0, ag: w.agent_id || 0, fail: steps.find(c => BAD_STEP.includes(c.state))?.name || '', st };
    });
    return rec;
  }
  // Nearest-rank percentile of an unsorted list; null when empty.
  const pctile = (xs, q) => { if (!xs.length) return null; const a = xs.slice().sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.max(0, Math.ceil(q * a.length) - 1))]; };
  // Where the agent time went. Agent time of a workflow = finished − started,
  // killed ones included (the agent ran). Queue wait = workflow started −
  // pipeline created, skipping pipelines that waited for a manual approval.
  function minutes(recs, t, days = RUNS_DAYS) {
    const today = dayOf(t), first = today - days + 1, wk0 = weekStart(today);
    const byDay = new Map(), wfs = new Map(), prs = new Map(), steps = new Map(), evs = new Map();
    for (let d = first; d <= today; d++) byDay.set(d, { day: d, sec: 0, arch: { amd64: 0, arm64: 0 }, killed: 0, n: 0, waits: [] });
    const out = { total: 0, killed: 0, runs: 0, byArch: { amd64: 0, arm64: 0 }, week: { cur: { total: 0, waits: [] }, prev: { total: 0, waits: [] } } };
    const waits = [];
    const add = (m, key, init, sec, k) => { const e = m.get(key) || (m.set(key, { ...init, sec: 0, killed: 0, n: 0 }), m.get(key)); e.sec += sec; e.killed += k; e.n++; return e; };
    for (const r of recs) {
      const day = byDay.get(dayOf(r.c));
      if (!r.wf || !day) continue;
      day.n++; out.runs++;
      const wk = weekStart(dayOf(r.c)), W = wk === wk0 ? out.week.cur : wk === wk0 - 7 ? out.week.prev : null;
      const pr = r.ev === 'pull_request' ? prOf(r.ref) : 0;
      let prSec = 0, prKilled = 0;
      for (const w of r.wf) {
        if (w.a && !r.rv) { const q = Math.max(0, w.a - r.c); waits.push(q); day.waits.push(q); if (W) W.waits.push(q); }
        if (!(w.a && w.b > w.a)) continue;
        const sec = w.b - w.a, arch = archOf(w.n), k = WASTED.includes(w.s) ? sec : 0;
        out.total += sec; out.killed += k; out.byArch[arch] += sec;
        day.sec += sec; day.arch[arch] += sec; day.killed += k;
        if (W) W.total += sec;
        prSec += sec; prKilled += k;
        const wf = add(wfs, w.n, { name: w.n, arch, steps: new Map() }, sec, k);
        let kept = 0;
        for (const [name, [, ssec]] of Object.entries(w.st || {})) {
          if (!ssec) continue;
          kept += ssec;
          add(wf.steps, name, { name }, ssec, k ? ssec : 0);
          add(steps, `${w.n} › ${name}`, { key: `${w.n} › ${name}`, wf: w.n, step: name }, ssec, k ? ssec : 0);
        }
        const other = Math.max(0, sec - kept);
        if (other) add(wf.steps, '', { name: '' }, other, k ? other : 0);   // '' = the short steps and the gaps between them
      }
      if (prSec) add(evs, r.ev, { name: r.ev }, prSec, prKilled);
      if (pr && prSec) { const e = add(prs, pr, { num: pr, ref: r.ref }, prSec, prKilled); e.last = Math.max(e.last || 0, r.n); }
    }
    const desc = m => [...m.values()].sort((a, b) => b.sec - a.sec);
    out.byWorkflow = desc(wfs).map(w => ({ ...w, steps: desc(w.steps) }));
    out.byEvent = desc(evs);
    out.byPR = desc(prs);
    out.topPRs = out.byPR.slice(0, 10);
    out.topSteps = desc(steps).slice(0, 12);
    out.byDay = [...byDay.values()].map(d => ({ ...d, p50: pctile(d.waits, .5), p90: pctile(d.waits, .9), waits: undefined }));
    out.queue = { p50: pctile(waits, .5), p90: pctile(waits, .9), max: waits.length ? Math.max(...waits) : null };
    for (const w of [out.week.cur, out.week.prev]) { w.p50 = pctile(w.waits, .5); delete w.waits; }
    return out;
  }
  // Flaky steps. A step K ("workflow › step") has a verdict in a pipeline:
  // fail when it is kept with state failure/error, pass when it is kept with
  // state success or its workflow succeeded, none otherwise (killed, canceled,
  // skipped). Attempts of one change = pipelines with the same (event,
  // commit): restarts and repeated runs. A fail of K is a flake when K also
  // passed in another attempt of that change, genuine otherwise. A rerun (a
  // restart, or a repeated manual run; not the next night's cron on the same
  // commit, nobody asked for that one) is lost time when every step that
  // failed in the attempt before it (the last one with any verdict) passed
  // somewhere in the change: it chased flakes only.
  const WX_EVENTS = { ci: ['pull_request', 'push', 'cron'], all: ['pull_request', 'push', 'cron', 'manual'] };
  function verdictOf(rec, key) {
    const i = key.indexOf(' › '), wfName = key.slice(0, i), step = key.slice(i + 3);
    const w = (rec.wf || []).find(x => x.n === wfName);
    if (!w) return null;
    const k = w.st?.[step]?.[0];
    if (k === 'f' || k === 'e') return 'fail';
    if (k === 's' || (w.s === 'success' && !k)) return 'pass';
    return null;
  }
  const agentSec = rec => (rec.wf || []).reduce((s, w) => s + (w.a && w.b > w.a ? w.b - w.a : 0), 0);
  function flakes(recs, t, days = RUNS_DAYS, events = WX_EVENTS.ci) {
    const today = dayOf(t), first = today - days + 1, wk0 = weekStart(today);
    const list = recs.filter(r => r.wf && events.includes(r.ev) && dayOf(r.c) >= first && dayOf(r.c) <= today);
    const keys = new Set();
    for (const r of list) for (const w of r.wf) for (const [step, [k]] of Object.entries(w.st || {})) if (k === 'f' || k === 'e') keys.add(`${w.n} › ${step}`);
    const groups = new Map();
    for (const r of list) { const g = `${r.ev}|${r.sha}`; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r); }
    const steps = new Map(), map = {}, events_ = [];
    const S = key => steps.get(key) || (steps.set(key, { key, wf: key.split(' › ')[0], step: key.split(' › ').slice(1).join(' › '), flakes: 0, passes: 0, genuine: 0, lastAt: 0, prs: new Set(), lostSec: 0 }), steps.get(key));
    const cell = (key, day) => { const m = map[key] || (map[key] = {}); return m[day] || (m[day] = { flakes: 0, genuine: 0, runs: 0 }); };
    const week = { cur: { flakes: 0, verdicts: 0 }, prev: { flakes: 0, verdicts: 0 } };
    const wkOf = at => { const w = weekStart(dayOf(at)); return w === wk0 ? week.cur : w === wk0 - 7 ? week.prev : null; };
    let lost = 0, multi = 0, reruns = 0;
    for (const runs of groups.values()) {
      runs.sort((a, b) => a.n - b.n);
      const rerun = (r, i) => i > 0 && (r.par !== 0 || r.ev === 'manual');
      const n = runs.filter(rerun).length;
      if (n) { multi++; reruns += n; }
      const v = runs.map(r => { const m = {}; for (const k of keys) { const x = verdictOf(r, k); if (x) m[k] = x; } return m; });
      const passedSomewhere = k => v.some(m => m[k] === 'pass');
      runs.forEach((r, i) => {
        for (const [k, x] of Object.entries(v[i])) {
          const at = (r.wf.find(w => w.n === k.split(' › ')[0])?.b) || r.f || r.c, s = S(k), c = cell(k, dayOf(at)), W = wkOf(at);
          c.runs++; if (W) W.verdicts++;
          if (x === 'pass') { s.passes++; continue; }
          if (passedSomewhere(k)) {
            s.flakes++; c.flakes++; if (W) W.flakes++;
            s.lastAt = Math.max(s.lastAt, at);
            const pr = r.ev === 'pull_request' ? prOf(r.ref) : 0;
            if (pr) s.prs.add(pr);
            const passN = runs.find((q, j) => v[j][k] === 'pass').n;
            events_.push({ key: k, wf: s.wf, step: s.step, sha: r.sha, ev: r.ev, n: r.n, passN, at, pr, attempt: i + 1, attempts: runs.length });
          } else { s.genuine++; c.genuine++; }
        }
      });
      let lastFail = null;
      runs.forEach((r, i) => {
        if (rerun(r, i) && lastFail && lastFail.length && lastFail.every(passedSomewhere)) {
          const sec = agentSec(r);
          lost += sec;
          for (const k of lastFail) S(k).lostSec += sec / lastFail.length;
        }
        if (Object.keys(v[i]).length) lastFail = Object.keys(v[i]).filter(k => v[i][k] === 'fail');
      });
    }
    const all = [...steps.values()].map(s => ({ ...s, prs: [...s.prs].sort((a, b) => b - a), rate: s.flakes / Math.max(1, s.flakes + s.passes + s.genuine) }));
    const rate = w => w.verdicts ? w.flakes / w.verdicts : 0;
    return {
      steps: all.filter(s => s.flakes).sort((a, b) => b.flakes - a.flakes || b.rate - a.rate),
      failing: all.filter(s => !s.flakes && s.genuine).sort((a, b) => b.genuine - a.genuine),
      events: events_.sort((a, b) => b.at - a.at), lost, attempts: { groups: multi, reruns },
      week: { cur: { ...week.cur, rate: rate(week.cur) }, prev: { ...week.prev, rate: rate(week.prev) } },
      days: Array.from({ length: days }, (_, i) => first + i), map,
    };
  }
  const sky = c => !c || !c.runs ? 'void' : !c.flakes ? 'sun' : c.flakes === 1 ? 'cloud' : c.flakes <= 3 ? 'rain' : 'storm';
  // @runs-end

  // ---------------------------------------------------------------- weekly digest
  // What shipped in one Mon–Sun week (UTC): the PRs merged in it, grouped by
  // conventional-commit type and by tracker ticket, plus the week's nightly
  // perf when a reports host is configured. Titles may lead with ticket keys
  // or a DNM/WIP tag before the type ("ORTH-12: fix(handler): …").
  // @digest-begin
  const CC_TYPES = { feat: 'Features', fix: 'Fixes', perf: 'Performance', refactor: 'Refactoring', test: 'Tests', docs: 'Docs', ci: 'CI', build: 'Build', chore: 'Chores', style: 'Style', revert: 'Reverts' };
  function ccType(title) {
    const t = String(title || '').replace(/^\s*(?:(?:\[?[A-Za-z][A-Za-z0-9]{1,9}-\d+\]?|DNM|WIP)[:,]?\s+)+/i, '');
    const m = /^(\w+)(?:\(([^)]*)\))?(!)?:\s*(.*\S)\s*$/.exec(t);
    if (!m || !CC_TYPES[m[1].toLowerCase()]) return null;
    return { type: m[1].toLowerCase(), scope: m[2] || '', breaking: !!m[3] || /BREAKING CHANGE/.test(m[4]), subject: m[4] };
  }
  const subjectOf = pr => ccType(pr.title)?.subject || String(pr.title || '').replace(/^\s*(?:(?:\[?[A-Za-z][A-Za-z0-9]{1,9}-\d+\]?|DNM|WIP)[:,]?\s+)+/i, '');
  // prs: history records with `merged`; keysOf(pr) → [[key, url]…] (the board's tickets()).
  function digestOf(prs, weekDay, keysOf) {
    const from = weekDay * DAY, to = (weekDay + 7) * DAY;
    const merged = prs.filter(p => p.merged >= from && p.merged < to).sort((a, b) => a.merged - b.merged);
    const types = new Map(), trackers = new Map(), authors = new Map(), untracked = [];
    for (const p of merged) {
      const cc = ccType(p.title), type = cc ? cc.type : 'other', keys = keysOf(p);
      if (!types.has(type)) types.set(type, []);
      types.get(type).push({ ...p, cc, keys });
      if (!keys.length) untracked.push(p);
      for (const [key, url] of keys) { if (!trackers.has(key)) trackers.set(key, { key, url, prs: [] }); trackers.get(key).prs.push(p); }
      if (p.author) authors.set(p.author, (authors.get(p.author) || 0) + 1);
    }
    const order = [...Object.keys(CC_TYPES), 'other'];
    return {
      from, to, merged, n: merged.length,
      byType: order.filter(k => types.has(k)).map(k => ({ type: k, label: CC_TYPES[k] || 'Other changes', prs: types.get(k) })),
      byTracker: [...trackers.values()].sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true })), untracked,
      authors: [...authors].map(([login, n]) => ({ login, n })).sort((a, b) => b.n - a.n || a.login.localeCompare(b.login)),
      breaking: merged.filter(p => ccType(p.title)?.breaking),
    };
  }
  // The first and the last nightly inside [from, to); nights: [{ date: 'YYYY-MM-DD', … }], get(night) → { ratio, geo }.
  function weekPerf(nights, from, to, get) {
    const inWeek = (nights || []).filter(n => { const t = Date.parse(n.date + 'T12:00:00Z') / 1000; return t >= from && t < to; });
    if (inWeek.length < 2) return null;
    const a = get(inWeek[0]), b = get(inWeek[inWeek.length - 1]);
    return { first: inWeek[0].date, last: inWeek[inWeek.length - 1].date, nights: inWeek.length, ratio: [a.ratio, b.ratio], geo: [a.geo, b.geo], series: inWeek.map(n => get(n).ratio) };
  }
  // A paste-ready summary. fmt 'slack' (mrkdwn: *bold*, <url|text>) or 'md' (GitHub markdown).
  function digestText(dg, repoName, fmt, who = l => l, perf = null, perfLabels = null) {
    const bold = x => fmt === 'slack' ? `*${x}*` : `**${x}**`;
    const link = (url, text) => fmt === 'slack' ? `<${url}|${text}>` : `[${text}](${url})`;
    const d = t => new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const people = dg.authors.length;
    const out = [`${bold(`${repoName} — week of ${d(dg.from)}–${d(dg.to - 1)}`)}: ${dg.n} PR${dg.n === 1 ? '' : 's'} merged by ${people} ${people === 1 ? 'person' : 'people'}`];
    for (const g of dg.byType) {
      out.push('', bold(g.label));
      for (const p of g.prs) out.push(`• ${subjectOf(p)} (${[link(p.url, `#${p.number}`), ...p.keys.map(([k, u]) => link(u, k))].join(', ')}) — ${who(p.author)}`);
    }
    if (perf && perfLabels) {
      const r = perf.ratio, g = perf.geo, f = (x, dgt) => x == null ? '—' : x.toFixed(dgt);
      out.push('', `${bold('Perf')}: ${perfLabels.ratio} ${f(r[0], 1)}% → ${f(r[1], 1)}% · ${perfLabels.geo} ${f(g[0], 2)} s → ${f(g[1], 2)} s (nightlies ${perf.first} → ${perf.last})`);
    }
    return out.join('\n');
  }
  // @digest-end

  // ---------------------------------------------------------------- flow
  // Where a merged PR's time went, from opened to merged, in working time
  // (Mon–Fri UTC, the Streaks clock). At every instant the PR is in exactly
  // one stage, first match wins: draft; CI red (from a failed pipeline's end
  // to the next pipeline); CI running; then the review state from its log:
  // waiting for review, waiting for the author (a reviewer spoke: changes
  // requested or a comment), or waiting to merge (approved, nothing standing
  // against it). A push hands a changes-requested PR back to review and keeps
  // an approval. The author's comment-only answer is not in the log; their
  // push is what moves it.
  // @flow-begin
  const STAGES = {
    draft:    { label: 'Draft',              color: 'var(--none)' },
    red:      { label: 'CI red',             color: 'var(--bad)' },
    building: { label: 'CI running',         color: 'var(--run)' },
    review:   { label: 'Waiting for review', color: 'var(--warn)' },
    author:   { label: 'Waiting for author', color: '#8b5cf6' },
    merge:    { label: 'Waiting to merge',   color: 'var(--good)' },
  };
  const QUEUES = ['review', 'author', 'red', 'merge'];   // somebody's wait; draft and a running CI are nobody's queue
  // runs: [{ st, c, f }] of one PR → [{ s: 'red' | 'building', a, b }]
  function ciSpans(runs) {
    const rs = runs.filter(r => r.c).sort((a, b) => a.c - b.c), out = [];
    rs.forEach((r, i) => {
      const next = i + 1 < rs.length ? rs[i + 1].c : Infinity, end = r.f ? Math.min(r.f, next) : next;
      if (end > r.c) out.push({ s: 'building', a: r.c, b: end });
      if (r.f && BAD_STEP.includes(r.st) && next > r.f) out.push({ s: 'red', a: r.f, b: next });
    });
    return out;
  }
  function flowOf(pr, runs) {
    const start = pr.created, end = pr.merged;
    const spans = ciSpans(runs || []);
    const firstFlip = pr.log.find(e => e[0] === 'd' || e[0] === 'y');
    let draft = firstFlip ? firstFlip[0] === 'y' : false, stage = 'review';
    const approved = new Set(), changes = new Set();
    const apply = ([k, , login, st]) => {
      if (k === 'd') draft = true;
      else if (k === 'y') draft = false;
      else if (k === 'q') stage = approved.size && !changes.size ? 'merge' : 'review';   // a (re-)request: the author says it's ready
      else if (k === 'p') stage = changes.size ? 'review' : approved.size ? 'merge' : 'review';
      else if (k === 'r') {
        if (st === 'approved') { approved.add(login); changes.delete(login); stage = changes.size ? 'author' : 'merge'; }
        else if (st === 'changes_requested') { changes.add(login); approved.delete(login); stage = 'author'; }
        else if (st === 'commented') stage = 'author';
      }
    };
    const events = pr.log.filter(e => e[1] < end).sort((a, b) => a[1] - b[1]);
    const cuts = new Set([start, end]);
    for (const e of events) if (e[1] > start) cuts.add(e[1]);
    for (const sp of spans) for (const t of [sp.a, sp.b]) if (t > start && t < end) cuts.add(t);
    const ts = [...cuts].sort((a, b) => a - b), segs = [];
    let ei = 0;
    for (let i = 0; i + 1 < ts.length; i++) {
      const a = ts[i], b = ts[i + 1];
      while (ei < events.length && events[ei][1] <= a) apply(events[ei++]);
      const mid = (a + b) / 2, ci = spans.find(sp => sp.s === 'red' && sp.a <= mid && mid < sp.b) || spans.find(sp => sp.s === 'building' && sp.a <= mid && mid < sp.b);
      const s = draft ? 'draft' : ci ? ci.s : stage, last = segs[segs.length - 1];
      if (last && last.s === s) last.b = b; else segs.push({ s, a, b });
    }
    const sum = Object.fromEntries(Object.keys(STAGES).map(k => [k, 0]));
    for (const sg of segs) { sg.w = workBetween(sg.a, sg.b); sum[sg.s] += sg.w; }
    const total = segs.reduce((t, sg) => t + sg.w, 0);
    const neck = QUEUES.reduce((m, k) => sum[k] > (sum[m] || 0) ? k : m, 'review');
    return { number: pr.number, title: pr.title, url: pr.url, author: pr.author, created: start, merged: end, segs, sum, total, active: total - sum.draft, wall: end - start, neck: sum[neck] ? neck : '' };
  }
  function flowStats(flows) {
    const stages = {};
    let all = 0;
    for (const k of Object.keys(STAGES)) { const xs = flows.map(f => f.sum[k]); const tot = xs.reduce((a, b) => a + b, 0); all += tot; stages[k] = { median: pctile(xs, .5), p90: pctile(xs, .9), total: tot }; }
    for (const k of Object.keys(stages)) stages[k].share = all ? stages[k].total / all : 0;
    const queueTotal = QUEUES.reduce((t, k) => t + stages[k].total, 0);
    const bottleneck = flows.length ? QUEUES.reduce((m, k) => stages[k].total > stages[m].total ? k : m, 'review') : '';
    return { stages, bottleneck, neckShare: queueTotal ? stages[bottleneck]?.total / queueTotal : 0, n: flows.length, medianActive: pctile(flows.map(f => f.active), .5), medianWall: pctile(flows.map(f => f.wall), .5) };
  }
  // @flow-end
  async function ghPages(path, max = 3) {
    const out = [];
    for (let page = 1; page <= max; page++) {
      const chunk = await gh(`${path}${path.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      out.push(...chunk);
      if (chunk.length < 100) break;
    }
    return out;
  }
  // updated_at moves on every push, review, request and comment, so (sha, updated) is a safe key. Persisted.
  // Bump RV_FOLD whenever summarizeTimeline / summarizeThreads change what they
  // fold: a cached record from the old fold is wrong for up to 6 h otherwise.
  const RV_FOLD = 4;
  async function prTimeline(repo, pr) {
    const k = `${repo.id}/${pr.number}`, c = pc.meta[k], t = now();
    if (c && c.fold === RV_FOLD && c.sha === pr.headSha && c.updated === pr.updated && t - c.at < 6 * 3600) { pr.rv = c.rv; return; }
    try {
      const [events, comments] = await Promise.all([
        ghPages(`/repos/${repo.full_name}/issues/${pr.number}/timeline`),
        ghPages(`/repos/${repo.full_name}/pulls/${pr.number}/comments`).catch(() => []),
      ]);
      const rv = Object.assign(summarizeTimeline(events, pr), summarizeThreads(comments, pr), { log: reviewLog(events, comments, pr) });
      pc.meta[k] = { fold: RV_FOLD, sha: pr.headSha, updated: pr.updated, rv, at: t }; pcSave();
      pr.rv = rv;
    } catch { if (c) pr.rv = c.rv; }
  }

  // Closed PRs of the last GAME_DAYS, for the Streaks tab only (open PRs bring
  // their log from prTimeline, at no extra cost). A closed PR moves only when
  // reopened or commented on, so its log is fetched once and kept by
  // updated_at. GitHub requests per uncached closed PR: its timeline, nothing
  // else. The inline comments (only Deep dive needs them) come for the whole
  // window from the repo-wide list in a page or three; a proxy that doesn't
  // allow that list falls back to per-PR comments, and only for PRs a human reviewed.
  const HIST_PARALLEL = 4;     // gentle on the proxy's per-viewer budget: this is a one-off backfill
  const HIST_REFRESH_SEC = 600;  // re-list closed PRs at most this often while the tab stays open
  async function loadHistory(repo) {
    const cutoff = now() - GAME_DAYS * DAY, closed = [];
    for (let page = 1; page <= 5; page++) {
      const chunk = await gh(`/repos/${repo.full_name}/pulls?state=closed&sort=updated&direction=desc&per_page=100&page=${page}`);
      const recent = chunk.filter(p => tsOf(p.updated_at) >= cutoff);
      closed.push(...recent);
      if (chunk.length < 100 || recent.length < chunk.length) break;
    }
    const fresh = p => { const c = pc.hist[`${repo.id}/${p.number}`]; return c && c.fold === RV_FOLD && c.updated === tsOf(p.updated_at); };
    let inline = null;   // pr number → its inline review comments, from the repo-wide list
    if (closed.filter(p => !fresh(p)).length > 3) {
      try {
        inline = new Map();
        const since = new Date(cutoff * 1000).toISOString();
        for (const c of await ghPages(`/repos/${repo.full_name}/pulls/comments?sort=created&direction=desc&since=${since}`, 10)) {
          const n = +String(c.pull_request_url || '').split('/').pop();
          if (!inline.has(n)) inline.set(n, []);
          inline.get(n).push(c);
        }
      } catch { inline = null; }
    }
    const prs = await pmap(closed, HIST_PARALLEL, async p => {
      const k = `${repo.id}/${p.number}`, c = pc.hist[k], updated = tsOf(p.updated_at);
      const pr = { number: p.number, title: p.title, url: safeUrl(p.html_url), author: p.user?.login, draft: !!p.draft,
        created: tsOf(p.created_at), merged: tsOf(p.merged_at), closed: tsOf(p.closed_at), head: p.head?.ref || '', base: p.base?.ref || '' };
      if (fresh(p)) return { ...pr, log: c.log };
      const events = await ghPages(`/repos/${repo.full_name}/issues/${p.number}/timeline`);
      const reviewed = events.some(e => e.event === 'reviewed' && !isBot(e.user) && e.user?.login !== pr.author);
      const comments = !reviewed ? [] : inline ? (inline.get(p.number) || [])
        : await ghPages(`/repos/${repo.full_name}/pulls/${p.number}/comments`).catch(() => []);
      const log = reviewLog(events, comments, pr);
      pc.hist[k] = { fold: RV_FOLD, updated, log }; pcSave();
      return { ...pr, log };
    });
    const keep = new Set(closed.map(p => `${repo.id}/${p.number}`));
    for (const k of Object.keys(pc.hist)) if (k.startsWith(`${repo.id}/`) && !keep.has(k)) delete pc.hist[k];
    pcSave();
    const failed = prs.filter(p => !p).length;
    return { prs: prs.filter(Boolean), errors: failed ? [`${failed} closed PR${failed > 1 ? 's' : ''} could not be read`] : [] };
  }
  function ensureHistory(repo, force = false) {
    const h = state.hist[repo.id];
    if (h?.loading || (h && !(force && now() - (h.at || 0) >= HIST_REFRESH_SEC))) return;
    state.hist[repo.id] = { ...(h || { prs: [], errors: [] }), loading: true };
    loadHistory(repo)
      .then(r => { state.hist[repo.id] = { ...r, loading: false, at: now() }; })
      .catch(e => { state.hist[repo.id] = { prs: h?.prs || [], errors: [e.message], loading: false, at: now() }; })
      .finally(scheduleRender);
  }

  // Pipeline history for CI minutes / CI weather / Flow: Woodpecker only, same
  // origin, never GitHub. A finished pipeline never changes, so its trimmed
  // detail is kept for RUNS_DAYS under its own localStorage key (~1 KB each,
  // ~1 MB a month on a busy repo): a quota error there must never wipe the
  // main cache, and one here only thins this cache out. Cold: every
  // pipeline's detail once; warm: the list's first page and what finished since.
  const RUNS_REFRESH_SEC = 120;  // re-list at most this often while a runs tab stays open
  const RUNS_PARALLEL = 6;
  const RC_KEY = LS + ':runs';
  const rc = (() => { try { return JSON.parse(localStorage.getItem(RC_KEY) || '{}') || {}; } catch { return {}; } })();
  let rcTimer = null;
  function rcSave() {
    clearTimeout(rcTimer);
    rcTimer = setTimeout(() => {
      let data = rc;
      for (let attempt = 0; attempt < 3; attempt++) {
        try { localStorage.setItem(RC_KEY, JSON.stringify(data)); return; }
        catch {   // over quota: persist the newer 70 % (memory keeps everything)
          data = Object.fromEntries(Object.entries(data).map(([id, m]) => {
            const keep = Object.entries(m).sort((a, b) => b[1].c - a[1].c);
            return [id, Object.fromEntries(keep.slice(0, Math.floor(keep.length * .7)))];
          }));
        }
      }
      try { localStorage.removeItem(RC_KEY); } catch {}
    }, 800);
  }
  const runsOf = repoId => Object.values(rc[repoId] || {});
  async function loadRuns(repo, R) {
    const id = repo.id, cutoff = now() - RUNS_DAYS * DAY;
    const store = rc[id] || (rc[id] = {});
    for (const [k, r] of Object.entries(store)) if (r.c < cutoff - DAY) delete store[k];
    const after = encodeURIComponent(new Date(cutoff * 1000).toISOString());
    const want = [];
    for (let page = 1; page <= 60; page++) {
      const chunk = await wp(`/repos/${id}/pipelines?after=${after}&per_page=50&page=${page}`);
      let known = 0;
      for (const p of chunk || []) {
        const c = store[p.number], done = !RUN_LIVE.includes(p.status);
        if (c?.wf && done) { known++; continue; }
        if (done) want.push(p); else store[p.number] = trimRun(p);   // running: list fields now, detail once it finishes
      }
      if (!chunk || chunk.length < 50 || known === chunk.length) break;   // a page with nothing new: the rest is cached
    }
    R.total = want.length; R.pending = want.length; scheduleRender();
    let failed = 0, n = 0;
    await pmap(want, RUNS_PARALLEL, async p => {
      try { store[p.number] = trimRun(await wp(`/repos/${id}/pipelines/${p.number}`)); }
      catch { failed++; store[p.number] = trimRun(p); }
      R.pending--;
      if (++n % 25 === 0) { rcSave(); scheduleRender(); }
    });
    R.errors = failed ? [`${failed} pipeline${failed > 1 ? 's' : ''} could not be read`] : [];
  }
  function ensureRuns(repo, force = false) {
    const R = state.runs[repo.id];
    if (R?.loading || (R && !(force && now() - (R.at || 0) >= RUNS_REFRESH_SEC))) return;
    const S = state.runs[repo.id] = { errors: [], ...(R || {}), loading: true, pending: 0, total: 0 };
    loadRuns(repo, S)
      .catch(e => { S.errors = [e.message]; })
      .finally(() => { S.loading = false; S.at = now(); rcSave(); scheduleRender(); });
  }

  // The blocker matrix. First matching rule wins; `who` is the role that has to act.
  // @matrix-begin
  const BUCKETS = {
    'draft-red':         { who: 'author',   label: 'Draft · CI red',       imp: 'Fix the build or close it',                  sub: 'drafts whose latest pipeline failed', color: 'var(--bad)' },
    'ready-red':         { who: 'author',   label: 'CI red',               imp: 'Fix CI on a PR that asks for review',        sub: 'ready for review, but the build is red', color: 'var(--bad)' },
    'no-ci':             { who: 'author',   label: 'No CI on head',        imp: 'Push or rerun CI on the current head',       sub: 'no pipeline for the head commit, or a skipped / cancelled one', color: 'var(--warn)' },
    'draft-noci':        { who: 'author',   label: 'Draft · no CI',        imp: 'Run CI on the draft, or close it',           sub: 'drafts with no pipeline on the head commit', color: 'var(--none)' },
    'ci-blocked':        { who: 'admin',    label: 'Pipeline approval',    imp: 'Approve the pipeline in Woodpecker',         sub: 'CI is waiting for a manual approval', color: 'var(--warn)' },
    'dormant':           { who: 'author',   label: 'Dormant',              imp: `Revive or close: nothing from the author for ${DORMANT_DAYS}+ days`, sub: 'no push, comment or status change by the author', color: 'var(--none)' },
    'retarget':          { who: 'author',   label: 'Base gone',            imp: 'Retarget to main and rebase: the base PR is gone', sub: 'stacked on a branch that no open PR carries any more', color: 'var(--warn)' },
    'conflicts':         { who: 'author',   label: 'Conflicts',            imp: 'Rebase: conflicts with main',                sub: 'nobody reviews or merges conflicting code', color: 'var(--bad)' },
    'approved-behind':   { who: 'author',   label: 'Approved · behind',    imp: 'Rebase: approved but behind main',           sub: 'the review is done, the branch is behind its base', color: 'var(--warn)' },
    'approved-merge':    { who: 'author',   label: 'Approved',             imp: 'Merge it',                                   sub: 'approved, green and mergeable', color: 'var(--good)' },
    'approved-blocked':  { who: 'author',   label: 'Approved · blocked',   imp: 'Get the missing approval or check: GitHub still blocks the merge', sub: 'approved and green, but branch protection is not satisfied', color: 'var(--warn)' },
    'awaiting-author':   { who: 'author',   label: 'Awaiting author',      imp: 'Answer every review comment',                sub: 'open review threads, or the latest word is the reviewer’s', color: 'var(--warn)' },
    'no-reviewer':       { who: 'author',   label: 'No reviewer',          imp: 'Request a reviewer',                         sub: 'ready for review, nobody asked', color: 'var(--warn)' },
    'reviewers-silent':  { who: 'author',   label: 'Reviewers silent',     imp: `Ping the reviewers: no review for ${SILENT_DAYS}+ days`, sub: 'requested, still unanswered', color: 'var(--warn)' },
    'draft-green':       { who: 'author',   label: 'Draft · CI green',     imp: 'Mark ready for review, or close it',         sub: 'drafts whose build passes', color: 'var(--good)' },
    'awaiting-review':   { who: 'reviewer', label: 'Awaiting review',      imp: 'Waiting on reviewers',                       sub: 'the ball is with the reviewers', color: 'var(--run)' },
    'waiting':           { who: null,       label: 'Waiting',              imp: 'Waiting',                                    sub: '', color: 'var(--none)' },
    'dnm':               { who: null,       label: 'Do not merge',         imp: 'Parked',                                     sub: '', color: 'var(--none)' },
    'pending':           { who: null,       label: 'Reading reviews…', imp: 'Reading reviews…',                    sub: '', color: 'var(--none)' },
  };
  const REVIEWER_TASKS = {
    'review-me':    { imp: 'Review it: your review was requested',       sub: 'no review from you on the current head', color: 'var(--accent)' },
    're-review-me': { imp: 'Re-review: the author moved since your review', sub: 'new commits or an answer after your last review', color: 'var(--accent)' },
  };
  const ciOf = pr => st(statusOf(pr.pipe)).bucket;
  const dormant = pr => !!(pr.rv && pr.rv.lastAuthorActivity && now() - pr.rv.lastAuthorActivity > DORMANT_DAYS * 86400);
  function classify(pr) {
    const ci = ciOf(pr), dnm = isDNM(pr.title), rv = pr.rv;
    if (pr.draft) {
      if (ci === 'red') return 'draft-red';
      if (dormant(pr)) return 'dormant';
      if (ci === 'green' && !dnm) return 'draft-green';
      if (ci === 'nobuild' || ci === 'other') return 'draft-noci';
      return dnm ? 'dnm' : 'waiting';   // CI running or queued
    }
    if (ci === 'red') return 'ready-red';
    if (statusOf(pr.pipe) === 'blocked') return 'ci-blocked';
    if (pr.stale || ci === 'nobuild' || ci === 'other') return 'no-ci';   // skipped / cancelled counts as no verdict
    if (dormant(pr)) return 'dormant';   // before DNM: parked is parked for DORMANT_DAYS at most
    if (dnm) return 'dnm';
    if (!rv || pr.mergeable === undefined) return 'pending';
    if (pr.baseGone) return 'retarget';
    if (pr.mergeable === false) return 'conflicts';
    const requested = pr.requested || [];
    if (rv.approved) {
      if (pr.mergeState === 'behind') return 'approved-behind';
      if (rv.openThreads) return 'awaiting-author';   // approved, but threads still wait for an answer
      if (ci !== 'green' || pr.mergeable === null) return 'waiting';   // CI running / queued, or GitHub still computing mergeability
      // GitHub blocks the merge although everything here is green: branch
      // protection wants more (a second approval, a CODEOWNER, a check). A
      // requested reviewer who hasn't approved owes that; otherwise the author
      // has to go and get it.
      if (pr.mergeState === 'blocked') return requested.some(l => rv.reviews[l]?.state !== 'approved') ? 'awaiting-review' : 'approved-blocked';
      return 'approved-merge';
    }
    // Changes requested holds the author only until they answer it: once every
    // thread is answered and the author has pushed or replied after the verdict,
    // the move is the reviewer's re-review, not the author's.
    const unanswered = rv.changesRequested && rv.lastAuthorActivity <= (rv.changesRequestedAt || 0);
    if (unanswered || rv.openThreads || rv.lastFeedback > rv.lastAuthorActivity) return 'awaiting-author';
    const reviewed = Object.keys(rv.reviews);
    if (!requested.length && !reviewed.length) return 'no-reviewer';
    const since = Math.max(rv.lastPush, rv.lastAuthorActivity);
    if (requested.length && !reviewed.length) {
      const askedAt = Math.min(...requested.map(l => rv.requestedAt[l] || rv.readySince || since || pr.updated));
      return now() - askedAt > SILENT_DAYS * 86400 ? 'reviewers-silent' : 'awaiting-review';
    }
    return 'awaiting-review';   // someone reviewed without a verdict, or a re-request is out: the reviewers' move
  }
  // What `viewer` owes this PR as a reviewer, independent of the author-side bucket.
  function reviewerTask(pr, viewer) {
    if (!viewer || pr.draft || pr.author === viewer || !pr.rv) return null;
    // "Do not merge" parks the merge, not the review: an outstanding request is
    // still the reviewer's move. Judge such a PR by what it would be without
    // the tag, so red CI / conflicts / open threads still hand it to the author.
    let k = classify(pr);
    if (k === 'dnm') k = classify({ ...pr, title: '' });
    if (['ready-red', 'no-ci', 'ci-blocked', 'dormant', 'retarget', 'conflicts', 'approved-blocked', 'awaiting-author', 'approved-behind'].includes(k)) return null; // the author has to move first
    const requested = pr.requested || [], mine = pr.rv.reviews[viewer], since = Math.max(pr.rv.lastPush, pr.rv.lastAuthorActivity);
    if (requested.includes(viewer) && !mine) return 'review-me';
    if (mine && mine.state !== 'approved' && (mine.at < since || k === 'awaiting-review')) return 're-review-me';   // stale review, or a verdict is still owed
    if (mine && mine.state === 'approved' && pr.rv.lastPush > mine.at && requested.includes(viewer)) return 're-review-me';
    return null;
  }
  // The invariant the matrix is built to keep — the "theorem" of the board:
  // every open PR is either owned (an author-side bucket, the admin bucket,
  // or a reviewer task for at least one named reviewer), or transient (CI in
  // flight, review data loading, GitHub computing mergeability), or parked as
  // DNM for at most DORMANT_DAYS. tests/matrix_test.js proves it over the
  // whole state space; the board reports any live exception as "unowned".
  function orphan(pr) {
    const k = classify(pr), b = BUCKETS[k];
    if (b.who === 'author' || b.who === 'admin') return null;
    if (b.who === 'reviewer') {
      const people = [...new Set([...(pr.requested || []), ...Object.keys(pr.rv?.reviews || {})])];
      return people.some(l => reviewerTask(pr, l)) ? null : 'awaiting review, but no reviewer owes it';
    }
    if (k === 'pending') return null;   // review data / mergeability still loading
    if (k === 'dnm') return dormant(pr) ? `parked as "do not merge" for more than ${DORMANT_DAYS} days` : null;
    if (k === 'waiting') return (LIVE.includes(statusOf(pr.pipe)) || pr.mergeable === null) ? null : 'waiting, but nothing is in flight';
    return `unowned bucket ${k}`;
  }
  // @matrix-end
  // When did the PR enter the state it is stuck in? Drives the "waiting Nd" label and the oldest-first order.
  function stuckSince(pr, bucket, viewer = '') {
    const rv = pr.rv || {}, p = pr.pipe, fin = p ? (p.finished || p.started || p.created || 0) : 0;
    const asked = l => rv.requestedAt?.[l] || rv.readySince || rv.lastPush || 0;
    switch (bucket) {
      case 'draft-red': case 'ready-red': case 'draft-green': case 'draft-noci': case 'no-ci': case 'ci-blocked': return fin || pr.updated;
      case 'dormant': return rv.lastAuthorActivity || pr.updated;
      case 'retarget': case 'conflicts': case 'approved-behind': return Math.max(rv.lastPush || 0, pr.updated || 0) || pr.updated;
      case 'approved-merge': case 'approved-blocked': return Math.max(0, ...Object.values(rv.reviews || {}).filter(r => r.state === 'approved').map(r => r.at)) || pr.updated;
      case 'awaiting-author': return rv.openList?.[0]?.at || rv.lastFeedback || pr.updated;
      case 'no-reviewer': return rv.readySince || rv.lastPush || pr.updated;
      case 'reviewers-silent': return Math.min(...(pr.requested || []).map(asked)) || pr.updated;
      case 'awaiting-review': return Math.max(rv.lastPush || 0, rv.lastAuthorActivity || 0) || pr.updated;
      case 'review-me': return asked(viewer) || pr.updated;
      case 're-review-me': return Math.max(rv.lastPush || 0, rv.lastAuthorActivity || 0) || pr.updated;
      default: return pr.updated;
    }
  }
  const days = ts => ts ? (now() - ts) / 86400 : 0;
  function ageTag(ts) {
    const d = days(ts);
    if (d < 1) return '';
    const cls = d >= 7 ? 'hot' : d >= 3 ? 'warm' : '';
    return `<span class="age ${cls}" title="in this state since ${new Date(ts * 1000).toLocaleString()}">waiting ${Math.floor(d)}d</span>`;
  }
  // Secondary blockers the primary bucket hides: what else the author will hit right after.
  function alsoTags(pr, primary) {
    const rv = pr.rv, out = [];
    // conflicts already carry their own tag in the row
    if (rv?.openThreads && primary !== 'awaiting-author') out.push(['warn', `${rv.openThreads} open thread${rv.openThreads > 1 ? 's' : ''}`]);
    if (pr.mergeState === 'behind' && primary !== 'approved-behind') out.push(['warn', 'behind main']);
    if (pr.stale && primary !== 'no-ci') out.push(['warn', 'outdated build']);
    if (rv && !pr.draft && !(pr.requested || []).length && !Object.keys(rv.reviews).length && primary !== 'no-reviewer' && !isDNM(pr.title)) out.push(['warn', 'no reviewer']);
    if (pr.baseGone && primary !== 'retarget') out.push(['warn', 'base gone']);
    if (dormant(pr) && primary !== 'dormant') out.push(['none', 'dormant']);
    return out;
  }
  const detailCache = new Map();
  async function pipelineDetail(repoId, number) {
    const k = `${repoId}/${number}`;
    if (!detailCache.has(k)) detailCache.set(k, wp(`/repos/${repoId}/pipelines/${number}`).catch(() => null));
    const d = await detailCache.get(k);
    if (d && LIVE.includes(d.status)) detailCache.delete(k); // don't cache live ones
    return d;
  }
  async function stepLogText(repoId, number, stepId) {
    const lines = await wp(`/repos/${repoId}/logs/${number}/${stepId}`);
    return (lines || []).map(l => l.data ? b64utf8(l.data) : '').join('\n');
  }

  // ---------------------------------------------------------------- reports host
  // Embedded: a same-origin proxy at REPORTS.proxyPath forwards to the reports
  // host (credentials added there, access gated on the Woodpecker session).
  // Standalone on the reports host: same origin, the browser reuses its
  // Basic-Auth session. Anywhere else: the base URL from settings, if any — a
  // host without CORS headers can't be read cross-origin.
  function pgBase() {
    if (!REPORTS_HOST) return null;
    if (EMBEDDED) return REPORTS.proxyPath ? RP + REPORTS.proxyPath.replace(/\/+$/, '') : null;
    if (location.hostname === REPORTS_HOST) return '';
    const b = (state.cfg.reportsBase || '').trim().replace(/\/+$/, '');
    return b || null;
  }
  async function pg(path, as = 'json') {
    const r = await fetch(pgBase() + path, { credentials: 'same-origin', cache: 'no-store' });
    if (!r.ok) throw new ApiError(`${REPORTS_HOST} ${r.status} on ${path}`, r.status, 'reports');
    return as === 'json' ? r.json() : r.text();
  }
  function parseLcov(text) {
    const t = { LF: 0, LH: 0, FNF: 0, FNH: 0, BRF: 0, BRH: 0 };
    for (const m of text.matchAll(/^(LF|LH|FNF|FNH|BRF|BRH):(\d+)/gm)) t[m[1]] += +m[2];
    const pct = (h, f) => f ? (h / f * 100) : null;
    return {
      lines: { pct: pct(t.LH, t.LF), hit: t.LH, total: t.LF },
      functions: { pct: pct(t.FNH, t.FNF), hit: t.FNH, total: t.FNF },
      branches: { pct: pct(t.BRH, t.BRF), hit: t.BRH, total: t.BRF },
    };
  }
  async function loadInsights() {
    if (pgBase() === null) { state.insights = { unavailable: true }; return; }
    const out = { bench: null, cov: null, nightly: null, nights: [], errors: [] };
    const [b, c, n, dir] = await Promise.allSettled([
      pg(PG.bench), pg(PG.covInfo, 'text'), pg(PG.nightlyLatest), pg(PG.nightlyDir, 'text'),
    ]);
    if (b.status === 'fulfilled') out.bench = b.value; else out.errors.push(b.reason.message);
    if (c.status === 'fulfilled') out.cov = parseLcov(c.value); else out.errors.push(c.reason.message);
    if (n.status === 'fulfilled') out.nightly = n.value; else out.errors.push(n.reason.message);
    if (dir.status === 'fulfilled') {
      const dates = [...new Set([...dir.value.matchAll(/href="(nightly-\d{4}-\d{2}-\d{2})\.json"/g)].map(m => m[1]))].sort().slice(-NIGHTS);
      const files = await Promise.allSettled(dates.map(d => pg(`${PG.nightlyDir}${d}.json`)));
      out.nights = files.filter(f => f.status === 'fulfilled').map(f => f.value).filter(x => x && x.date).sort((a, b) => a.date.localeCompare(b.date));
    }
    state.insights = out;
  }

  // ---------------------------------------------------------------- PR CI reports
  // The tables the CI posts on every PR (recognised by MARKERS). With a GitHub token they come from
  // the PR comments; otherwise from the `publish` / `coverage` step logs of the
  // PR's latest pipeline, which print the exact same markdown before posting.
  const prReportCache = new Map();
  async function loadPrReports(repo, pr) {
    const useGh = ghEnabled();
    const key = `${repo.id}/${pr.number}/${pr.pipe?.number || 0}/${useGh ? 'gh' : 'log'}`;
    if (prReportCache.has(key)) return prReportCache.get(key);
    const p = (async () => {
      if (useGh) {
        try {
          const comments = await ghAll(`/repos/${repo.full_name}/issues/${pr.number}/comments`);
          const pick = marker => comments.filter(c => c.body && c.body.includes(`<!-- ${marker} -->`)).pop() || null;
          return { source: 'GitHub comments', bench: parseReport(pick(MARKERS.bench)), cov: parseReport(pick(MARKERS.cov)) };
        } catch (e) { if (!pr.pipe) throw e; /* fall through to the step logs */ }
      }
      if (!pr.pipe) return { source: 'step logs', bench: null, cov: null };
      const detail = await pipelineDetail(repo.id, pr.pipe.number);
      const steps = (detail?.workflows || []).flatMap(w => (w.children || []).map(c => ({ ...c, workflow: w.name })));
      const grab = async (stepName, marker) => {
        const s = steps.find(c => c.name === stepName && c.state !== 'skipped');
        if (!s) return null;
        const text = await stepLogText(repo.id, pr.pipe.number, s.id).catch(() => '');
        const i = text.indexOf(marker);
        if (i < 0) return null;
        const rep = parseReport({ body: text.slice(i + marker.length), created_at: null });
        if (rep) rep.pipeline = rep.pipeline || pr.pipe.number;
        return rep;
      };
      const [bench, cov] = await Promise.all([grab('publish', 'Comment preview:'), grab('coverage', '--- comment body ---')]);
      return { source: 'step logs', bench, cov, live: LIVE.includes(detail?.status) };
    })();
    prReportCache.set(key, p);
    p.then(r => { if (r?.live) prReportCache.delete(key); }, () => prReportCache.delete(key));
    return p;
  }
  const REPORTS_LINK = REPORTS_HOST && new RegExp(`\\[([^\\]]+)\\]\\((https://${REPORTS_HOST.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^)\\s]+)\\)`, 'g');
  // Pull `| a | b | c |` markdown tables + the pipeline link out of a report body.
  function parseReport(c) {
    if (!c) return null;
    const body = c.body;
    const pm = /Pipeline \[#(\d+)\]\((https?:[^)]+)\)/.exec(body);
    const tables = [];
    let cur = null;
    for (const raw of body.split('\n')) {
      const line = raw.trim();
      if (/^\|.*\|$/.test(line)) {
        const cells = line.slice(1, -1).split('|').map(x => x.trim());
        if (cells.every(x => /^:?-{2,}:?$/.test(x))) continue; // separator
        if (!cur) { cur = { header: cells, rows: [] }; tables.push(cur); } else cur.rows.push(cells);
      } else cur = null;
    }
    // Only links to our reports host are surfaced; anything else in a comment/log stays text.
    const links = REPORTS_LINK ? [...body.matchAll(REPORTS_LINK)].map(m => ({ text: m[1], url: m[2] })) : [];
    return { pipeline: pm ? +pm[1] : null, url: pm ? pm[2] : null, at: c.updated_at || c.created_at, tables, links };
  }
  const mdStrip = s => String(s || '').replace(/\*\*/g, '').replace(/`/g, '').replace(/_\(([^)]*)\)_/g, '($1)').replace(/_([^_]+)_/g, '$1').replace(/\\\//g, '/').trim();
  function deltaCell(txt) {
    const t = String(txt || '');
    const cls = t.includes('🟢') ? 'good' : t.includes('🔴') ? 'bad' : t.includes('⚪') ? 'flat' : 'na';
    const val = mdStrip(t.replace(/[🟢🔴⚪]/g, '')) || '—';
    return `<span class="delta ${cls}">${esc(val)}</span>`;
  }
  function reportTable(tbl) {
    if (!tbl) return '';
    const h = tbl.header.map((x, i) => `<th class="${i ? 'n' : ''}">${esc(mdStrip(x))}</th>`).join('');
    const rows = tbl.rows.map(r => `<tr>${r.map((x, i) => {
      if (i === 0) return `<td class="name">${esc(mdStrip(x))}</td>`;
      if (i === r.length - 1 && /Δ|Diff/i.test(tbl.header[i] || '')) return `<td class="n">${deltaCell(x)}</td>`;
      const v = mdStrip(x);
      return `<td class="n">${/\*\*/.test(x) ? `<b>${esc(fmtNum(v))}</b>` : esc(fmtNum(v))}</td>`;
    }).join('')}</tr>`).join('');
    return `<table class="cmp"><thead><tr>${h}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  const fmtNum = v => /^-?\d+\.\d{3,}$/.test(v) ? String(Math.round(+v * 100) / 100) : v;
  const nf = (v, d = 1) => v == null || isNaN(v) ? '—' : Number(v).toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const pctDelta = (cur, prev) => (cur == null || prev == null || !prev) ? null : (cur - prev) / prev * 100;
  function deltaBadge(d, higherIsBetter = true, unit = '%') {
    if (d == null || isNaN(d)) return `<span class="delta na">—</span>`;
    const good = higherIsBetter ? d > 0 : d < 0;
    const cls = Math.abs(d) < 0.05 ? 'flat' : good ? 'good' : 'bad';
    return `<span class="delta ${cls}">${d > 0 ? '+' : ''}${d.toFixed(unit === '%' ? 1 : 2)}${unit}</span>`;
  }

  // ---------------------------------------------------------------- loading
  // Three phases per repo, each one paints as soon as it lands:
  //   core  — default-branch + cron pipelines (the hero cards)
  //   prs   — open PRs joined with their latest CI runs
  //   meta  — per-PR GitHub mergeability + review timeline, hero workflow details
  const emptyRepoData = () => ({ main: null, mainHist: [], crons: [], prs: [], prMode: 'ci', errors: [], phase: 'none' });
  async function loadCore(repo) {
    const id = repo.id;
    const out = { main: null, mainHist: [], crons: [], errors: [] };
    const [mainRes, cronDefsRes, cronPipesRes] = await Promise.allSettled([
      wp(`/repos/${id}/pipelines?event=push&branch=${encodeURIComponent(repo.default_branch)}&per_page=${HISTORY}`),
      wp(`/repos/${id}/cron`),
      wp(`/repos/${id}/pipelines?event=cron&per_page=50`),
    ]);
    // Only pushes (merges) count as the state of main: the API is asked for
    // event=push, and the filter is repeated here so a manual run of main —
    // e.g. an upstream's validation builds, which are allowed to be red — can
    // never slip in. Woodpecker serves 50 per page regardless of per_page;
    // superseded runs go, then the strip length is applied.
    if (mainRes.status === 'fulfilled') { out.mainHist = dropSuperseded((mainRes.value || []).filter(p => p.event === 'push')).slice(0, HISTORY); out.main = out.mainHist[0] || null; }
    else out.errors.push(mainRes.reason.message);

    const cronDefs = cronDefsRes.status === 'fulfilled' ? (cronDefsRes.value || []) : [];
    const cronPipes = cronPipesRes.status === 'fulfilled' ? (cronPipesRes.value || []) : [];
    out.crons = cronDefs.map(c => {
      const runs = cronPipes.filter(p => p.sender === c.name);
      return { def: c, latest: runs[0] || null, hist: runs.slice(0, HISTORY) };
    });
    return out;
  }

  async function loadPRs(repo) {
    const id = repo.id;
    const out = { prs: [], prMode: 'ci', errors: [] };
    // Open pull requests: GitHub (rich) when a token is set, otherwise
    // Woodpecker's forge proxy (number + title), otherwise recent CI runs.
    let openPRs = null;
    // Embedded, the /github/ proxy covers every repo of the org; a repo it can't read falls back to Woodpecker's PR list.
    if (ghEnabled()) {
      try {
        openPRs = (await ghAll(`/repos/${repo.full_name}/pulls?state=open&sort=updated&direction=desc`)).map(pr => ({
          number: pr.number, title: pr.title, url: pr.html_url, draft: !!pr.draft,
          author: pr.user?.login, avatar: pr.user?.avatar_url ? pr.user.avatar_url + '&s=96' : null,
          head: pr.head?.ref, base: pr.base?.ref, headSha: pr.head?.sha, updated: Math.floor(new Date(pr.updated_at) / 1000),
          requested: (pr.requested_reviewers || []).filter(u => u.login && !isBot(u) && u.login !== pr.user?.login).map(u => u.login),   // a bot or the author can't owe a review
          avatars: Object.fromEntries((pr.requested_reviewers || []).filter(u => u.login && u.avatar_url).map(u => [u.login, u.avatar_url + '&s=64'])),
        }));
        out.prMode = 'github';
      } catch (e) { if (!EMBEDDED) out.errors.push(e.message); /* embedded: the proxy may not read this repo, fall back */ }
    }
    if (!openPRs) {
      try { openPRs = await wpOpenPRs(id); out.prMode = 'woodpecker'; }
      catch (e) { out.errors.push(e.message); }
    }

    // Latest CI runs per PR. New runs are on the first pages; a PR whose runs
    // are older comes from the cache, and only PRs with neither force the deep scan.
    const byNum = new Map();          // pr number → all pipelines (desc)
    const want = openPRs ? new Set(openPRs.map(p => p.number)) : null;
    const pagesToScan = openPRs ? PR_PAGES_MAX : 3;
    const scan = async (from, to) => {
      const chunks = await Promise.all(Array.from({ length: to - from + 1 }, (_, i) => wp(`/repos/${id}/pipelines?event=pull_request&per_page=50&page=${from + i}`).catch(() => [])));
      let empty = true;
      for (const chunk of chunks) for (const p of chunk) {
        empty = false;
        const n = prNumOf(p); if (!n) continue;
        if (!byNum.has(n)) byNum.set(n, []);
        byNum.get(n).push(trimPipe(p));
        if (want) want.delete(n);
      }
      return !empty;
    };
    let more = await scan(1, 3);
    if (want) for (const n of [...want]) { const c = pc.pipes[`${id}/${n}`]; if (c?.runs?.length) { byNum.set(n, c.runs.slice()); want.delete(n); } }
    for (let page = 4; more && want && want.size && page <= pagesToScan; page += 3) more = await scan(page, Math.min(page + 2, pagesToScan));
    for (const [n, arr] of byNum) { arr.sort((a, b) => b.number - a.number); byNum.set(n, dropSuperseded(arr)); }

    const fromPipe = (n, pipe) => {
      const [head, base] = (pipe?.refspec || '').split(':');
      return {
        number: n, title: pipe?.title || firstLine(pipe?.message), url: pipe?.forge_url || `${repo.forge_url}/pull/${n}`, draft: !!pipe?.pr_draft,
        author: pipe?.author, avatar: pipe?.author_avatar || null, head, base: base || repo.default_branch, headSha: null, updated: pipe?.created || 0,
      };
    };
    if (openPRs) {
      out.prs = openPRs.map(pr => {
        const runs = byNum.get(pr.number) || [];
        const pipe = runs[0] || null;
        const base = out.prMode === 'github' ? pr : { ...fromPipe(pr.number, pipe), title: pr.title };
        return { ...base, pipe, runs, stale: !!(pipe && base.headSha && pipe.commit !== base.headSha) };
      });
    } else {
      out.prs = [...byNum.entries()].map(([n, runs]) => ({ ...fromPipe(n, runs[0]), pipe: runs[0], runs, stale: false }))
        .sort((a, b) => b.pipe.number - a.pipe.number);
    }
    if (openPRs) { pcPrune(id, out.prs.map(p => p.number)); for (const pr of out.prs) if (pr.runs.length) pc.pipes[`${id}/${pr.number}`] = { headSha: pr.headSha, runs: pr.runs.slice(0, HISTORY) }; pcSave(); }
    // Stacked PRs: a base branch that is not the default and that no open PR carries any more.
    const heads = new Set(out.prs.map(p => p.head).filter(Boolean));
    for (const pr of out.prs) pr.baseGone = !!(pr.base && pr.base !== repo.default_branch && !heads.has(pr.base));
    // Carry the previous pass's per-PR meta over so a refresh doesn't flash
    // every PR back to "reading reviews…" while the meta phase re-runs.
    const prev = new Map((state.data[id]?.prs || []).map(p => [p.number, p]));
    for (const pr of out.prs) {
      const o = prev.get(pr.number);
      if (o && o.headSha === pr.headSha && o.updated === pr.updated) { pr.rv = o.rv; pr.mergeable = o.mergeable; pr.mergeState = o.mergeState; }
    }
    return out;
  }

  async function loadMeta(repo, d) {
    const id = repo.id;
    const heroes = [d.main, ...d.crons.map(c => c.latest)].filter(Boolean);
    const gh_ = d.prMode === 'github';
    await Promise.all([
      ...heroes.map(async p => { p._detail = await pipelineDetail(id, p.number); scheduleRender(); }),
      gh_ ? pmap(d.prs, META_PARALLEL, async pr => { await Promise.all([mergeInfo(repo, pr, d.main?.commit || ''), prTimeline(repo, pr)]); scheduleRender(); }) : null,
    ]);
  }

  const inflight = new Map();
  function loadRepo(repo) {
    if (inflight.has(repo.id)) return inflight.get(repo.id);
    const p = loadRepoNow(repo).finally(() => inflight.delete(repo.id));
    inflight.set(repo.id, p);
    return p;
  }
  // The phase only ever advances: a refresh of a repo that is already on
  // screen keeps showing the previous PR list until the new one has landed,
  // instead of dropping back to skeletons for a second.
  const PHASES = ['none', 'core', 'prs', 'meta'];
  const advance = (d, ph) => { if (PHASES.indexOf(ph) > PHASES.indexOf(d.phase)) d.phase = ph; };
  async function loadRepoNow(repo) {
    const d = state.data[repo.id] || (state.data[repo.id] = emptyRepoData());
    try {
      const core = await loadCore(repo);
      // Keep the workflow details already on screen: a pipeline whose status
      // hasn't moved has the same steps, and without this the expanded hero
      // cards lose their step row until loadMeta has re-fetched it.
      const prevDetail = new Map([...d.mainHist, ...d.crons.flatMap(c => c.hist)].filter(p => p._detail).map(p => [p.number, p]));
      for (const p of [...core.mainHist, ...core.crons.flatMap(c => c.hist)]) { const o = prevDetail.get(p.number); if (o && o.status === p.status && o.finished === p.finished) p._detail = o._detail; }
      Object.assign(d, core); advance(d, 'core'); scheduleRender();
      const prs = await loadPRs(repo);
      Object.assign(d, prs, { errors: [...d.errors, ...prs.errors] }); advance(d, 'prs'); scheduleRender();
      await loadMeta(repo, d);
      advance(d, 'meta'); scheduleRender();
    } catch (e) { d.errors.push(e.message); advance(d, 'core'); scheduleRender(); }
  }

  // The reports host is only needed by the Main tab: fetched when that tab is open,
  // otherwise in idle time after the PR queue is on screen.
  function ensureInsights(force = false) {
    if (state.insightsP && !force) return state.insightsP;
    if (state.insights && !force) return Promise.resolve();
    state.insightsP = loadInsights().catch(e => { state.insights = { errors: [e.message], nights: [] }; })
      .finally(() => { state.insightsP = null; scheduleRender(); });
    return state.insightsP;
  }

  async function loadAll() {
    if (state.loading) return;
    if (EMBEDDED && !window.WOODPECKER_USER) { renderNeedsLogin(); return; }
    if (!EMBEDDED && !state.cfg.wpToken) { renderNeedsConfig(); return; }
    state.loading = true;
    el('btnRefresh').classList.add('spin');
    if (!state.repos.length) renderSkeleton();
    try {
      // /user/repos: the caller's active repos. (/repos?all=true is admin-only in
      // Woodpecker — everyone else got a 403 and a bogus "session expired".)
      const sortRepos = list => list.sort((a, b) => (a.full_name === PRIMARY_REPO ? -1 : b.full_name === PRIMARY_REPO ? 1 : a.full_name.localeCompare(b.full_name)));
      const pickTab = () => { if (!state.tab || !state.repos.some(r => String(r.id) === state.tab)) state.tab = String(state.repos[0]?.id || ''); };
      const reposP = wp('/user/repos').then(list => sortRepos(list.filter(r => r.active)));
      // Known repos from the last visit start loading before /user/repos answers.
      let early = null;
      if (!state.repos.length && pc.repos?.length) {
        state.repos = pc.repos; pickTab();
        const cur = state.repos.find(r => String(r.id) === state.tab);
        if (cur) early = loadRepo(cur);
      }
      const repos = await reposP;
      const known = new Set(state.repos.map(r => r.id));
      state.repos = repos; pickTab();
      pc.repos = repos.map(r => ({ id: r.id, full_name: r.full_name, default_branch: r.default_branch, forge_url: r.forge_url, active: true })); pcSave();
      for (const id of Object.keys(state.data)) if (!repos.some(r => String(r.id) === id)) delete state.data[id];
      if (!EMBEDDED && !state.viewer && state.cfg.ghToken) gh('/user').then(u => { state.viewer = u.login || ''; scheduleRender(); }).catch(() => {});
      const insightsP = state.view === 'main' ? ensureInsights(true) : null;
      const current = repos.find(r => String(r.id) === state.tab);
      if (['streaks', 'digest', 'flow'].includes(state.view) && current) ensureHistory(current, true);
      if (RUN_VIEWS.includes(state.view) && current) ensureRuns(current, true);
      // The visible repo first; the others follow without holding up the paint.
      await Promise.all([early, ...repos.map(r => (early && known.has(r.id) && r === current) ? null : r === current ? loadRepo(r) : new Promise(res => setTimeout(res, 0)).then(() => loadRepo(r)))]);
      await insightsP;
      if (!state.insights) (window.requestIdleCallback || (f => setTimeout(f, 800)))(() => ensureInsights(true));
      stampUpdated();
      render();
      connectStream();
    } catch (e) {
      renderError(e);
    } finally {
      state.loading = false;
      el('btnRefresh').classList.remove('spin');
      state.left = period();
    }
  }
  let lastRenderAt = 0;
  function scheduleRender() {
    if (state.renderQueued) return;
    state.renderQueued = true;
    const wait = Math.max(0, RENDER_MIN_MS - (Date.now() - lastRenderAt));
    setTimeout(() => requestAnimationFrame(() => { state.renderQueued = false; lastRenderAt = Date.now(); if (state.repos.length) render(); }), wait);
  }

  // ---------------------------------------------------------------- DOM patching
  // Every render still builds the markup as a string, but the live DOM is
  // patched to match it instead of being replaced: nodes that didn't change
  // are left alone, so a refresh reloads no avatars, restarts no animations,
  // moves no scroll position and steals no focus. Children are matched by key
  // (data-key / id / data-num / …) and otherwise by position and tag, so a
  // reordered PR list moves rows instead of rebuilding them. Two bits of UI
  // state live only in the DOM and survive a patch: an expanded PR row
  // (`.pr.open`) and the detail fillDetail() loaded into it.
  const nodeKey = n => n.nodeType === 1 ? (n.getAttribute('data-key') || n.id || n.getAttribute('data-num') || n.getAttribute('data-tab') || n.getAttribute('data-view') || n.getAttribute('data-filter') || '') : '';
  function morph(from, to) {
    if (from.nodeType !== to.nodeType || from.nodeName !== to.nodeName) { from.replaceWith(to); return; }
    if (from.nodeType === 3) { if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue; return; }
    if (from.nodeType !== 1) return;
    const open = from.classList.contains('pr') && from.classList.contains('open');
    for (const a of [...from.attributes]) if (!to.hasAttribute(a.name)) from.removeAttribute(a.name);
    for (const a of to.attributes) if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
    if (open) from.classList.add('open');
    const focused = from === document.activeElement;   // never yank what the user is typing into
    if (from.nodeName === 'INPUT' && !focused && from.value !== to.value) from.value = to.value;
    if (from.classList.contains('pr-detail') && from.parentElement?.classList.contains('open')) return; // owned by fillDetail
    if (from.hasAttribute('data-owned')) return;   // children drawn by script (mountOwned), e.g. the animated treemap
    morphChildren(from, to);
    if (from.nodeName === 'SELECT' && !focused && from.value !== to.value) from.value = to.value;
  }
  function morphChildren(from, to) {
    const keyed = new Map();
    for (const c of from.childNodes) { const k = nodeKey(c); if (k) keyed.set(c.nodeName + '|' + k, c); }
    let i = 0;
    for (const t of [...to.childNodes]) {
      const cur = from.childNodes[i] || null, k = nodeKey(t);
      let match = null;
      if (k) match = keyed.get(t.nodeName + '|' + k) || null;
      else for (let j = i; j < from.childNodes.length; j++) { const c = from.childNodes[j]; if (c.nodeType === t.nodeType && c.nodeName === t.nodeName && !nodeKey(c)) { match = c; break; } }
      if (!match) { from.insertBefore(t, cur); i++; continue; }
      if (match !== cur) from.insertBefore(match, cur);
      morph(match, t); i++;
    }
    while (from.childNodes.length > i) from.removeChild(from.lastChild);
  }
  const setHtml = (host, html) => { const t = document.createElement(host.tagName); t.innerHTML = html; morphChildren(host, t); };
  // Avatar URLs that failed to load: rendered as initials from then on, so a
  // patch never puts the broken <img> back.
  const brokenImg = new Set();

  // ---------------------------------------------------------------- rendering: pieces
  const sc = s => `--sc:${st(s).color}`;
  function pill(s, extra = '') {
    const d = st(s);
    return `<span class="pill ${s}" style="${sc(s)}">${ICONS[d.icon]}${esc(extra || d.label)}</span>`;
  }
  function glyph(s) {
    const d = st(s);
    return `<div class="glyph ${s}" style="${sc(s)}" role="img" aria-label="${d.label}"><div class="ring"></div><div class="disc"><svg class="icon" viewBox="0 0 24 24">${ICONS[d.icon].replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg></div></div>`;
  }
  function avatar(url, name, s) {
    const d = st(s);
    url = safeUrl(url);
    if (brokenImg.has(url)) url = '';
    const inner = url ? `<img src="${esc(url)}" alt="" data-initials="${esc(initials(name))}">` : `<div class="initials">${esc(initials(name))}</div>`;
    return `<div class="avatar ${s}" style="${sc(s)}" title="${esc(name || '')}">${inner}<span class="badge">${ICONS[d.icon]}</span></div>`;
  }
  function hist(runs, cur, repoId, small = false) {
    if (!runs.length) return '';
    const items = runs.slice().reverse().map(p => {
      const s = statusOf(p);
      return `<a href="${pipeUrl(repoId, p)}" target="_blank" rel="noopener" class="${p.number === cur ? 'cur' : ''}" style="--c:${st(s).color}" title="#${p.number} · ${st(s).label} · ${ago(p.created)}"></a>`;
    }).join('');
    return `<div class="hist">${items}${small ? `<span class="lbl">last ${runs.length}</span>` : ''}</div>`;
  }
  function steps(detail) {
    if (!detail || !detail.workflows?.length) return '';
    return `<div class="steps">${detail.workflows.map(w => {
      const s = STATUS[w.state] ? w.state : 'none';
      const failed = (w.children || []).find(c => ['failure', 'error', 'killed'].includes(c.state));
      const tip = failed ? `${w.name}: step "${failed.name}" ${failed.state}` : `${w.name}: ${w.state}`;
      return `<span class="step ${s}" style="${sc(s)}" title="${esc(tip)}"><i></i>${esc(w.name)}${failed ? ` <span class="faint">› ${esc(failed.name)}</span>` : ''}</span>`;
    }).join('')}</div>`;
  }
  const pipeUrl = (repoId, p) => `${state.cfg.server}/repos/${repoId}/pipeline/${p.number}`;
  function who(p) {
    if (!p) return '';
    const name = p.author || p.sender || '';
    return `<span class="who">${safeUrl(p.author_avatar) ? `<img src="${esc(safeUrl(p.author_avatar))}" alt="">` : ''}${esc(name)}</span>`;
  }

  function heroCard(kicker, branch, p, hist_, repoId, extraMeta = '') {
    const s = statusOf(p);
    const d = st(s);
    const errs = (p?.errors || []).length;
    return `<article class="card ${s}" style="${sc(s)}">
      <div class="hero">
        ${glyph(s)}
        <div style="min-width:0">
          <div class="kicker">${esc(kicker)} <span class="branch">${esc(branch)}</span></div>
          <div class="headline">${p ? `<a href="${pipeUrl(repoId, p)}" target="_blank" rel="noopener">${esc(d.label)} <span class="faint mono" style="font-weight:500">#${p.number}</span></a>` : 'No pipelines yet'} ${errs ? `<span class="tag err">${errs} config error${errs > 1 ? 's' : ''}</span>` : ''}</div>
          ${p ? `<div class="msg" title="${esc(firstLine(p.message))}">${esc(firstLine(p.message) || p.title || '—')}</div>` : `<div class="msg">Nothing has run for this yet.</div>`}
          <div class="meta">
            ${who(p)}
            ${p ? `<span title="${new Date(p.created * 1000).toLocaleString()}">${agoEl(p.finished || p.started || p.created, p.finished ? 'finished ' : 'started ')}</span>` : ''}
            ${p && p.started ? `<span class="mono">${dur(p)}</span>` : ''}
            ${p ? `<a class="mono" href="${esc(safeUrl(p.forge_url))}" target="_blank" rel="noopener noreferrer" title="Open on GitHub">${esc((p.commit || '').slice(0, 8))} ${ICONS.ext}</a>` : ''}
            ${extraMeta}
          </div>
        </div>
      </div>
      <div class="hero-foot">
        ${hist(hist_, p?.number, repoId)}
        ${steps(p?._detail)}
      </div>
    </article>`;
  }

  // ---------------------------------------------------------------- rendering: insights
  // A sparkline is autoscaled to its own min..max, so without an ordinate
  // legend a 1% wiggle and a 40% collapse draw the same picture. The axis
  // column repeats the two numbers the curve is stretched between (top = max
  // at y=6, bottom = min at y=h-6); `fmt`/`unit` say how to read them.
  function sparkline(values, { w = 300, h = 56, fmt = v => nf(v, 1), unit = '' } = {}) {
    const v = values.filter(x => x != null && !isNaN(x));
    if (v.length < 2) return '';
    const min = Math.min(...v), max = Math.max(...v), flat = max === min, span = (max - min) || 1;
    const px = i => 4 + i * (w - 8) / (values.length - 1);
    const py = x => flat ? h / 2 : 6 + (h - 12) * (1 - (x - min) / span);
    let d = '', first = true;
    values.forEach((x, i) => { if (x == null) return; d += `${first ? 'M' : 'L'}${px(i).toFixed(1)},${py(x).toFixed(1)} `; first = false; });
    const last = values.length - 1;
    const area = d + `L${px(last).toFixed(1)},${h} L${px(values.findIndex(x => x != null)).toFixed(1)},${h} Z`;
    const svg = `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line class="g" x1="0" x2="${w}" y1="${py(v[v.length - 1]).toFixed(1)}" y2="${py(v[v.length - 1]).toFixed(1)}"/><path class="area" d="${area}"/><path d="${d}"/><circle cx="${px(last).toFixed(1)}" cy="${py(values[last]).toFixed(1)}" r="3.5"/></svg>`;
    const tick = x => `<span>${esc(fmt(x))}${unit ? `<i>${esc(unit)}</i>` : ''}</span>`;
    const axis = flat ? tick(max) : tick(max) + tick(min);
    const tip = flat ? `flat at ${fmt(max)}${unit}` : `axis ${fmt(min)}${unit} … ${fmt(max)}${unit} · span ${fmt(max - min)}${unit}`;
    return `<div class="sparkbox" style="--sh:${h}px" title="${esc(tip)}"><div class="sy mono${flat ? ' one' : ''}" aria-hidden="true">${axis}</div>${svg}</div>`;
  }
  // `sub` is trusted HTML built by the callers from numbers / deltaBadge(); any upstream text in it must be esc()'d by the caller.
  function metric(label, value, unit = '', sub = '') {
    return `<div class="metric"><div class="l">${esc(label)}</div><div class="v">${value == null ? '—' : esc(String(value))}${unit ? `<small>${esc(unit)}</small>` : ''}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
  }
  // The nightly report compares the subject (this repo's product) with a
  // baseline system; their names and JSON field prefixes come from
  // SITE.reports.nightly: `<key>_tpmc`, per_txn[i][key], per_query[i]['<key>_s'].
  const NB = { subject: { key: 'subject', label: 'Subject' }, baseline: { key: 'baseline', label: 'Baseline' }, ...(REPORTS.nightly || {}) };
  const S = NB.subject, B = NB.baseline;
  const sv = (o, f) => o?.[`${S.key}_${f}`], bv = (o, f) => o?.[`${B.key}_${f}`];
  function barRows(rows, fmt = v => nf(v, 1), lowerIsBetter = false) {
    const max = Math.max(...rows.flatMap(r => [r.a || 0, r.b || 0])) || 1;
    return `<div class="bars">${rows.map(r => {
      const ratio = (r.a && r.b) ? (lowerIsBetter ? r.a / r.b : r.b / r.a) : null;
      return `<div class="bar-row" title="${esc(r.label)}: ${esc(B.label)} ${fmt(r.a)} · ${esc(S.label)} ${fmt(r.b)}">
        <span class="lbl truncate">${esc(r.label)}</span>
        <span class="track"><i class="a" style="width:${(100 * (r.a || 0) / max).toFixed(1)}%"></i><i class="b" style="width:${(100 * (r.b || 0) / max).toFixed(1)}%"></i></span>
        <span class="val">${ratio ? `${ratio.toFixed(2)}×` : '—'}</span></div>`;
    }).join('')}</div>`;
  }
  const legend = () => `<div class="legend"><span><i style="background:var(--s-a)"></i>${esc(B.legend || B.label)}</span><span><i style="background:var(--s-b)"></i>${esc(S.label)}</span><span class="faint" style="margin-left:auto">× = ${esc(S.label)} vs ${esc(B.label)}</span></div>`;

  function renderInsights(repo, d) {
    const I = state.insights;
    const links = { nightlyHtml: `${REPORTS_PUBLIC}${PG.nightlyDir}latest.html`, covFull: n => `${REPORTS_PUBLIC}${PG.covPipelines}${n}/full/index.html` };
    let html = `<div class="section-title"><h2>Main · performance & coverage</h2><span class="sub">what CI compares every PR against</span></div>`;
    if (!I || I.unavailable) {
      html += `<div class="hint"><b>Benchmarks, coverage and the nightly report are only readable from ${esc(REPORTS_NAME)}.</b> Open this board inside Woodpecker (<code>${esc(DEFAULT_SERVER + BOARD_ROUTE)}</code>)${REPORTS.standaloneUrl ? ` or from <code>${esc(REPORTS.standaloneUrl)}</code>` : ''}, or set a reports base URL in settings if you proxy it locally.</div>`;
      return html;
    }
    html += `<div class="insights">`;

    // --- benchmarks baseline (main) ---
    const b = I.bench;
    html += `<article class="card" style="--sc:var(--accent)"><div class="ihead"><h3>Benchmark baseline</h3><span class="sub">${b ? `main <span class="mono">${esc((b.commit || '').slice(0, 8))}</span> · pipeline <a class="mono" href="${state.cfg.server}/repos/${repo.id}/pipeline/${esc(b.pipeline)}" target="_blank" rel="noopener">#${esc(b.pipeline)}</a> · ${ago(Math.floor(new Date(b.timestamp) / 1000))}` : 'unavailable'}</span></div>`;
    if (b) {
      const tv = b.benchbase_tpch?.validation;
      html += `<div class="metrics">
        ${metric('go-tpc tpmC', nf(b.go_tpcc?.tpmc, 1), '', `1 wh · tpmTotal ${nf(b.go_tpcc?.tpm, 0)}`)}
        ${metric('BenchBase', nf(b.benchbase?.throughput, 1), 'req/s', `goodput ${nf(b.benchbase?.goodput, 1)}`)}
        ${metric('BenchBase p99', nf(b.benchbase?.p99_latency_us, 0), 'µs', `p50 ${nf(b.benchbase?.p50_latency_us, 0)} · p95 ${nf(b.benchbase?.p95_latency_us, 0)}`)}
        ${metric('TPC-H geomean', nf(b.benchbase_tpch?.geomean_s, 3), 's', `${esc(b.benchbase_tpch?.queries ?? '—')} queries · total ${nf(b.benchbase_tpch?.total_s, 1)} s`)}
        ${metric('TPC-H results', tv === 'pass' ? '✓ identical' : tv === 'fail' ? '✗ diverge' : '—', '', `vs ${B.label}, same dataset`)}
      </div>`;
      if (d?.main && b.commit && d.main.commit !== b.commit) html += `<div class="hint" style="margin-top:12px">Baseline is from an older main commit than the latest push (<span class="mono">${esc(d.main.commit.slice(0, 8))}</span>). It refreshes when that pipeline's <em>publish</em> step finishes.</div>`;
    } else html += `<div class="hint">${esc(I.errors.find(e => e.includes('benchmarks')) || 'No baseline.json yet.')}</div>`;
    html += `</article>`;

    // --- coverage baseline (main) ---
    const c = I.cov;
    html += `<article class="card" style="--sc:var(--good)"><div class="ihead"><h3>Coverage baseline</h3><span class="sub">lcov from the Debug pipeline on main</span><span class="links">${d?.main ? `<a href="${links.covFull(d.main.number)}" target="_blank" rel="noopener">full report #${d.main.number} ${ICONS.ext}</a>` : ''}</span></div>`;
    if (c) {
      html += `<div class="metrics">${[['Lines', c.lines], ['Functions', c.functions], ['Branches', c.branches]].map(([l, x]) =>
        `<div class="metric"><div class="l">${l}</div><div class="v">${x.pct == null ? '—' : x.pct.toFixed(2)}<small>%</small></div><div class="s mono">${nf(x.hit, 0)} / ${nf(x.total, 0)}</div><div class="meter"><i style="width:${(x.pct || 0).toFixed(1)}%"></i></div></div>`).join('')}</div>`;
    } else html += `<div class="hint">${esc(I.errors.find(e => e.includes('coverage')) || 'No baseline.info yet.')}</div>`;
    html += `</article>`;

    // --- nightly subject vs baseline ---
    const n = I.nightly;
    const nights = I.nights || [];
    const prev = nights.length > 1 ? nights[nights.length - 2] : null;
    html += `<article class="card wide" style="--sc:var(--s-b)"><div class="ihead"><h3>Nightly · ${esc(S.label)} vs ${esc(B.label)}</h3><span class="sub">${n ? `${esc(n.date)} · ${esc(S.key)} <span class="mono">${esc((n.commit || '').slice(0, 8))}</span>${B.versionKey ? ` · ${esc(B.versionKey)} <span class="mono">${esc(n.versions?.[B.versionKey] || '?')}</span>` : ''} · pipeline <a class="mono" href="${state.cfg.server}/repos/${repo.id}/pipeline/${esc(n.pipeline)}" target="_blank" rel="noopener">#${esc(n.pipeline)}</a>` : 'unavailable'}</span><span class="links"><a href="${links.nightlyHtml}" target="_blank" rel="noopener">full report ${ICONS.ext}</a></span></div>`;
    if (n) {
      const t = n.tpcc || {}, q = n.tpch || {};
      const cfg = t.config ? `${t.config.warehouses} wh / ${t.config.threads} thr / ${t.config.duration_s} s` : '';
      const ratioSeries = nights.map(x => x.tpcc?.ratio_pct ?? null);
      const tpmcSeries = nights.map(x => sv(x.tpcc, 'tpmc') ?? null);
      const geoSeries = nights.map(x => sv(x.tpch, 'geomean_s') ?? null);
      html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;align-items:start">
        <div>
          <div class="l faint" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">TPC-C throughput, ${esc(S.label)} as % of ${esc(B.label)}</div>
          <div class="hero-num" style="margin-top:6px">${t.ratio_pct != null ? t.ratio_pct.toFixed(1) : '—'}<small>%</small> ${prev ? deltaBadge(pctDelta(t.ratio_pct, prev.tpcc?.ratio_pct)) : ''}</div>
          <div class="faint" style="font-size:12px;margin-top:4px">${esc(cfg)}${prev ? ` · vs ${esc(prev.date)}` : ''}</div>
          ${sparkline(ratioSeries, { fmt: v => v.toFixed(1), unit: '%' })}
          <div class="metrics" style="margin-top:10px">
            ${metric(`${S.label} tpmC`, nf(sv(t, 'tpmc'), 0), '', prev ? deltaBadge(pctDelta(sv(t, 'tpmc'), sv(prev.tpcc, 'tpmc'))) : '')}
            ${metric(`${B.label} tpmC`, nf(bv(t, 'tpmc'), 0), '', prev ? deltaBadge(pctDelta(bv(t, 'tpmc'), bv(prev.tpcc, 'tpmc'))) : '')}
            ${metric(`${S.label} p99`, nf(sv(t, 'p99_ms'), 1), 'ms', `${esc(B.label)} ${nf(bv(t, 'p99_ms'), 1)} ms`)}
            ${metric(`${S.label} p50`, nf(sv(t, 'p50_ms'), 1), 'ms', `${esc(B.label)} ${nf(bv(t, 'p50_ms'), 1)} ms`)}
          </div>
          ${tpmcSeries.filter(Boolean).length > 1 ? `<div class="faint" style="font-size:11px;margin-top:10px">${esc(S.label)} tpmC, last ${nights.length} nights</div>${sparkline(tpmcSeries, { fmt: v => nf(v, 0) })}` : ''}
        </div>
        <div>
          <div class="l faint" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">TPC-C per transaction · tpm</div>
          ${legend()}
          ${barRows((t.per_txn || []).map(r => ({ label: r.txn, a: r[B.key]?.tpm, b: r[S.key]?.tpm })), v => nf(v, 0))}
          <div class="l faint" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin:14px 0 6px">TPC-C per transaction · p99 ms (lower is better)</div>
          ${barRows((t.per_txn || []).map(r => ({ label: r.txn, a: r[B.key]?.p99_ms, b: r[S.key]?.p99_ms })), v => nf(v, 1), true)}
        </div>
        <div>
          <div class="l faint" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em">TPC-H power run${q.scalefactor ? ` · SF ${esc(q.scalefactor)}` : ''}</div>
          <div class="hero-num" style="margin-top:6px">${q.ratio != null ? q.ratio.toFixed(2) : '—'}<small>× geomean speed vs ${esc(B.label)}</small></div>
          <div class="metrics" style="margin-top:10px">
            ${metric(`${S.label} geomean`, nf(sv(q, 'geomean_s'), 3), 's', prev ? deltaBadge(pctDelta(sv(q, 'geomean_s'), sv(prev.tpch, 'geomean_s')), false) : '')}
            ${metric(`${B.label} geomean`, nf(bv(q, 'geomean_s'), 3), 's', `${esc(q.queries ?? '—')} common queries`)}
            ${metric('Total', `${nf(sv(q, 'total_s'), 1)}`, 's', `${esc(B.label)} ${nf(bv(q, 'total_s'), 1)} s`)}
            ${metric('Results', q.validation === 'pass' ? '✓ identical' : q.validation === 'fail' ? '✗ diverge' : '—', '', `${S.label} vs ${B.label}`)}
          </div>
          ${geoSeries.filter(Boolean).length > 1 ? `<div class="faint" style="font-size:11px;margin-top:10px">${esc(S.label)} geomean s, last ${nights.length} nights</div>${sparkline(geoSeries, { fmt: v => nf(v, 3), unit: 's' })}` : ''}
          <div class="l faint" style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin:14px 0 6px">Per query · seconds (lower is better)</div>
          ${barRows((q.per_query || []).map(r => ({ label: r.q, a: bv(r, 's'), b: sv(r, 's') })), v => nf(v, 3), true)}
        </div>
      </div>`;
    } else html += `<div class="hint">${esc(I.errors.find(e => e.includes('nightly')) || 'No nightly report yet.')}</div>`;
    html += `</article></div>`;
    if (I.errors?.length && (b || c || n)) html += `<div class="faint" style="font-size:12px;margin-top:8px">${esc(I.errors.join(' · '))}</div>`;
    return html;
  }

  // ---------------------------------------------------------------- rendering: page
  const PR_MODE_LABEL = { github: 'open on GitHub, latest CI run per PR', woodpecker: 'open PRs via Woodpecker, latest CI run per PR', ci: 'recently built, state unknown' };
  // What the DOM depends on. Re-rendering only when this changes is what keeps
  // the page still between refreshes (no replayed animations, no lost state).
  function signature() {
    const pipeSig = p => p && [p.number, p.status, p.finished, p.started, (p._detail?.workflows || []).map(w => w.state).join('')].join(':');
    const viewer = state.viewAs || state.viewer;
    const I = state.insights;
    const H = state.hist[state.tab], R = state.runs[state.tab];
    return JSON.stringify([state.tab, state.view, viewer, state.filter, state.search, !!state.insightsP, state.heroOpen, H ? [H.loading, H.at, H.prs.length, H.errors] : null,
      state.week, (state.insights?.nights || []).length, state.flowScale, state.flowFilter, state.flowOpen,
      R ? [R.loading, R.at, R.pending, runsOf(state.tab).length, R.errors, state.minsBy, state.minsWf, state.wxEvents, state.wxStep] : null, I && !I.unavailable ? [I.bench?.pipeline, I.cov?.lines?.hit, I.nightly?.date, (I.nights || []).length, I.errors] : I ? 'unavailable' : 'none',
      state.repos.map(r => { const d = state.data[r.id]; return d && [r.id, d.phase, pipeSig(d.main), d.mainHist.map(pipeSig), d.crons.map(c => [c.def.next_exec, pipeSig(c.latest), c.hist.length]), d.prMode, d.errors,
        d.prs.map(pr => [pr.number, pr.title, pr.draft, pr.mergeable, pr.mergeState, pr.stale, pr.avatar, pr.head, pr.updated, pipeSig(pr.pipe), pr.runs.length, classify(pr), reviewerTask(pr, viewer), (pr.requested || []).join(), pr.rv ? Object.keys(pr.rv.reviews).join() + '/' + pr.rv.openThreads : '', pr.baseGone])]; })]);
  }
  function render(force = false) {
    const sig = signature();
    if (!force && sig === state.lastSig) { refreshAgo(); return; }
    state.lastSig = sig;
    renderRepoTabs();
    const repo = state.repos.find(r => String(r.id) === state.tab);
    const d = state.data[repo?.id];
    const notices = [];
    if (d && d.errors.length) notices.push(notice(`<b>Some requests failed.</b> ${esc(d.errors.join(' · '))}`, true));
    if (d && d.phase !== 'none' && d.phase !== 'core' && d.prMode === 'ci') notices.push(notice(`<b>Showing PRs that recently ran in CI</b> — the open-PR list could not be fetched from Woodpecker${EMBEDDED ? '.' : '. Add a GitHub token in <button class="link" data-open-settings>settings</button> to list exactly the open PRs.'}`));
    setHtml(el('notices'), notices.join(''));

    if (!repo || !d) { el('hero').innerHTML = ''; el('tabs').hidden = true; el('content').innerHTML = `<div class="empty">No active repositories visible.</div>`; return; }

    // Always on top: the default branch and the scheduled runs.
    setHtml(el('hero'), renderHero(repo, d));

    // View tabs. Actions needs GitHub review data (any repo the proxy can
    // read); Main is the primary repo's report set from the reports host.
    const isPrimary = !!REPORTS_HOST && repo.full_name === PRIMARY_REPO;
    const viewer = state.viewAs || state.viewer;
    const hasGh = d.prMode === 'github' || d.phase === 'none' || d.phase === 'core';
    const todo = hasGh ? actionSections(d, viewer).reduce((n, s) => n + s.list.length, 0) : 0;
    const views = [
      ...(hasGh ? [['actions', 'Actions', todo || null, 'var(--accent)']] : []),
      ['prs', 'Pull requests', d.prs.length, null],
      ...(d.prMode === 'github' ? [['streaks', 'Streaks', streakOf(repo, d, viewer), 'var(--warn)'], ['flow', 'Flow', null, null], ['digest', 'Weekly digest', digestCount(repo, d), 'var(--good)']] : []),
      ['weather', 'CI weather', weatherCount(repo), 'var(--warn)'],
      ['minutes', 'CI minutes', null, null],
      ...(isPrimary ? [['main', 'Main · perf & coverage', null, null]] : []),
    ];
    const view = views.some(v => v[0] === state.view) ? state.view : 'prs';
    const tabs = el('tabs');
    tabs.hidden = false; tabs.className = 'tabs views';
    setHtml(tabs, views.map(([k, l, n, c]) => `<button class="tab ${k === view ? 'active' : ''}" data-view="${k}">${l}${n != null ? `<span class="cnt" ${c ? `style="color:${c};border-color:color-mix(in srgb, ${c} 40%, transparent)"` : ''}>${n}</span>` : ''}</button>`).join(''));

    let html = '';
    if (view === 'actions') html = renderActions(repo, d, viewer);
    else if (view === 'prs') html = renderPRs(repo, d, viewer);
    else if (view === 'streaks') { ensureHistory(repo); html = renderStreaks(repo, d, viewer); }
    else if (view === 'minutes') { ensureRuns(repo); html = renderMinutes(repo, d); }
    else if (view === 'digest') { ensureHistory(repo); html = renderDigest(repo, d); }
    else if (view === 'flow') { ensureHistory(repo); ensureRuns(repo); html = renderFlow(repo, d); }
    else if (view === 'weather') { ensureRuns(repo); html = renderWeather(repo, d); }
    else html = (!state.insights && state.insightsP ? `<div class="section-title"><h2>Main · performance & coverage</h2><span class="sub">loading from ${esc(REPORTS_NAME)}…</span></div><div class="insights"><div class="sk sk-card"></div><div class="sk sk-card"></div></div>` : renderInsights(repo, d));
    setHtml(el('content'), html);
    mountOwned();
    for (const m of el('content').querySelectorAll('.wx-map')) if (!m._seen) { m._seen = true; m.scrollLeft = m.scrollWidth; }   // open on the latest days
    // Rows that stayed expanded keep their detail; only a changed pipeline / thread count reloads it.
    el('content').querySelectorAll('.pr.open').forEach(row => { if (row._loadedSig !== row.dataset.sig) fillDetail(row, repo.id); });
    root.classList.add('settled'); // entry animations only on the first paint
  }

  function heroStrip(kicker, branch, p, hist_, repoId, extraMeta = '') {
    const s = statusOf(p), dd = st(s);
    const failed = (p?._detail?.workflows || []).flatMap(w => (w.children || []).filter(c => ['failure', 'error', 'killed'].includes(c.state)).map(c => `${w.name} › ${c.name}`));
    return `<div class="strip ${s}" style="${sc(s)}">
      ${pill(s)}
      <span class="kicker">${esc(kicker)} <span class="branch">${esc(branch)}</span></span>
      ${p ? `<a class="mono num" href="${pipeUrl(repoId, p)}" target="_blank" rel="noopener">#${p.number}</a>` : ''}
      <span class="msg truncate" title="${esc(firstLine(p?.message) || '')}">${p ? esc(firstLine(p.message) || p.title || '—') : 'Nothing has run yet'}</span>
      ${failed.length ? `<span class="fail truncate" title="${esc(failed.join(', '))}">✗ ${esc(failed.slice(0, 2).join(', '))}${failed.length > 2 ? ` +${failed.length - 2}` : ''}</span>` : ''}
      <span class="meta">${p ? agoEl(p.finished || p.started || p.created, p.finished ? 'finished ' : 'started ') : ''}${p && p.started ? ` · ${dur(p)}` : ''}${extraMeta ? ` · ${extraMeta}` : ''}</span>
      ${hist(hist_, p?.number, repoId)}
    </div>`;
  }
  function renderHero(repo, d) {
    const toggle = `<button class="herotoggle" data-hero-toggle title="${state.heroOpen ? 'Collapse to the status strip' : 'Expand the cards'}">${state.heroOpen ? 'Collapse' : 'Details'} <span class="chev ${state.heroOpen ? 'up' : ''}">${ICONS.chev}</span></button>`;
    let html = `<div class="section-title" style="margin-top:0"><h2>Latest</h2><span class="sub">merges to the default branch (manual runs don't count) and scheduled runs</span>${toggle}</div>`;
    if (d.phase === 'none') return html + (state.heroOpen ? `<div class="hero-grid"><div class="sk sk-card"></div><div class="sk sk-card"></div></div>` : `<div class="strips"><div class="sk" style="height:44px"></div><div class="sk" style="height:44px"></div></div>`);
    if (!state.heroOpen) {
      html += `<div class="strips">`;
      html += heroStrip('Merges', repo.default_branch, d.main, d.mainHist, repo.id);
      for (const c of d.crons) html += heroStrip(`Cron · ${c.def.name}`, c.def.branch, c.latest, c.hist, repo.id, `next ${until(c.def.next_exec)}`);
      return html + `</div>`;
    }
    html += `<div class="hero-grid">`;
    html += heroCard('Merges', repo.default_branch, d.main, d.mainHist, repo.id);
    for (const c of d.crons) {
      const extra = `<span title="${new Date(c.def.next_exec * 1000).toLocaleString()}">${esc(c.def.schedule)} · next ${until(c.def.next_exec)}</span>`;
      html += heroCard(`Cron · ${c.def.name}`, c.def.branch, c.latest, c.hist, repo.id, extra);
    }
    if (!d.crons.length) html += `<article class="card none" style="${sc('none')}"><div class="hero">${glyph('none')}<div><div class="kicker">Cron</div><div class="headline">No cron jobs</div><div class="msg">This repository has no scheduled pipelines configured in Woodpecker.</div></div></div></article>`;
    return html + `</div>`;
  }

  // ---------------------------------------------------------------- rendering: Actions
  // The plan for one login: every author-side bucket of the matrix that holds
  // one of their PRs, then what they owe others as a reviewer.
  const byRecent = (a, b) => b.updated - a.updated;
  function actionSections(d, viewer) {
    if (!viewer || d.prMode !== 'github') return [];
    const out = [];
    const admin = viewer === state.viewer && (!EMBEDDED || !!window.WOODPECKER_USER?.admin);
    for (const [k, b] of Object.entries(BUCKETS)) {
      if (b.who !== 'author' && !(b.who === 'admin' && admin)) continue;
      const list = d.prs.filter(pr => (b.who === 'admin' || pr.author === viewer) && classify(pr) === k).sort((a, b2) => stuckSince(a, k) - stuckSince(b2, k));
      if (list.length) out.push({ key: k, title: b.imp, sub: b.sub, color: b.color, list });
    }
    for (const [k, t] of Object.entries(REVIEWER_TASKS)) {
      const list = d.prs.filter(pr => reviewerTask(pr, viewer) === k).sort((a, b2) => stuckSince(a, k, viewer) - stuckSince(b2, k, viewer));
      if (list.length) out.push({ key: k, title: t.imp, sub: t.sub, color: t.color, list });
    }
    return out;
  }
  function renderActions(repo, d, viewer) {
    if (d.phase === 'none' || d.phase === 'core') return `<div class="section-title"><h2>What to do</h2><span class="sub">loading the PR queue…</span></div><div class="prlist">${'<div class="sk sk-row"></div>'.repeat(4)}</div>`;
    if (d.prMode !== 'github') return `<div class="hint" style="margin-top:8px"><b>The action list needs GitHub review data.</b> ${EMBEDDED ? 'The board proxy could not read this repository from GitHub; the open-PR list comes from Woodpecker instead.' : 'Add a GitHub token in <button class="link" data-open-settings>settings</button>.'}</div>`;
    const people = [...new Set(d.prs.flatMap(pr => [pr.author, ...(pr.requested || []), ...Object.keys(pr.rv?.reviews || {})]))].filter(Boolean).sort((a, b) => a.localeCompare(b));
    const pendingN = d.prs.filter(pr => classify(pr) === 'pending').length;
    let html = `<div class="ptabs">
      <div class="section-title" style="margin:0"><h2>What to do</h2><span class="sub">${viewer ? `plan for <b>${esc(viewer)}</b>` : 'no login known'}${pendingN ? ` · reading reviews for ${pendingN} PR${pendingN > 1 ? 's' : ''}…` : ''}</span></div>
      <label class="viewas">View as <select id="ob-viewas"><option value="">${esc(state.viewer || '— pick a login —')}</option>${people.filter(p => p !== state.viewer).map(p => `<option value="${esc(p)}" ${p === state.viewAs ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    </div>`;
    if (!viewer) return html + `<div class="hint"><b>Whose plan?</b> ${EMBEDDED ? 'Your Woodpecker login is not known; pick a login above.' : 'Set your GitHub login in <button class="link" data-open-settings>settings</button> or pick one above.'}</div>`;
    const sections = actionSections(d, viewer);
    if (!sections.length) {
      return html + (pendingN
        ? `<div class="prlist"><div class="empty">Reading reviews…</div></div>`
        : `<div class="card allclear" style="--sc:var(--good)"><div class="big">Nothing blocks on ${esc(viewer === state.viewer ? 'you' : viewer)}.</div><p class="muted">No PR of theirs needs a move, no review is owed. See the <button class="link" data-view-link="prs">whole queue</button> for what blocks others.</p></div>`);
    }
    for (const s of sections) {
      html += `<section class="action" style="--sc:${s.color}">
        <div class="ahead"><span class="bar"></span><h3>${esc(s.title)}</h3><span class="cnt">${s.list.length}</span><span class="sub">${esc(s.sub)}</span></div>
        <div class="prlist">${s.list.map(pr => prRow(pr, repo, viewer, s.key)).join('')}</div>
      </section>`;
    }
    return html;
  }

  // ---------------------------------------------------------------- rendering: who owes what (lead view)
  // One row per person: what the queue waits on from them. Clicking a row opens their plan.
  function renderOwes(d) {
    const people = new Map();
    const row = l => { if (!people.has(l)) people.set(l, { login: l, reviews: 0, answer: 0, fix: 0, rebase: 0, ask: 0, merge: 0, dormant: 0, oldest: 0 }); return people.get(l); };
    const bump = (l, k, ts) => { const r = row(l); r[k]++; if (ts && (!r.oldest || ts < r.oldest)) r.oldest = ts; };
    for (const pr of d.prs) {
      const k = classify(pr);
      if (BUCKETS[k]?.who === 'author' && pr.author) {
        const col = { 'draft-red': 'fix', 'ready-red': 'fix', 'no-ci': 'fix', conflicts: 'rebase', 'approved-behind': 'rebase', retarget: 'rebase', 'approved-merge': 'merge', 'awaiting-author': 'answer', 'no-reviewer': 'ask', 'reviewers-silent': 'ask', 'draft-green': 'ask', 'draft-noci': 'fix', 'approved-blocked': 'ask', dormant: 'dormant' }[k];
        if (col) bump(pr.author, col, stuckSince(pr, k));
      }
      if (!pr.draft && pr.rv) for (const l of new Set([...(pr.requested || []), ...Object.keys(pr.rv.reviews)])) {
        const t = reviewerTask(pr, l); if (t) bump(l, 'reviews', stuckSince(pr, t, l));
      }
    }
    const rows = [...people.values()].filter(r => r.reviews + r.answer + r.fix + r.rebase + r.ask + r.merge + r.dormant).sort((a, b) => (a.oldest || 1e12) - (b.oldest || 1e12));
    const admin = d.prs.filter(pr => classify(pr) === 'ci-blocked').length;
    const orphans = d.prs.filter(pr => pr.rv && pr.mergeable !== undefined && orphan(pr));
    const foot = [
      admin ? `${admin} pipeline${admin > 1 ? 's' : ''} wait${admin > 1 ? '' : 's'} for an admin's approval` : '',
      orphans.length ? `<span style="color:var(--bad)">unowned: ${orphans.map(pr => `<a href="${esc(safeUrl(pr.url))}" target="_blank" rel="noopener noreferrer" title="${esc(orphan(pr))}">#${pr.number}</a>`).join(', ')} — nobody's move; this is a matrix bug</span>` : '',
    ].filter(Boolean);
    if (!rows.length && !foot.length) return '';
    const cell = (n, cls = '') => `<td class="n ${n ? cls : 'zero'}">${n || '·'}</td>`;
    return `<article class="card owes" style="--sc:var(--accent)">
      <div class="ihead"><h3>Who owes what</h3><span class="sub">oldest debt first · click a name for their plan</span></div>
      <div style="overflow-x:auto"><table class="cmp">
        <thead><tr><th>Person</th><th class="n" title="reviews requested from them or awaiting their re-review">Reviews owed</th><th class="n" title="review threads or comments waiting for their answer">Answer</th><th class="n" title="red CI / no CI on head">Fix CI</th><th class="n" title="conflicts, behind main, base gone">Rebase</th><th class="n" title="request a reviewer, ping silent reviewers, mark a draft ready">Ask</th><th class="n" title="approved and green">Merge</th><th class="n" title="no activity for ${DORMANT_DAYS}+ days">Dormant</th><th class="n">Oldest</th></tr></thead>
        <tbody>${rows.map(r => `<tr class="who" data-viewas="${esc(r.login)}" title="Open the plan for ${esc(r.login)}"><td class="name">${esc(shortLogin(r.login))}${r.login === state.viewer ? ' <span class="faint">(you)</span>' : ''}</td>${cell(r.reviews, 'acc')}${cell(r.answer, 'warn')}${cell(r.fix, 'bad')}${cell(r.rebase, 'bad')}${cell(r.ask, 'warn')}${cell(r.merge, 'good')}${cell(r.dormant)}<td class="n">${r.oldest ? `${Math.floor(days(r.oldest))}d` : '·'}</td></tr>`).join('')}</tbody>
      </table></div>
      ${foot.length ? `<div class="faint" style="font-size:12px;margin-top:8px">${foot.join(' · ')}</div>` : ''}
    </article>`;
  }

  // ---------------------------------------------------------------- rendering: Streaks
  // The review game over the last GAME_DAYS: the viewer's streak and badges,
  // then what everyone earned. No ranking: the feed says who did what, not who is ahead.
  function gameOf(repo, d) {
    const h = state.hist[repo.id];
    if (!h || !h.at) return null;   // skeleton only until the first history load lands
    const open = d.prs.filter(pr => pr.rv?.log).map(pr => ({ number: pr.number, title: pr.title, url: pr.url, author: pr.author, draft: pr.draft, log: pr.rv.log }));
    // A PR merged since the last history pass has left the open list but isn't in
    // the history yet (it is re-listed every HIST_REFRESH_SEC): keep its last open log.
    const seen = state.openLogs[repo.id] || (state.openLogs[repo.id] = new Map());
    for (const p of open) seen.set(p.number, p);
    const known = new Set([...open, ...h.prs].map(p => p.number));
    for (const n of seen.keys()) if (h.prs.some(p => p.number === n) && !open.some(p => p.number === n)) seen.delete(n);
    const nums = new Set(open.map(p => p.number));
    return reviewGame([...open, ...h.prs.filter(p => !nums.has(p.number)), ...[...seen.values()].filter(p => !known.has(p.number))], now());
  }
  const streakOf = (repo, d, viewer) => { const g = viewer && gameOf(repo, d); return g ? (g.people.get(viewer)?.streak || null) : null; };
  const fmtWork = s => s < 3600 ? `${Math.max(1, Math.round(s / 60))}m` : `${(s / 3600).toFixed(s < 36000 ? 1 : 0)}h`;
  const dayLabel = day => new Date(day * DAY * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const prLink = pr => pr ? `<a href="${esc(safeUrl(pr.url))}" target="_blank" rel="noopener noreferrer" title="${esc(pr.title)}">#${pr.number}</a>` : '';
  const GAME_ICONS = {
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    buoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7z"/>',
    flame: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  };
  const gameIcon = k => `<svg class="gi" viewBox="0 0 24 24">${GAME_ICONS[k] || ''}</svg>`;
  const METALS = ['locked', 'bronze', 'silver', 'gold'];
  const STREAK_METAL = { 5: 1, 10: 2, 20: 3 };
  const MILESTONES = Object.values(ACHIEVEMENTS).filter(a => a.streak).map(a => a.streak).sort((a, b) => a - b);
  const tierOf = (a, n) => a.streak ? (n ? STREAK_METAL[a.streak] : 0) : a.tiers.filter(x => n >= x).length;
  const ghAvatar = login => `https://avatars.githubusercontent.com/${encodeURIComponent(login)}?s=64`;
  const gav = login => `<span class="gav"><img src="${esc(ghAvatar(login))}" alt="" loading="lazy" data-initials="${esc(initials(shortLogin(login)))}"></span>`;
  const medal = (icon, tier, cls = '') => `<span class="medal m-${METALS[tier]} ${cls}">${gameIcon(icon)}</span>`;
  // The hero: the streak inside a ring that fills towards the next milestone.
  function streakHero(me, viewer) {
    const next = MILESTONES.find(x => me.streak < x), prev = [...MILESTONES].reverse().find(x => me.streak >= x) || 0;
    const frac = next ? (me.streak - prev) / (next - prev) : 1, C = 2 * Math.PI * 72;
    const nextA = next && Object.values(ACHIEVEMENTS).find(a => a.streak === next);
    const lit = me.streak > 0;
    const goal = next
      ? `<b>${next - me.streak}</b> more review day${next - me.streak === 1 ? '' : 's'} to <b>${esc(nextA.title)}</b>`
      : `every streak badge earned`;
    const late = me.owed.filter(o => o.due <= now()), soon = me.owed.filter(o => o.due > now());
    const chip = (o, cls, txt) => `<a class="owe ${cls}" href="${esc(safeUrl(o.pr.url))}" target="_blank" rel="noopener noreferrer" data-tip="${esc(o.pr.title)}">#${o.pr.number}<small>${esc(txt)}</small></a>`;
    return `<article class="card hero-streak ${lit ? 'lit' : ''}" style="--sc:var(--warn)">
      <div class="glow"></div>
      <div class="ihead"><h3>${viewer === state.viewer ? 'Your streak' : `${esc(shortLogin(viewer))}’s streak`}</h3></div>
      <div class="sring" data-tip="${next ? `${me.streak} of ${next} days to ${esc(nextA.title)}` : 'past every milestone'}">
        <svg viewBox="0 0 180 180"><defs><linearGradient id="bw-ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset=".55" stop-color="#f97316"/><stop offset="1" stop-color="#e11d48"/></linearGradient></defs>
          <circle class="bg" cx="90" cy="90" r="72"/>
          <circle class="fg" cx="90" cy="90" r="72" style="stroke-dasharray:${C.toFixed(1)};stroke-dashoffset:${(C * (1 - frac)).toFixed(1)}"/>
        </svg>
        <div class="core">
          <span class="flame">${gameIcon('flame')}${lit ? '<i></i><i></i><i></i>' : ''}</span>
          <b>${me.streak}</b><small>day streak</small>
        </div>
      </div>
      <div class="goal">${goal}</div>
      <div class="best">best in ${GAME_DAYS} days · <b>${me.best}</b></div>
      ${late.length || soon.length ? `<div class="owes-row">${late.map(o => chip(o, 'late', `due ${ago(o.due)}`)).join('')}${soon.map(o => chip(o, 'soon', until(o.due))).join('')}</div>` : `<div class="owes-row"><span class="owe clear">nothing owed right now</span></div>`}
    </article>`;
  }
  // GitHub-style heatmap of the working days: weeks as columns, Mon–Fri as rows.
  function streakCalendar(g, me) {
    const first = g.days[0], weeks = [];
    for (const day of g.days) { const wk = weekStart(day); if (weeks[weeks.length - 1] !== wk) weeks.push(wk); }
    let lastMonth = -1;
    const cols = weeks.map(wk => {
      const month = new Date(wk * DAY * 1000).getUTCMonth();
      const label = month !== lastMonth ? new Date(wk * DAY * 1000).toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }) : '';
      lastMonth = month;
      const cells = [0, 1, 2, 3, 4].map(i => {
        const day = wk + i;
        if (day < first || day > g.today) return `<i class="void"></i>`;
        const m = me.days[day], lvl = !m ? 'l0' : m.v === 'bad' ? 'late' : `l${Math.min(4, m.good)}`;
        const refs = ns => ns.map(n => `#${n}`).join(', ');
        const tip = !m ? 'nothing owed' : m.v === 'bad' ? `overdue: ${refs(m.late)}${m.good ? ` · ${m.good} on time` : ''}` : `${m.good} review${m.good > 1 ? 's' : ''} on time: ${refs(m.prs)}`;
        return `<i class="${lvl} ${day === g.today ? 'today' : ''}" data-tip="${esc(dayLabel(day))} · ${esc(tip)}">${new Date(day * DAY * 1000).getUTCDate()}</i>`;
      }).join('');
      return `<div class="wk"><span class="mo">${esc(label)}</span>${cells}</div>`;
    }).join('');
    return `<div class="heat"><div class="dows"><span></span><span>Mon</span><span></span><span>Wed</span><span></span><span>Fri</span></div>${cols}</div>
      <div class="heat-legend"><span>less</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span>more on time</span><i class="late"></i><span>overdue</span></div>`;
  }
  function renderStreaks(repo, d, viewer) {
    const h = state.hist[repo.id], g = gameOf(repo, d);
    const sla = GAME_SLA_H === 24 ? 'one working day' : `${GAME_SLA_H} working hours`;
    const head = (style = '') => `<div class="section-title" ${style}><h2>Review streaks</h2><span class="sub">last ${GAME_DAYS} days · a review is due ${sla} after it is asked for (Mon–Fri, UTC)${h?.loading ? ' · reading closed PRs…' : ''}</span></div>`;
    if (!g) return head() + `<div class="game"><div class="sk sk-card"></div><div class="sk sk-card"></div></div>`;
    const people = [...g.people.keys()].sort((a, b) => a.localeCompare(b));
    let html = `<div class="ptabs">${head('style="margin:0"')}
      <label class="viewas">View as <select id="ob-viewas"><option value="">${esc(state.viewer || '— pick a login —')}</option>${people.filter(p => p !== state.viewer).map(p => `<option value="${esc(p)}" ${p === state.viewAs ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select></label>
    </div>`;
    if (h.errors.length) html += notice(`<b>Part of the history is missing.</b> ${esc(h.errors.join(' · '))}`, true);
    const me = viewer && g.people.get(viewer);
    html += `<div class="game">`;
    if (!viewer) html += `<article class="card wide"><div class="hint"><b>Whose streak?</b> Pick a login above.</div></article>`;
    else if (!me) html += `<article class="card wide allclear" style="--sc:var(--none)"><div class="big">No reviews from ${esc(viewer === state.viewer ? 'you' : viewer)} in the last ${GAME_DAYS} days.</div><p class="muted">Answer a review request within ${sla} to light the first flame.</p></article>`;
    else {
      const waits = me.waits.slice().sort((a, b) => a - b), median = waits.length ? waits[Math.floor(waits.length / 2)] : null;
      const resolved = me.onTime + me.late, pct = resolved ? Math.round(me.onTime / resolved * 100) : null;
      const overdue = me.owed.filter(o => o.due <= now()).length;
      html += streakHero(me, viewer);
      html += `<article class="card" style="--sc:var(--good)">
        <div class="ihead"><h3>Review days</h3><span class="sub">every working day of the last ${GAME_DAYS} · hover a day for its PRs</span></div>
        <div class="days-body"><div>${streakCalendar(g, me)}</div>
        <div class="metrics">
          <div class="metric"><div class="l">On time</div><div class="v">${pct == null ? '—' : pct}<small>%</small></div><div class="meter"><i style="width:${pct || 0}%"></i></div><div class="s">${me.onTime} of ${resolved}</div></div>
          ${metric('Median answer', median == null ? null : fmtWork(median), '', 'working time')}
          ${metric('Reviews', me.reviews, '', `in ${GAME_DAYS} days`)}
          <div class="metric ${overdue ? 'hot' : ''}"><div class="l">Owed now</div><div class="v">${me.owed.length}</div><div class="s">${overdue ? `${overdue} overdue` : 'none overdue'}</div></div>
        </div></div>
      </article>`;
      const cards = Object.entries(ACHIEVEMENTS).map(([k, a]) => {
        const n = me.awards.filter(x => x.key === k).length, tier = tierOf(a, n);
        let frac, label;
        if (a.streak) { frac = Math.min(me.best, a.streak) / a.streak; label = n ? `earned${n > 1 ? ` ×${n}` : ''}` : `${Math.min(me.best, a.streak)} / ${a.streak} days`; }
        else { const next = a.tiers[tier], prev = tier ? a.tiers[tier - 1] : 0; frac = next ? (n - prev) / (next - prev) : 1; label = next ? `${n} / ${next} → ${METALS[tier + 1]}` : `${n} · maxed out`; }
        const aim = a.streak ? STREAK_METAL[a.streak] : Math.min(3, tier + 1);
        const pips = a.streak ? '' : `<span class="pips">${[1, 2, 3].map(i => `<i class="${i <= tier ? `on m-${METALS[i]}` : ''}"></i>`).join('')}</span>`;
        const last = me.awards.find(x => x.key === k);
        return `<div class="ach t${tier}" data-tip="${esc(a.desc)}${last ? ` · last ${esc(ago(last.at))}` : ''}">
          ${medal(a.icon, tier)}
          <b>${esc(a.title)}</b><small>${esc(a.desc)}</small>
          <div class="sprog m-${METALS[aim]}"><i style="width:${Math.round(frac * 100)}%"></i></div>
          <div class="ach-foot"><span>${esc(label)}</span>${pips}</div>
        </div>`;
      }).join('');
      const got = Object.keys(ACHIEVEMENTS).filter(k => me.awards.some(x => x.key === k)).length;
      html += `<article class="card wide" style="--sc:var(--accent)"><div class="ihead"><h3>Achievements</h3><span class="sub">${got} of ${Object.keys(ACHIEVEMENTS).length} unlocked · bronze, silver and gold by how often, over the last ${GAME_DAYS} days</span></div><div class="achs">${cards}</div></article>`;
    }
    // The feed: newest first, grouped by day; a badge that just reached a new metal is called out.
    const seen = {};
    for (const a of g.feed.slice().reverse()) {
      const A = ACHIEVEMENTS[a.key], k = a.login + '|' + a.key, n = (seen[k] = (seen[k] || 0) + 1);
      a.tier = tierOf(A, n); a.up = A.streak ? true : A.tiers.includes(n) && n > 1;
    }
    const dayKey = t => new Date(t * 1000).toDateString();
    const todayK = dayKey(now()), yK = dayKey(now() - DAY);
    const groups = [];
    for (const a of g.feed.slice(0, 25)) {
      const k = dayKey(a.at);
      if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, t: a.at, list: [] });
      groups[groups.length - 1].list.push(a);
    }
    const feed = groups.map(gr => `<div class="tl-day">${gr.k === todayK ? 'Today' : gr.k === yK ? 'Yesterday' : esc(new Date(gr.t * 1000).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }))}</div>` +
      gr.list.map(a => {
        const A = ACHIEVEMENTS[a.key];
        return `<div class="tl-row ${a.up ? 'up' : ''}">${gav(a.login)}
          <div class="tl-body"><button class="link who" data-streak-as="${esc(a.login)}">${esc(shortLogin(a.login))}</button> earned ${medal(A.icon, a.tier, 'mini')}<b>${esc(A.title)}</b>${a.up ? ` <span class="up-tag m-${METALS[a.tier]}">${esc(A.streak ? `${A.streak}-day streak` : `${METALS[a.tier]}!`)}</span>` : ''}${a.pr ? ` <span class="faint">on</span> ${prLink(a.pr)}` : ''}</div>
          <span class="faint tl-at">${esc(new Date(a.at * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))}</span></div>`;
      }).join('')).join('');
    html += `<article class="card wide" style="--sc:var(--good)"><div class="ihead"><h3>Team feed</h3><span class="sub">the latest badges · click a name for their streak</span></div><div class="tl">${feed || '<div class="faint">Nothing earned yet.</div>'}</div></article>`;
    return html + `</div>`;
  }

  // ---------------------------------------------------------------- animated treemap
  // Squarified layout (Bruls, Huizing & van Wijk) with FLIP transitions on one
  // rAF loop, after covisible's treemap: when only the values change, cells
  // glide and resize in place; when the level changes (drill in or out, another
  // grouping) the whole mosaic morphs, old and new cells paired by size rank.
  // Cells are absolutely positioned divs, so they carry labels and the board's
  // [data-tip]. morph() leaves a [data-owned] host's children alone; render()
  // registers the host's spec in `owned` and mountOwned() draws it.
  const owned = new Map();
  function mountOwned() {
    for (const host of el('content').querySelectorAll('[data-owned]')) { const spec = owned.get(host.dataset.owned); if (spec) treemap(host, spec); }
  }
  function tmSquarify(items, W, H) {
    const out = [], live = items.filter(it => it.value > 0);
    const total = live.reduce((s, it) => s + it.value, 0);
    if (!total || W <= 0 || H <= 0) return out;
    const scale = W * H / total, vals = live.map(it => ({ it, area: it.value * scale }));
    const worst = (row, side) => { let sum = 0, mx = -Infinity, mn = Infinity; for (const a of row) { sum += a; mx = Math.max(mx, a); mn = Math.min(mn, a); } return Math.max(side * side * mx / (sum * sum), sum * sum / (side * side * mn)); };
    let x = 0, y = 0, w = W, h = H, i = 0;
    while (i < vals.length) {
      const side = Math.min(w, h), row = [vals[i]];
      let j = i + 1;
      while (j < vals.length && worst([...row.map(r => r.area), vals[j].area], side) <= worst(row.map(r => r.area), side)) row.push(vals[j++]);
      const sum = row.reduce((s, r) => s + r.area, 0);
      if (w >= h) { const cw = sum / h; let cy = y; for (const r of row) { const ch = r.area / cw; out.push({ it: r.it, x, y: cy, w: cw, h: ch }); cy += ch; } x += cw; w -= cw; }
      else { const ch = sum / w; let cx = x; for (const r of row) { const cw = r.area / ch; out.push({ it: r.it, x: cx, y, w: cw, h: ch }); cx += cw; } y += ch; h -= ch; }
      i = j;
    }
    return out;
  }
  const TM_GAP = 3, TM_MS = 560;
  const tmEase = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function treemap(host, spec) {
    const tm = host._tm || (host._tm = { cells: new Map(), level: null, raf: 0, w: 0 });
    tm.spec = spec;
    if (!tm.wired) {
      tm.wired = true;
      host.addEventListener('click', e => { const c = e.target.closest('.tm-cell'); if (c?._it?.pick) tm.spec.onPick?.(c._it); });
      if (window.ResizeObserver) new ResizeObserver(() => { if (host.clientWidth && Math.abs(host.clientWidth - tm.w) > 1) draw(false); }).observe(host);
    }
    const box = c => ({ x: parseFloat(c.style.left) || 0, y: parseFloat(c.style.top) || 0, w: parseFloat(c.style.width) || 0, h: parseFloat(c.style.height) || 0 });
    const place = (c, r) => { c.style.left = `${r.x}px`; c.style.top = `${r.y}px`; c.style.width = `${Math.max(0, r.w)}px`; c.style.height = `${Math.max(0, r.h)}px`; };
    const fill = (c, it, r) => {
      c._it = it;
      c.dataset.tip = it.tip || '';
      c.style.setProperty('--tc', it.color || 'var(--accent)');
      c.className = `tm-cell ${it.pick ? 'pick' : ''} ${r.w < 64 || r.h < 30 ? 'tiny' : r.h < 50 || r.w < 110 ? 'mid' : ''}`;
      const html = `<span class="tm-waste" style="height:${Math.round((it.waste || 0) * 100)}%"></span><b>${esc(it.label)}</b><small>${esc(it.sub || '')}</small>`;
      if (c._html !== html) { c.innerHTML = html; c._html = html; }
    };
    const inset = r => ({ x: r.x + TM_GAP / 2, y: r.y + TM_GAP / 2, w: r.w - TM_GAP, h: r.h - TM_GAP });
    function draw(animate) {
      const W = host.clientWidth, H = host.clientHeight;
      tm.w = W;
      const rects = tmSquarify(tm.spec.items.slice().sort((a, b) => b.value - a.value), W, H).map(r => ({ ...inset(r), it: r.it }));
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const first = tm.level === null, same = tm.level === tm.spec.level;
      tm.level = tm.spec.level;
      const tweens = [], next = new Map();
      const make = (it, r) => { const c = document.createElement('div'); place(c, r); fill(c, it, r); c.style.opacity = '0'; host.appendChild(c); return c; };
      const seed = r => first ? { x: r.x + r.w / 2, y: r.y + r.h / 2, w: 0, h: 0 } : r;   // the first draw grows every cell out of its centre
      if (same || !animate) {
        for (const [k, c] of tm.cells) if (!rects.some(r => r.it.key === k)) tweens.push({ c, from: box(c), to: box(c), o0: +c.style.opacity || 1, o1: 0, gone: true });
        for (const r of rects) {
          let c = tm.cells.get(r.it.key);
          if (c) { tweens.push({ c, from: box(c), to: r, o0: +c.style.opacity || 1, o1: 1 }); fill(c, r.it, r); }
          else { c = make(r.it, r); tweens.push({ c, from: seed(r), to: r, o0: 0, o1: 1 }); }
          next.set(r.it.key, c);
        }
      } else {
        // Another level: every old cell travels into the new cell of the same size rank.
        const old = [...tm.cells.values()].sort((a, b) => { const A = box(a), B = box(b); return B.w * B.h - A.w * A.h; });
        const n = Math.max(old.length, rects.length);
        for (let i = 0; i < n; i++) {
          const c = old[i], r = rects[i];
          if (c && r) { tweens.push({ c, from: box(c), to: r, o0: +c.style.opacity || 1, o1: 1 }); fill(c, r.it, r); next.set(r.it.key, c); }
          else if (r) { const m = make(r.it, r); tweens.push({ c: m, from: r, to: r, o0: 0, o1: 1 }); next.set(r.it.key, m); }
          else tweens.push({ c, from: box(c), to: box(c), o0: +c.style.opacity || 1, o1: 0, gone: true });
        }
      }
      tm.cells = next;
      cancelAnimationFrame(tm.raf);
      const lerp = (a, b, t) => a + (b - a) * t, t0 = performance.now(), dur = !animate || reduce ? 0 : TM_MS;
      const frame = t => {
        const k = dur ? Math.min(1, (t - t0) / dur) : 1, e = tmEase(k);
        for (const tw of tweens) {
          place(tw.c, { x: lerp(tw.from.x, tw.to.x, e), y: lerp(tw.from.y, tw.to.y, e), w: lerp(tw.from.w, tw.to.w, e), h: lerp(tw.from.h, tw.to.h, e) });
          tw.c.style.opacity = String(lerp(tw.o0, tw.o1, e));
        }
        if (k < 1) tm.raf = requestAnimationFrame(frame);
        else for (const tw of tweens) { if (tw.gone) tw.c.remove(); else { place(tw.c, tw.to); tw.c.style.opacity = '1'; } }
      };
      tm.raf = requestAnimationFrame(frame);
    }
    draw(true);
  }

  // ---------------------------------------------------------------- rendering: CI minutes
  // Where the agent time of the last RUNS_DAYS went: this week against the last,
  // per day, per workflow (drill into its steps), per event and per PR, and how
  // long pipelines queue for an agent. Woodpecker only.
  const fmtH = sec => sec == null ? '—' : sec < 60 ? `${Math.round(sec)}s` : sec < 3600 ? `${Math.round(sec / 60)}m` : sec < 36000 ? `${Math.floor(sec / 3600)}h ${Math.round(sec % 3600 / 60)}m` : `${Math.round(sec / 3600)}h`;
  const dayShort = day => new Date(day * DAY * 1000).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
  const ARCH_COLOR = { amd64: 'var(--c-amd)', arm64: 'var(--c-arm)' };
  const EVENT_LABEL = { pull_request: 'Pull requests', push: 'Pushes to main', cron: 'Cron', manual: 'Manual runs', tag: 'Tags', deployment: 'Deployments', release: 'Releases' };
  function runsHeader(title, sub, R, controls = '') {
    const busy = R?.loading ? (R.total ? ` · reading ${R.total - R.pending} of ${R.total} pipelines…` : ' · listing pipelines…') : '';
    return `<div class="ptabs"><div class="section-title" style="margin:0"><h2>${title}</h2><span class="sub">${sub}${busy}</span></div>${controls}</div>`
      + (R?.errors?.length ? notice(`<b>Part of the pipeline history is missing.</b> ${esc(R.errors.join(' · '))}`, true) : '');
  }
  const seg = (attr, cur, opts) => `<div class="segmented">${opts.map(([k, l]) => `<button class="${k === cur ? 'active' : ''}" data-${attr}="${k}">${l}</button>`).join('')}</div>`;
  function renderMinutes(repo, d) {
    const R = state.runs[repo.id], recs = runsOf(repo.id);
    const controls = seg('mins-by', state.minsBy, [['time', 'Agent time'], ['waste', 'Superseded']]);
    const head = runsHeader('CI minutes', `agent time of every pipeline of the last ${RUNS_DAYS} days · Woodpecker only`, R, controls);
    if (!recs.some(r => r.wf)) return head + (R?.loading || !R ? `<div class="mins"><div class="sk sk-card"></div><div class="sk sk-card"></div></div>` : `<div class="hint">No finished pipelines in the last ${RUNS_DAYS} days.</div>`);
    const M = minutes(recs, now());
    const cur = M.week.cur, prev = M.week.prev, waste = state.minsBy === 'waste';
    const val = x => waste ? x.killed : x.sec;
    const hasArm = M.byArch.arm64 > 0;
    let html = head + `<div class="mins">`;
    // Hero: this week's agent time against last week's.
    html += `<article class="card mins-hero" style="--sc:var(--accent)">
      <div class="ihead"><h3>This week</h3><span class="sub">Mon–Sun, UTC</span></div>
      <div class="hero-num">${esc(fmtH(cur.total))}</div>
      <div class="mins-delta">${prev.total ? `${deltaBadge(pctDelta(cur.total, prev.total), false)} <span class="faint">vs ${esc(fmtH(prev.total))} last week</span>` : '<span class="faint">no pipelines last week</span>'}</div>
      <div class="metrics">
        ${metric('Queue p50', fmtH(M.queue.p50), '', 'waiting for an agent')}
        ${metric('Queue p90', fmtH(M.queue.p90), '', `max ${fmtH(M.queue.max)}`)}
        <div class="metric ${M.killed > M.total * .1 ? 'mins-hot' : ''}"><div class="l">Superseded</div><div class="v">${M.total ? Math.round(M.killed / M.total * 100) : 0}<small>%</small></div><div class="s">${esc(fmtH(M.killed))} on killed runs</div></div>
        ${metric('Pipelines', M.runs, '', `in ${RUNS_DAYS} days`)}
      </div>
    </article>`;
    // Per day: stacked by architecture, the superseded share hatched on top.
    const max = Math.max(1, ...M.byDay.map(x => x.sec));
    const cols = M.byDay.map(x => {
      const tip = `${dayShort(x.day)} · ${fmtH(x.sec)}${hasArm ? ` · amd64 ${fmtH(x.arch.amd64)} · arm64 ${fmtH(x.arch.arm64)}` : ''} · superseded ${fmtH(x.killed)} · ${x.n} pipeline${x.n === 1 ? '' : 's'}${x.p90 != null ? ` · queue p90 ${fmtH(x.p90)}` : ''}`;
      const hpx = x.sec / max * 100, mon = !((x.day + 3) % 7);
      return `<div class="mins-col ${isWeekend(x.day) ? 'we' : ''}" data-tip="${esc(tip)}"><div class="stack" style="height:${hpx.toFixed(1)}%">
          <i class="w" style="height:${x.sec ? (x.killed / x.sec * 100).toFixed(1) : 0}%"></i>
          <i class="arm" style="height:${x.sec ? (x.arch.arm64 / x.sec * 100).toFixed(1) : 0}%"></i>
          <i class="amd" style="flex:1"></i>
        </div><span class="dl">${mon ? esc(new Date(x.day * DAY * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })) : ''}</span></div>`;
    }).join('');
    const legend = `<div class="mins-legend">${hasArm ? `<span><i class="amd"></i>amd64</span><span><i class="arm"></i>arm64</span>` : `<span><i class="amd"></i>agent time</span>`}<span><i class="w"></i>superseded (killed runs)</span></div>`;
    html += `<article class="card" style="--sc:var(--accent)">
      <div class="ihead"><h3>Per day</h3><span class="sub">agent time · hover a day</span></div>
      <div class="mins-cols">${cols}</div>${legend}
      ${M.byDay.filter(x => x.p90 != null).length > 1 ? `<div class="faint mins-q">Queue wait p90 per day</div>${sparkline(M.byDay.map(x => x.p90), { h: 44, fmt: fmtH })}` : ''}
    </article>`;
    // Treemap: workflows (drill into steps), or one workflow's steps.
    const wf = state.minsWf && M.byWorkflow.find(w => w.name === state.minsWf);
    const tot = Math.max(1, wf ? val(wf) : waste ? M.killed : M.total);
    const cellOf = (x, color, pick, label) => ({
      // Superseded mode: the area already is the wasted time, so no stripe, and the cell takes the colour of waste.
      key: (wf ? 's:' : 'w:') + x.name, value: val(x), color: waste ? `color-mix(in srgb, var(--bad) 70%, ${color})` : color, pick, waste: waste || !x.sec ? 0 : x.killed / x.sec, label,
      sub: `${fmtH(val(x))} · ${Math.round(val(x) / tot * 100)}%`,
      tip: `${label} · ${fmtH(x.sec)} over ${x.n} run${x.n === 1 ? '' : 's'} · avg ${fmtH(x.sec / x.n)} · superseded ${fmtH(x.killed)}${pick ? ' · click for its steps' : ''}`,
    });
    const items = wf
      ? wf.steps.map(x => cellOf(x, ARCH_COLOR[wf.arch], false, x.name || 'short steps & gaps'))
      : M.byWorkflow.map(x => cellOf(x, ARCH_COLOR[x.arch], x.steps.length > 1, x.name));
    owned.set('mins-tm', { items, level: wf ? `wf:${wf.name}` : 'all', onPick: it => { state.minsWf = it.key.slice(2); render(true); } });
    const crumbs = wf ? `<button class="link" data-mins-wf="">All workflows</button> <span class="faint">›</span> <b>${esc(wf.name)}</b>` : `<b>All workflows</b> <span class="faint">· click one for its steps</span>`;
    html += `<article class="card wide" style="--sc:var(--accent)">
      <div class="ihead"><h3>${waste ? 'Superseded time' : 'Where the time goes'}</h3><span class="sub mins-crumbs">${crumbs}</span></div>
      <div class="tm" data-owned="mins-tm" data-key="mins-tm"></div>
      <div class="mins-legend">${hasArm ? `<span><i class="amd"></i>amd64</span><span><i class="arm"></i>arm64</span>` : ''}${waste ? '' : '<span><i class="w"></i>stripe: superseded share</span>'}<span class="faint">area: ${waste ? 'superseded' : 'agent'} time</span></div>
    </article>`;
    // Events and pull requests.
    const evMax = Math.max(1, ...M.byEvent.map(val));
    html += `<article class="card" style="--sc:var(--accent)"><div class="ihead"><h3>By event</h3></div>
      ${M.byEvent.map(x => `<div class="mins-bar" data-tip="${esc(`${EVENT_LABEL[x.name] || x.name} · ${fmtH(x.sec)} · ${x.n} pipelines · superseded ${fmtH(x.killed)}`)}"><span class="nm">${esc(EVENT_LABEL[x.name] || x.name)}</span><span class="tr"><i style="width:${(val(x) / evMax * 100).toFixed(1)}%"></i></span><span class="vl mono">${esc(fmtH(val(x)))}</span></div>`).join('')}
    </article>`;
    const prRows = M.byPR.slice(0, 10).sort((a, b) => val(b) - val(a)), prMax = Math.max(1, ...prRows.map(val));
    html += `<article class="card" style="--sc:var(--accent)"><div class="ihead"><h3>Most expensive PRs</h3><span class="sub">${esc(fmtH(M.byPR.reduce((s, x) => s + x.sec, 0)))} across ${M.byPR.length} PRs</span></div>
      ${prRows.map(x => { const pr = d.prs.find(p => p.number === x.num); return `<div class="mins-bar" data-tip="${esc(`${pr ? pr.title + ' · ' : ''}${x.n} pipelines · ${fmtH(x.sec)} · superseded ${fmtH(x.killed)}`)}"><span class="nm"><a href="${esc(safeUrl(`${repo.forge_url}/pull/${x.num}`))}" target="_blank" rel="noopener noreferrer">#${x.num}</a> <span class="faint">${esc(pr ? pr.title : `${x.n} runs`)}</span></span><span class="tr"><i style="width:${(val(x) / prMax * 100).toFixed(1)}%"></i></span><span class="vl mono">${esc(fmtH(val(x)))}</span></div>`; }).join('') || '<div class="faint">No pull request pipelines.</div>'}
    </article>`;
    return html + `</div>`;
  }

  // ---------------------------------------------------------------- rendering: CI weather
  // Flaky steps as weather: the forecast is this week's flakes, the map is the
  // top flaky steps × days. Woodpecker only.
  const WX_SKY = {
    sun: { label: 'Clear', desc: 'ran, no flakes' }, cloud: { label: 'Cloudy', desc: '1 flake' },
    rain: { label: 'Rain', desc: '2–3 flakes' }, storm: { label: 'Storm', desc: '4+ flakes' },
  };
  const WX_SUN = '<g class="sun"><circle cx="24" cy="24" r="9"/><g class="rays"><path d="M24 6v5M24 37v5M6 24h5M37 24h5M11.3 11.3l3.5 3.5M33.2 33.2l3.5 3.5M11.3 36.7l3.5-3.5M33.2 14.8l3.5-3.5"/></g></g>';
  const WX_CLOUD = '<path class="cloud" d="M15 38h20a8 8 0 0 0 .6-16A11 11 0 0 0 14.4 25 6.5 6.5 0 0 0 15 38z"/>';
  const wxGlyph = (k, cls = '') => {
    const inner = k === 'sun' ? WX_SUN
      : k === 'cloud' ? `<g transform="translate(-6 -8) scale(.8)">${WX_SUN}</g>${WX_CLOUD}`
      : k === 'rain' ? `${WX_CLOUD}<g class="drops"><path d="M18 42l-2 4M25 42l-2 4M32 42l-2 4"/></g>`
      : `${WX_CLOUD}<path class="bolt" d="M26 36l-5 7h5l-3 6 8-9h-5l3-4z"/>`;
    return `<svg class="wx-g wx-g-${k} ${cls}" viewBox="0 0 48 52" aria-hidden="true">${inner}</svg>`;
  };
  const weatherCount = repo => { const recs = state.runs[repo.id] ? runsOf(repo.id) : []; return recs.length ? (flakes(recs, now(), RUNS_DAYS, WX_EVENTS[state.wxEvents] || WX_EVENTS.ci).week.cur.flakes || null) : null; };
  const forecastOf = n => n === 0 ? 'sun' : n <= 2 ? 'cloud' : n <= 6 ? 'rain' : 'storm';
  function renderWeather(repo, d) {
    const R = state.runs[repo.id], recs = runsOf(repo.id);
    const controls = seg('wx-events', state.wxEvents, [['ci', 'CI runs'], ['all', '+ manual runs']]);
    const head = runsHeader('CI weather', `flaky steps of the last ${RUNS_DAYS} days · flaky = the same commit both fails and passes a step`, R, controls);
    if (!recs.some(r => r.wf)) return head + (R?.loading || !R ? `<div class="wx"><div class="sk sk-card"></div><div class="sk sk-card"></div></div>` : `<div class="hint">No finished pipelines in the last ${RUNS_DAYS} days.</div>`);
    const X = flakes(recs, now(), RUNS_DAYS, WX_EVENTS[state.wxEvents] || WX_EVENTS.ci);
    const cur = X.week.cur, prev = X.week.prev, fc = forecastOf(cur.flakes);
    const pctTxt = r => `${(r * 100).toFixed(r && r < .01 ? 1 : 0)}%`;
    let html = head + `<div class="wx">`;
    const verdict = { sun: 'Clear skies this week', cloud: 'A few clouds this week', rain: 'Showers this week', storm: 'Stormy week' }[fc];
    html += `<article class="card wx-hero wx-${fc}" style="--sc:var(--accent)">
      <div class="ihead"><h3>Forecast</h3><span class="sub">this week, Mon–Sun UTC</span></div>
      <div class="wx-now">${wxGlyph(fc, 'big')}<div><div class="hero-num">${cur.flakes}<small> flake${cur.flakes === 1 ? '' : 's'}</small></div>
        <div class="wx-verdict">${verdict}</div>
        <div class="wx-delta">${prev.flakes || cur.flakes ? `${deltaBadge(pctDelta(cur.flakes, prev.flakes) ?? (cur.flakes ? 100 : 0), false)} <span class="faint">vs ${prev.flakes} last week</span>` : '<span class="faint">none last week either</span>'}</div></div></div>
      <div class="metrics">
        ${metric('Flake rate', pctTxt(cur.rate), '', `of ${cur.verdicts} step verdicts`)}
        ${metric('Lost to reruns', fmtH(X.lost), '', `agent time, ${RUNS_DAYS} days`)}
        ${metric('Reruns', X.attempts.reruns, '', `over ${X.attempts.groups} commits`)}
        ${metric('Flaky steps', X.steps.length, '', X.failing.length ? `${X.failing.length} fail for real` : 'none fail for real')}
      </div>
    </article>`;
    // The map: rows = steps, columns = days.
    const rows = (X.steps.length ? X.steps : X.failing).slice(0, 12);
    const focus = state.wxStep && rows.some(r => r.key === state.wxStep) ? state.wxStep : '';
    const mapRows = rows.filter(r => !focus || r.key === focus).map(r => `<div class="wx-row" data-key="${esc(r.key)}"><span class="wx-name mono" data-tip="${esc(r.key)}">${esc(r.step)}<small>${esc(r.wf)}</small></span>${X.days.map(day => {
      const c = X.map[r.key]?.[day], k = sky(c);
      const tip = `${dayShort(day)} · ${r.key} · ${c ? `${c.flakes} flake${c.flakes === 1 ? '' : 's'} · ${c.genuine} real failure${c.genuine === 1 ? '' : 's'} · ${c.runs} run${c.runs === 1 ? '' : 's'}` : 'not run'}`;
      return `<i class="wx-cell wx-${k} ${c?.genuine ? 'real' : ''} ${isWeekend(day) ? 'we' : ''}" data-tip="${esc(tip)}">${k === 'void' ? '' : wxGlyph(k)}</i>`;
    }).join('')}</div>`).join('');
    const dayHead = `<div class="wx-row wx-days"><span class="wx-name"></span>${X.days.map(day => `<i class="wx-dh">${!((day + 3) % 7) ? esc(new Date(day * DAY * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })) : ''}</i>`).join('')}</div>`;
    html += `<article class="card" style="--sc:var(--accent)">
      <div class="ihead"><h3>Weather map</h3><span class="sub">${X.steps.length ? 'the flakiest steps' : X.failing.length ? 'no flakes: the steps that fail for real' : 'nothing failed'} × days · hover a day${focus ? ` · <button class="link" data-wx-step="">show all</button>` : ''}</span></div>
      ${rows.length ? `<div class="wx-map">${dayHead}${mapRows}</div>
      <div class="wx-legend">${Object.entries(WX_SKY).map(([k, v]) => `<span>${wxGlyph(k)}<b>${v.label}</b> ${v.desc}</span>`).join('')}<span><i class="wx-realdot"></i>failed for real</span></div>`
      : `<div class="hint"><b>Clear skies.</b> Nothing failed in the last ${RUNS_DAYS} days.</div>`}
    </article>`;
    // Ranking.
    if (X.steps.length) {
      const top = Math.max(...X.steps.map(s => s.rate));
      html += `<article class="card wide" style="--sc:var(--warn)"><div class="ihead"><h3>Flakiest steps</h3><span class="sub">click a row to single it out on the map</span></div>
        <div style="overflow-x:auto"><table class="cmp wx-rank"><thead><tr><th>Step</th><th class="n">Flakes</th><th>Flake rate</th><th class="n">Real fails</th><th class="n">Last flake</th><th>PRs hit</th><th class="n">Lost</th></tr></thead><tbody>
        ${X.steps.slice(0, 15).map(s => `<tr class="${s.key === focus ? 'on' : ''}" data-wx-step="${esc(s.key === focus ? '' : s.key)}"><td class="name">${esc(s.step)}<small>${esc(s.wf)}</small></td><td class="n"><b>${s.flakes}</b></td>
          <td><div class="wx-rate" data-tip="${esc(`${s.flakes} flakes of ${s.flakes + s.passes + s.genuine} verdicts`)}"><i style="width:${(s.rate / top * 100).toFixed(1)}%"></i><span class="mono">${pctTxt(s.rate)}</span></div></td>
          <td class="n">${s.genuine || '·'}</td><td class="n">${s.lastAt ? agoEl(s.lastAt) : '·'}</td>
          <td class="prs">${s.prs.slice(0, 5).map(n => `<a href="${esc(safeUrl(`${repo.forge_url}/pull/${n}`))}" target="_blank" rel="noopener noreferrer">#${n}</a>`).join(' ')}${s.prs.length > 5 ? ` <span class="faint">+${s.prs.length - 5}</span>` : ''}</td>
          <td class="n">${esc(fmtH(s.lostSec))}</td></tr>`).join('')}
        </tbody></table></div></article>`;
    }
    // Feed.
    const evs = X.events.filter(e => !focus || e.key === focus).slice(0, 25), groups = [];
    for (const e of evs) { const k = dayOf(e.at); if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, list: [] }); groups[groups.length - 1].list.push(e); }
    const pipeLink = n => `<a class="mono" href="${esc(`${state.cfg.server}/repos/${repo.id}/pipeline/${n}`)}" target="_blank" rel="noopener">#${n}</a>`;
    html += `<article class="card wide" style="--sc:var(--accent)"><div class="ihead"><h3>Recent flakes</h3><span class="sub">each one failed a step that passed on the same commit</span></div>
      ${groups.length ? `<div class="wx-tl">${groups.map(g => `<div class="wx-tl-day">${g.k === dayOf(now()) ? 'Today' : g.k === dayOf(now()) - 1 ? 'Yesterday' : esc(dayShort(g.k))}</div>${g.list.map(e => `<div class="wx-tl-row">${wxGlyph('rain')}<div><b class="mono">${esc(e.step)}</b> <span class="faint">${esc(e.wf)}</span> flaked${e.pr ? ` on <a href="${esc(safeUrl(`${repo.forge_url}/pull/${e.pr}`))}" target="_blank" rel="noopener noreferrer">#${e.pr}</a>` : e.ev === 'push' ? ' on main' : ` in a ${esc(e.ev)} run`} <span class="faint">· failed in</span> ${pipeLink(e.n)} <span class="faint">· passed in</span> ${pipeLink(e.passN)}<span class="faint"> · attempt ${e.attempt} of ${e.attempts}</span></div><span class="faint wx-at">${esc(new Date(e.at * 1000).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }))}</span></div>`).join('')}`).join('')}</div>`
      : `<div class="hint">No flakes${focus ? ' for this step' : ''} in the last ${RUNS_DAYS} days. Flakiness only shows when a commit runs twice: restart a red pipeline and come back.</div>`}
    </article>`;
    return html + `</div>`;
  }

  // ---------------------------------------------------------------- rendering: Weekly digest
  // A newspaper for one week: masthead, the lead story (the most reviewed PR),
  // sections per change type in columns, tickets, contributors and the week's
  // nightly perf. Prev / next walks the weeks the 30-day history covers.
  const ghAv = (login, cls) => `<span class="${cls}"><img src="${esc(`https://avatars.githubusercontent.com/${encodeURIComponent(login)}?s=64`)}" alt="" loading="lazy" data-initials="${esc(initials(shortLogin(login)))}"></span>`;
  function digestFor(repo, d) {
    const h = state.hist[repo.id];
    if (!h || !h.at) return null;
    const week = weekStart(dayOf(now())) - 7 * state.week;
    const dg = digestOf(h.prs.filter(p => p.merged), week, tickets);
    dg.week = week; dg.partial = dg.from < now() - GAME_DAYS * DAY;
    const nights = REPORTS_HOST && repo.full_name === PRIMARY_REPO ? state.insights?.nights : null;
    dg.perf = nights ? weekPerf(nights, dg.from, dg.to, n => ({ ratio: n.tpcc?.ratio_pct ?? null, geo: sv(n.tpch, 'geomean_s') ?? null })) : null;
    dg.perfLabels = { ratio: `TPC-C ${S.label}/${B.label}`, geo: `TPC-H ${S.label} geomean` };
    return dg;
  }
  function copyDigest(btn) {
    const repo = state.repos.find(r => String(r.id) === state.tab), dg = repo && digestFor(repo, state.data[repo.id]);
    if (!dg) return;
    const text = digestText(dg, repo.full_name.split('/').pop(), btn.dataset.copy, l => btn.dataset.copy === 'slack' ? `@${shortLogin(l)}` : `@${l}`, dg.perf, dg.perfLabels);
    const done = ok => { const t = btn.textContent; btn.textContent = ok ? 'Copied ✓' : 'Copy failed'; btn.classList.add('dg-copied'); setTimeout(() => { btn.textContent = t; btn.classList.remove('dg-copied'); }, 1500); };
    const fallback = () => { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); done(ok); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => done(true), fallback); else fallback();
  }
  const digestCount = (repo, d) => { const dg = state.week === 0 && digestFor(repo, d); return dg ? dg.n || null : null; };
  function renderDigest(repo, d) {
    const h = state.hist[repo.id], dg = digestFor(repo, d);
    const name = repo.full_name.split('/').pop();
    const fmtD = (t, o) => new Date(t * 1000).toLocaleDateString(undefined, { timeZone: 'UTC', ...o });
    const range = dg ? `${fmtD(dg.from, { month: 'short', day: 'numeric' })} – ${fmtD(dg.to - 1, { month: 'short', day: 'numeric', year: 'numeric' })}` : '';
    const nav = `<div class="dg-nav"><button class="btn" data-week="older" ${dg && dg.partial ? 'disabled' : ''} title="previous week">‹</button><span>${state.week === 0 ? 'This week' : state.week === 1 ? 'Last week' : `${state.week} weeks ago`}</span><button class="btn" data-week="newer" ${state.week === 0 ? 'disabled' : ''} title="next week">›</button>
      <button class="btn dg-copy" data-copy="slack" ${dg?.n ? '' : 'disabled'}>Copy for Slack</button><button class="btn dg-copy" data-copy="md" ${dg?.n ? '' : 'disabled'}>Markdown</button></div>`;
    const head = `<div class="ptabs"><div class="section-title" style="margin:0"><h2>Weekly digest</h2><span class="sub">what shipped · merged PRs, Mon–Sun UTC${h?.loading ? ' · reading closed PRs…' : ''}</span></div>${nav}</div>`;
    if (!dg) return head + `<div class="dg"><div class="sk sk-card"></div></div>`;
    const prA = p => `<a class="mono" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">#${p.number}</a>`;
    const tix = p => (p.keys || tickets(p)).map(([k, u]) => `<a class="dg-tk" href="${esc(safeUrl(u))}" target="_blank" rel="noopener noreferrer">${esc(k)}</a>`).join('');
    const reviewsOf = p => (p.log || []).filter(e => e[0] === 'r').length;
    const thu = new Date((dg.week + 3) * DAY * 1000), issue = Math.floor((thu - Date.UTC(thu.getUTCFullYear(), 0, 1)) / (7 * DAY * 1000)) + 1;   // ISO week number
    let html = head + `<div class="dg"><article class="card wide dg-paper" style="--sc:var(--text)">
      <header class="dg-masthead"><div class="dg-dateline"><span>${esc(range)}</span><span>No. ${issue}</span><span>${esc(repo.full_name)}</span></div>
        <h1>The ${esc(name.charAt(0).toUpperCase() + name.slice(1))} Weekly</h1>
        <div class="dg-strip">${metric('Merged', dg.n)}${metric('Contributors', dg.authors.length)}${metric('Features', dg.byType.find(g => g.type === 'feat')?.prs.length || 0)}${metric('Fixes', dg.byType.find(g => g.type === 'fix')?.prs.length || 0)}</div>
      </header>`;
    if (dg.partial) html += `<div class="hint">This week starts before the ${GAME_DAYS}-day history the board keeps; older merges are missing.</div>`;
    if (!dg.n) {
      html += `<div class="dg-quiet"><div class="dg-quiet-t">Quiet week.</div><p class="muted">Nothing was merged ${state.week === 0 ? 'yet this week' : 'this week'}.</p></div>`;
    } else {
      const lead = dg.merged.slice().sort((a, b) => reviewsOf(b) - reviewsOf(a) || b.merged - a.merged)[0];
      const leadCc = ccType(lead.title);
      html += `<section class="dg-lead"><div class="dg-kicker">${esc(leadCc ? (CC_TYPES[leadCc.type] || 'Change') : 'Top story')}${leadCc?.scope ? ` · ${esc(leadCc.scope)}` : ''}</div>
        <h2><a href="${esc(safeUrl(lead.url))}" target="_blank" rel="noopener noreferrer">${esc(subjectOf(lead))}</a></h2>
        <div class="dg-byline">${ghAv(lead.author, 'dg-av')}<span>by <b>${esc(shortLogin(lead.author))}</b> · merged ${esc(fmtD(lead.merged, { weekday: 'long' }))} · ${reviewsOf(lead)} review${reviewsOf(lead) === 1 ? '' : 's'}</span>${prA(lead)}${tix(lead)}</div></section>`;
      const sections = dg.byType.map(g => ({ ...g, rest: g.prs.filter(p => p.number !== lead.number) })).filter(g => g.rest.length);   // the lead story isn't repeated below
      html += `<div class="dg-cols">${sections.map(g => `<section class="dg-section"><div class="dg-kicker">${esc(g.label)} <span>${g.prs.length}</span></div>${g.rest.map(p => `<div class="dg-item ${p.cc?.breaking ? 'breaking' : ''}">
          <div class="dg-subj">${p.cc?.scope ? `<span class="dg-scope">${esc(p.cc.scope)}</span>` : ''}${esc(subjectOf(p))}${p.cc?.breaking ? ' <span class="dg-brk">breaking</span>' : ''}</div>
          <div class="dg-meta">${ghAv(p.author, 'dg-av sm')}<span>${esc(shortLogin(p.author))} · ${esc(fmtD(p.merged, { weekday: 'short' }))}</span>${prA(p)}${tix(p)}</div></div>`).join('')}</section>`).join('')}</div>`;
      html += `<div class="dg-foot">
        <section><div class="dg-kicker">Contributors</div><div class="dg-people">${dg.authors.map(a => `<span class="dg-person" data-tip="${esc(`${a.login} · ${a.n} merged`)}">${ghAv(a.login, 'dg-av')}<b>${esc(shortLogin(a.login))}</b><small>${a.n}</small></span>`).join('')}</div></section>
        <section><div class="dg-kicker">By ticket</div>${dg.byTracker.length ? `<div class="dg-tickets">${dg.byTracker.map(t => `<a class="dg-tk" href="${esc(safeUrl(t.url))}" target="_blank" rel="noopener noreferrer" data-tip="${esc(t.prs.map(p => `#${p.number} ${subjectOf(p)}`).join(' · '))}">${esc(t.key)}${t.prs.length > 1 ? ` <small>×${t.prs.length}</small>` : ''}</a>`).join('')}</div>` : ''}${dg.untracked.length ? `<div class="faint dg-untracked">${dg.untracked.length} PR${dg.untracked.length === 1 ? '' : 's'} without a ticket</div>` : ''}</section>
        ${dg.perf ? `<section><div class="dg-kicker">Performance this week</div><div class="dg-perf">
          ${metric(dg.perfLabels.ratio, dg.perf.ratio[1] == null ? null : nf(dg.perf.ratio[1], 1), '%', deltaBadge(pctDelta(dg.perf.ratio[1], dg.perf.ratio[0])))}
          ${metric(dg.perfLabels.geo, dg.perf.geo[1] == null ? null : nf(dg.perf.geo[1], 2), 's', deltaBadge(pctDelta(dg.perf.geo[1], dg.perf.geo[0]), false))}
        </div>${sparkline(dg.perf.series, { h: 40, fmt: v => nf(v, 1), unit: '%' })}<div class="faint dg-untracked">nightlies ${esc(dg.perf.first)} → ${esc(dg.perf.last)}</div></section>` : ''}
      </div>`;
    }
    return html + `</article></div>`;
  }

  // ---------------------------------------------------------------- rendering: Flow
  // Every PR merged in the last GAME_DAYS as a bar of its stages, the median
  // per stage, and the team's biggest wait. GitHub: the Streaks history, no
  // new requests; Woodpecker: the pipeline list for the CI stages.
  const NECK_WHO = { review: 'reviewers', author: 'authors', red: 'red CI', merge: 'merging' };
  function flowsOf(repo) {
    const h = state.hist[repo.id];
    if (!h || !h.at) return null;
    const byPr = new Map();
    for (const r of runsOf(repo.id)) if (r.ev === 'pull_request') { const n = prOf(r.ref); if (n) { if (!byPr.has(n)) byPr.set(n, []); byPr.get(n).push(r); } }
    const cutoff = now() - GAME_DAYS * DAY;
    return h.prs.filter(p => p.merged && p.merged >= cutoff && p.created).map(p => flowOf(p, byPr.get(p.number) || [])).sort((a, b) => b.merged - a.merged);
  }
  function renderFlow(repo, d) {
    const h = state.hist[repo.id], R = state.runs[repo.id], flows = flowsOf(repo);
    const busy = h?.loading ? ' · reading closed PRs…' : R?.loading ? ' · pipelines loading…' : '';
    const filters = flows?.length ? `<div class="flow-filters">${[['', 'All'], ...QUEUES.map(k => [k, `Longest wait: ${NECK_WHO[k]}`])].map(([k, l]) => `<button class="chip ${state.flowFilter === k ? 'active' : ''}" data-flow-filter="${k}">${l}</button>`).join('')}</div>` : '';
    const head = `<div class="ptabs"><div class="section-title" style="margin:0"><h2>Flow</h2><span class="sub">where a merged PR's time went · working hours, Mon–Fri UTC · last ${GAME_DAYS} days${busy}</span></div>${seg('flow-scale', state.flowScale, [['same', 'Same scale (√)'], ['fit', 'Fit']])}</div>`;
    if (!flows) return head + `<div class="flow"><div class="sk sk-card"></div><div class="sk sk-card"></div></div>`;
    if (!flows.length) return head + `<div class="hint">No PR was merged in the last ${GAME_DAYS} days.</div>`;
    const S = flowStats(flows), neck = S.bottleneck;
    let html = head + `<div class="flow">`;
    html += `<article class="card flow-hero" style="--sc:${STAGES[neck].color}">
      <div class="ihead"><h3>Ready → merged</h3><span class="sub">median working time, drafts excluded</span></div>
      <div class="hero-num">${esc(fmtH(S.medianActive))}</div>
      <div class="faint flow-wall">${esc(fmtH(S.medianWall))} on the calendar · ${S.n} PRs merged</div>
      <div class="flow-neck" style="--nc:${STAGES[neck].color}"><span class="dot"></span><div><b>Biggest wait: ${esc(NECK_WHO[neck])}</b><small>${Math.round(S.neckShare * 100)}% of all waiting · median ${esc(fmtH(S.stages[neck].median))} per PR</small></div></div>
      <div class="metrics">${QUEUES.map(k => `<div class="metric"><div class="l"><i class="flow-sw" style="background:${STAGES[k].color}"></i>${esc(STAGES[k].label.replace('Waiting for ', '').replace('Waiting to ', ''))}</div><div class="v">${esc(fmtH(S.stages[k].median))}</div><div class="s">median · p90 ${esc(fmtH(S.stages[k].p90))}</div></div>`).join('')}</div>
    </article>`;
    // Share of all time per stage: one stacked bar, then the medians as bars.
    const share = Object.entries(S.stages).filter(([, x]) => x.total);
    const medMax = Math.max(1, ...Object.values(S.stages).map(x => x.median || 0));
    html += `<article class="card" style="--sc:var(--accent)">
      <div class="ihead"><h3>Where the time went</h3><span class="sub">all ${S.n} PRs together · hover a stage</span></div>
      <div class="flow-share">${share.map(([k, x]) => `<i style="flex-grow:${x.total};background:${STAGES[k].color}" data-tip="${esc(`${STAGES[k].label} · ${Math.round(x.share * 100)}% · ${fmtH(x.total)} in all`)}"></i>`).join('')}</div>
      <div class="flow-meds">${Object.entries(STAGES).map(([k, st]) => { const x = S.stages[k]; return `<div class="flow-med" data-tip="${esc(`${st.label} · median ${fmtH(x.median)} · p90 ${fmtH(x.p90)} · ${Math.round(x.share * 100)}% of all time`)}"><span class="nm"><i class="flow-sw" style="background:${st.color}"></i>${esc(st.label)}</span><span class="tr"><i style="width:${((x.median || 0) / medMax * 100).toFixed(1)}%;background:${st.color}"></i></span><span class="vl mono">${esc(fmtH(x.median))}</span></div>`; }).join('')}</div>
      <div class="faint flow-note">bars: median per PR · the stacked bar above: share of all the time</div>
    </article>`;
    // Every PR.
    const list = flows.filter(f => !state.flowFilter || f.neck === state.flowFilter);
    const maxTotal = Math.max(1, ...list.map(f => f.total));
    const when = t => new Date(t * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    html += `<article class="card wide" style="--sc:var(--accent)"><div class="ihead"><h3>Every merged PR</h3><span class="sub">newest first · click a row for its timeline</span></div>${filters}
      <div class="flow-legend">${Object.entries(STAGES).map(([, st]) => `<span><i class="flow-sw" style="background:${st.color}"></i>${esc(st.label)}</span>`).join('')}</div>
      <div class="flow-list">${list.map(f => {
        // One scale for all on a square root: waits range from minutes to weeks, and linear widths would turn most bars into dots.
        const open = state.flowOpen === f.number, width = state.flowScale === 'fit' ? 100 : Math.max(4, Math.sqrt(f.total / maxTotal) * 100);
        return `<div class="flow-row ${open ? 'open' : ''}" data-key="${f.number}" data-flow-open="${open ? '' : f.number}">
          <div class="flow-title">${ghAv(f.author, 'flow-av')}<a class="mono" href="${esc(safeUrl(f.url))}" target="_blank" rel="noopener noreferrer">#${f.number}</a><span class="t">${esc(subjectOf(f))}</span><span class="flow-total mono">${f.total ? esc(fmtH(f.total)) : `<span class="faint">${esc(fmtH(f.wall))} over a weekend</span>`}</span></div>
          <div class="flow-bar" style="width:${width.toFixed(1)}%">${f.segs.filter(sg => sg.w > 0).map(sg => `<i style="flex-grow:${sg.w};background:${STAGES[sg.s].color}" data-tip="${esc(`${STAGES[sg.s].label} · ${fmtH(sg.w)} · ${when(sg.a)} → ${when(sg.b)}`)}"></i>`).join('')}</div>
          ${open ? `<div class="flow-detail">${f.segs.map(sg => `<div><i class="flow-sw" style="background:${STAGES[sg.s].color}"></i><b>${esc(STAGES[sg.s].label)}</b><span class="mono">${esc(fmtH(sg.w))}</span><span class="faint">${esc(when(sg.a))} → ${esc(when(sg.b))}</span></div>`).join('')}</div>` : ''}
        </div>`;
      }).join('') || '<div class="faint">No PR matches.</div>'}</div>
    </article>`;
    return html + `</div>`;
  }

  // ---------------------------------------------------------------- rendering: Pull requests
  const BLOCKER_CHIPS = [['no-reviewer', 'No reviewer'], ['awaiting-author', 'Awaiting author'], ['awaiting-review', 'Awaiting review'], ['reviewers-silent', 'Reviewers silent'], ['approved-merge', 'Approved · merge'], ['needs-rebase', 'Needs rebase'], ['dormant', 'Dormant'], ['retarget', 'Base gone'], ['ci-blocked', 'Pipeline approval']];
  const bucketMatches = (bucket, want) => want === 'needs-rebase' ? (bucket === 'conflicts' || bucket === 'approved-behind') : bucket === want;
  function renderPRs(repo, d, viewer) {
    if (d.phase === 'none' || d.phase === 'core') return `<div class="section-title"><h2>Pull requests</h2><span class="sub">loading…</span></div><div class="prlist">${'<div class="sk sk-row"></div>'.repeat(6)}</div>`;
    const counts = { all: d.prs.length, green: 0, red: 0, running: 0, waiting: 0, nobuild: 0, conflicts: 0, mergeable: 0 };
    const bcounts = {};
    d.prs.forEach(pr => {
      const k = ciOf(pr); counts[k] = (counts[k] || 0) + 1;
      if (pr.mergeable === false) counts.conflicts++; if (pr.mergeable === true) counts.mergeable++;
      const b = classify(pr); for (const [c] of BLOCKER_CHIPS) if (bucketMatches(b, c)) bcounts[c] = (bcounts[c] || 0) + 1;
    });
    const hasMerge = d.prs.some(pr => pr.mergeable !== undefined);
    const hasHead = d.prs.some(pr => pr.headSha);
    const hasRv = d.prs.some(pr => pr.rv);
    const tiles = [
      ['all', 'Open PRs', 'var(--text-3)'], ['red', 'Failing', 'var(--bad)'], ['running', 'Running', 'var(--run)'],
      ['green', 'Passing', 'var(--good)'], ['waiting', 'Waiting', 'var(--warn)'], ['nobuild', 'No build', 'var(--none)'],
      ...(hasMerge ? [['conflicts', 'Conflicts', 'var(--bad)']] : []),
    ];
    let html = hasRv ? renderOwes(d) : '';
    html += `<div class="tiles" style="margin-top:0">${tiles.map(([k, l, c]) => `<button class="tile ${state.filter === k ? 'active' : ''}" style="--sc:${c}" data-filter="${k}"><span class="mark"></span><div><div class="num">${counts[k] || 0}</div><div class="lbl">${l}</div></div></button>`).join('')}</div>`;

    html += `<div class="section-title"><h2>Pull requests</h2><span class="sub">${PR_MODE_LABEL[d.prMode]}</span></div>`;
    const chips = [['all', 'All'], ['red', 'Failing'], ['running', 'Running'], ['green', 'Passing'], ['waiting', 'Waiting'], ['nobuild', 'No build'],
      ...(hasMerge ? [['mergeable', 'Mergeable'], ['conflicts', 'Conflicts']] : []), ...(hasHead ? [['stale', 'Outdated build']] : []), ['ready', 'Ready for review'], ['draft', 'Drafts']];
    html += `<div class="filters">
      ${chips.map(([k, l]) => `<button class="chip ${state.filter === k ? 'active' : ''}" data-filter="${k}">${l}</button>`).join('')}
      <input class="search" id="ob-search" placeholder="Filter by title, author, branch…" value="${esc(state.search)}">
    </div>`;
    if (hasRv) html += `<div class="filters blockers"><span class="faint" style="font-size:12px;margin-right:4px">Blocked on:</span>${BLOCKER_CHIPS.filter(([k]) => bcounts[k]).map(([k, l]) => `<button class="chip ${state.filter === 'b:' + k ? 'active' : ''}" data-filter="b:${k}">${l} <span class="faint">${bcounts[k]}</span></button>`).join('')}</div>`;

    const q = state.search.trim().toLowerCase();
    const list = d.prs.filter(pr => {
      const b = ciOf(pr);
      if (state.filter.startsWith('b:')) { if (!bucketMatches(classify(pr), state.filter.slice(2))) return false; }
      else if (state.filter === 'stale' && !pr.stale) return false;
      else if (state.filter === 'draft' && !pr.draft) return false;
      else if (state.filter === 'ready' && pr.draft) return false;
      else if (state.filter === 'mergeable' && pr.mergeable !== true) return false;
      else if (state.filter === 'conflicts' && pr.mergeable !== false) return false;
      else if (!['all', 'stale', 'draft', 'ready', 'mergeable', 'conflicts'].includes(state.filter) && b !== state.filter) return false;
      if (q && !`${pr.title} ${pr.author} ${pr.head} #${pr.number} ${(pr.requested || []).join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const order = { running: 0, red: 1, waiting: 2, nobuild: 3, green: 4, other: 5 };
    list.sort((a, b) => (order[ciOf(a)] - order[ciOf(b)]) || (b.updated - a.updated));

    html += `<div class="prlist">${list.length ? list.map(pr => prRow(pr, repo, viewer)).join('') : `<div class="empty">Nothing matches.</div>`}</div>`;
    return html;
  }

  // Only the anomaly is worth a tag; "mergeable" and "CI on head" are the normal state.
  function mergeTag(pr) {
    if (pr.mergeable === false) return `<span class="tag conflict" title="Merge conflicts with ${esc(pr.base || 'the base branch')}">Conflicts</span>`;
    return '';
  }

  // Blocker tag in the PR row: only the review-side buckets — CI state is the pill already.
  const BUCKET_TAGGED = ['approved-behind', 'approved-merge', 'approved-blocked', 'awaiting-author', 'no-reviewer', 'reviewers-silent', 'awaiting-review', 'dormant', 'retarget', 'ci-blocked'];
  // Where the action happens: the first open thread, or the PR page (reviewers panel, merge box).
  function actionUrl(pr, k) {
    if (k === 'awaiting-author' && pr.rv?.openList?.[0]?.url) return pr.rv.openList[0].url;
    return safeUrl(pr.url);
  }
  function bucketTag(pr) {
    const k = classify(pr);
    if (!BUCKET_TAGGED.includes(k)) return '';
    const b = BUCKETS[k], n = pr.rv?.openThreads || 0;
    const extra = k === 'awaiting-author' && n ? ` · ${n} open thread${n > 1 ? 's' : ''}` : '';
    const url = actionUrl(pr, k);
    return `<a class="tag bucket" style="--bc:${b.color}" href="${esc(url)}" target="_blank" rel="noopener noreferrer" title="${esc(b.imp)}${url && url !== safeUrl(pr.url) ? ' · opens the first unanswered thread' : ''}">${esc(b.label + extra)} ${ICONS.ext}</a>`;
  }
  // Reviewers as avatars: ring color = their latest state, dashed = requested and silent.
  function reviewerChips(pr) {
    const rv = pr.rv || {}, names = [...new Set([...(pr.requested || []), ...Object.keys(rv.reviews || {})])];
    if (!names.length) return '';
    const avatars = { ...(rv.avatars || {}), ...(pr.avatars || {}) };
    return `<span class="rvs" title="reviewers">${names.map(l => {
      const r = rv.reviews?.[l];
      const cls = !r ? 'asked' : r.state === 'approved' ? 'ok' : r.state === 'changes_requested' ? 'cr' : 'cm';
      const stateTxt = !r ? `requested${rv.requestedAt?.[l] ? ' ' + ago(rv.requestedAt[l]) : ''}, no review yet` : `${r.state.replace('_', ' ')} ${ago(r.at)}${(pr.requested || []).includes(l) ? ' · re-requested' : ''}`;
      const url = brokenImg.has(safeUrl(avatars[l])) ? '' : safeUrl(avatars[l]);
      return `<span class="rv ${cls}" title="${esc(l)}: ${esc(stateTxt)}">${url ? `<img src="${esc(url)}" alt="" data-initials="${esc(initials(l))}">` : `<i>${esc(initials(l))}</i>`}</span>`;
    }).join('')}</span>`;
  }
  function prRow(pr, repo, viewer = '', section = '') {
    const s = statusOf(pr.pipe);
    const p = pr.pipe;
    const task = reviewerTask(pr, viewer);
    const primary = classify(pr);
    const stuck = section ? stuckSince(pr, section, viewer) : stuckSince(pr, primary, viewer);
    const also = alsoTags(pr, section && BUCKETS[section] ? section : primary);
    return `<div class="pr ${s}" style="${sc(s)}" data-key="${repo.id}/${pr.number}" data-num="${pr.number}" data-pipe="${p ? p.number : ''}" data-sig="${p ? `${p.number}:${p.status}` : ''}:${pr.rv?.openThreads || 0}">
      ${avatar(pr.avatar, pr.author, s)}
      <div style="min-width:0">
        <div class="title">
          <a class="truncate" href="${esc(safeUrl(pr.url))}" target="_blank" rel="noopener noreferrer" title="${esc(pr.title)}">${esc(pr.title)}</a>
          ${pr.draft ? `<span class="tag draft">Draft</span>` : ''}
          ${isDNM(pr.title) ? `<span class="tag dnm">Do not merge</span>` : ''}
          ${mergeTag(pr)}
          ${pr.stale ? `<span class="tag stale" title="Latest CI run is for an older commit than the PR head">Outdated build</span>` : ''}
          ${(p?.errors || []).length ? `<span class="tag err">Config error</span>` : ''}
          ${bucketTag(pr)}
          ${task ? `<span class="tag task" title="${esc(REVIEWER_TASKS[task].imp)}">${task === 'review-me' ? 'Your review' : 'Re-review'}</span>` : ''}
          ${also.length ? `<span class="also">also: ${also.map(([c, t]) => `<span class="${c}">${esc(t)}</span>`).join(', ')}</span>` : ''}
        </div>
        <div class="sub">
          <span class="num">#${pr.number}</span>
          ${tickets(pr).map(([k, u]) => `<a class="ticket" href="${esc(u)}" target="_blank" rel="noopener noreferrer" title="Open ${esc(k)} in the tracker">${esc(k)} ${ICONS.ext}</a>`).join('')}
          <span>${esc(pr.author || '')}</span>
          <span class="br truncate" title="${esc(pr.head || '')} → ${esc(pr.base || '')}">${esc(pr.head || '')} <span class="faint">→ ${esc(pr.base || '')}</span></span>
          ${pr.updated ? agoEl(pr.updated, 'updated ') : ''}
          ${ageTag(stuck)}
          ${reviewerChips(pr)}
        </div>
      </div>
      <div class="right">
        ${p ? `<div class="stat"><b>${dur(p) || '—'}</b>${agoEl(p.finished || p.started || p.created, p.finished ? 'finished ' : 'started ')}</div>` : ''}
        ${pill(s)}
        ${p ? `<a class="plink" href="${pipeUrl(repo.id, p)}" target="_blank" rel="noopener" title="Open pipeline">#${p.number}</a>` : ''}
        <span class="chev">${ICONS.chev}</span>
      </div>
      <div class="pr-detail"><div class="faint" style="font-size:12px">Loading workflows…</div></div>
    </div>`;
  }

  async function fillDetail(row, repoId) {
    row._loadedSig = row.dataset.sig;   // a later patch refills only when this changes
    const box = $('.pr-detail', row);
    const num = +row.dataset.num, pnum = +row.dataset.pipe;
    const repo = state.repos.find(r => r.id === repoId);
    const pr = state.data[repoId].prs.find(x => x.number === num);
    const parts = [];
    if (!pnum) parts.push(`<div class="faint" style="font-size:12px">No pipeline has run for this PR yet.</div>`);
    else {
      const detail = await pipelineDetail(repoId, pnum);
      parts.push(steps(detail) || `<div class="faint" style="font-size:12px">No workflow details.</div>`);
      parts.push(hist(pr.runs.slice(0, HISTORY), pnum, repoId, true));
    }
    const open = pr.rv?.openList || [];
    if (open.length) parts.push(`<div class="threads"><div class="th">Unanswered review threads <span class="faint">${open.length}${pr.rv.openThreads > open.length ? ` of ${pr.rv.openThreads}` : ''}</span></div>${open.map(t =>
      `<a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer"><span class="mono truncate">${esc(t.path || 'conversation')}${t.line ? `:${t.line}` : ''}</span><span class="faint">${esc(shortLogin(t.who))} · ${ago(t.at)}${t.n > 1 ? ` · ${t.n} msgs` : ''}</span></a>`).join('')}</div>`);
    box.innerHTML = parts.join('');
    if (!pnum) return;
    const slot = document.createElement('div');
    slot.className = 'reports';
    slot.innerHTML = `<div class="faint" style="font-size:12px">Loading CI reports…</div>`;
    box.appendChild(slot);
    try {
      const { bench, cov, source } = await loadPrReports(repo, pr);
      const card = (title, rep, wantHeader) => {
        if (!rep) return `<div class="rep"><div class="rh">${title}<span class="faint">not available yet</span></div></div>`;
        const tbl = rep.tables.find(t => t.header.some(h => new RegExp(wantHeader, 'i').test(h))) || rep.tables[0];
        const stale = pnum && rep.pipeline && rep.pipeline !== pnum;
        return `<div class="rep"><div class="rh">${title}<span class="faint">pipeline <a class="mono" href="${esc(rep.url && rep.url.startsWith(state.cfg.server + '/') ? rep.url : pipeUrl(repoId, { number: rep.pipeline }))}" target="_blank" rel="noopener">#${rep.pipeline ?? '?'}</a>${stale ? ` · <span class="tag stale" style="font-size:10px">older than latest run</span>` : ''}</span>${rep.links.length ? `<a href="${esc(safeUrl(rep.links[0].url))}" target="_blank" rel="noopener noreferrer">${esc(rep.links[0].text)} ${ICONS.ext}</a>` : ''}</div>${reportTable(tbl)}</div>`;
      };
      if (!bench && !cov) { slot.remove(); return; }   // this repo's CI posts no report tables
      slot.innerHTML = card('Benchmarks vs main', bench, '^Master$') + card('Coverage vs main', cov, '^Coverage$') + `<div class="faint" style="flex-basis:100%;font-size:11px">from ${esc(source)}</div>`;
    } catch (e) {
      slot.innerHTML = `<div class="faint" style="font-size:12px">Could not load CI reports: ${esc(e.message)}</div>`;
    }
  }

  // "owner/name" with the owner in its own span so phones can drop it.
  const repoLabel = full => { const i = full.indexOf('/'); return `<span class="name">${i < 0 ? esc(full) : `<span class="org">${esc(full.slice(0, i + 1))}</span>${esc(full.slice(i + 1))}`}</span>`; };
  function renderRepoTabs() {
    const tabs = el('repos');
    tabs.hidden = state.repos.length < 2;
    setHtml(tabs, state.repos.map(r => {
      const d = state.data[r.id];
      const s = statusOf(d?.main);
      const red = d ? d.prs.filter(p => ciOf(p) === 'red').length : 0;
      return `<button class="tab ${String(r.id) === state.tab ? 'active' : ''}" data-tab="${r.id}"><span class="dot" style="background:${st(s).color}" title="${esc(r.default_branch)}: ${st(s).label}"></span>${repoLabel(r.full_name)}<span class="cnt" title="open PRs · failing">${d && d.phase !== 'none' && d.phase !== 'core' ? d.prs.length : '…'}${red ? ` · <span style="color:var(--bad)">${red}✗</span>` : ''}</span></button>`;
    }).join(''));
  }

  const notice = (html, err = false) => `<div class="notice ${err ? 'err' : ''}">${ICONS.warn}<div>${html}</div></div>`;
  function renderSkeleton() {
    el('hero').innerHTML = `<div class="section-title" style="margin-top:0"><h2>Latest</h2></div><div class="hero-grid"><div class="sk sk-card"></div><div class="sk sk-card"></div></div>`;
    el('content').innerHTML = `<div class="section-title"><h2>What to do</h2></div><div class="prlist">${'<div class="sk sk-row"></div>'.repeat(6)}</div>`;
  }
  function renderNeedsConfig() {
    el('tabs').hidden = true; el('hero').innerHTML = '';
    el('notices').innerHTML = '';
    el('content').innerHTML = `<div class="card" style="padding:40px;text-align:center;--sc:var(--accent)">
      <div style="font-size:20px;font-weight:700;margin-bottom:6px">Connect to Woodpecker</div>
      <p class="muted" style="max-width:460px;margin:0 auto 18px">Add a Woodpecker API token to see the latest build of the default branch, the nightly cron, and every open pull request. A GitHub token is optional.</p>
      <button class="btn primary" data-open-settings>Open settings</button></div>`;
  }
  function renderNeedsLogin() {
    el('tabs').hidden = true; el('hero').innerHTML = '';
    el('notices').innerHTML = '';
    el('content').innerHTML = `<div class="card" style="padding:40px;text-align:center;--sc:var(--accent)">
      <div style="font-size:20px;font-weight:700;margin-bottom:6px">Log in to Woodpecker</div>
      <p class="muted" style="max-width:460px;margin:0 auto 18px">The board uses your Woodpecker session to read builds, pull requests and the CI reports. Nothing else to configure.</p>
      <a class="btn primary" href="${RP}/login?url=${encodeURIComponent(BOARD_PATH)}">Log in</a></div>`;
  }
  function renderError(e) {
    const auth = e.status === 401, denied = e.status === 403;
    const title = auth ? (EMBEDDED ? 'Woodpecker session expired.' : 'Woodpecker rejected the token.')
      : denied ? 'Woodpecker denied access.' : 'Could not load data.';
    const fix = auth ? (EMBEDDED ? ` — <a href="${RP}/login?url=${encodeURIComponent(BOARD_PATH)}">log in again</a>` : ' — <button class="link" data-open-settings>fix in settings</button>')
      : denied ? (EMBEDDED ? ' — your Woodpecker user lacks permission for this request.' : ' — the token lacks permission for this request.') : '';
    el('notices').innerHTML = notice(`<b>${title}</b> ${esc(e.message)}${fix}`, true);
    if (!state.repos.length) el('content').innerHTML = '';
  }

  // ---------------------------------------------------------------- settings
  const dlg = el('settings');
  function openSettings() {
    el('fServer').value = state.cfg.server; el('fWp').value = state.cfg.wpToken; el('fGh').value = state.cfg.ghToken; el('fPg').value = state.cfg.reportsBase || ''; el('fViewer').value = state.cfg.viewer || '';
    el('fPg').disabled = !REPORTS_HOST || location.hostname === REPORTS_HOST;
    dlg.showModal();
  }
  el('btnSettings').onclick = openSettings;
  el('btnCancel').onclick = () => dlg.close();
  el('settingsForm').onsubmit = () => {
    if (!EMBEDDED) {
      state.cfg.server = (el('fServer').value.trim() || DEFAULT_SERVER).replace(/\/+$/, '');
      state.cfg.wpToken = el('fWp').value.trim();
      state.cfg.reportsBase = el('fPg').value.trim();
      state.cfg.viewer = el('fViewer').value.trim();
      state.viewer = state.cfg.viewer;
    }
    state.cfg.ghToken = el('fGh').value.trim();
    saveCfg(); state.repos = []; state.data = {}; state.insights = null; state.insightsP = null; state.lastSig = ''; detailCache.clear(); prReportCache.clear(); pc.pipes = {}; pc.merge = {}; pc.meta = {}; pc.repos = null; pcSave();
    if (state.stream) { state.stream.close(); state.stream = null; state.live = false; }
    loadAll();
  };
  el('btnRefresh').onclick = () => loadAll();
  el('btnTheme').onclick = toggleTheme;
  // Everything inside the patched regions is handled by delegation, wired once:
  // the DOM is patched in place, so per-render handler assignment would either
  // stack up or miss nodes that were kept.
  function wire() {
    const on = (host, type, fn, capture = false) => host.addEventListener(type, fn, capture);
    on(el('repos'), 'click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; state.tab = b.dataset.tab; try { localStorage.setItem(LS + ':tab', state.tab); } catch {} render(true); });
    on(el('tabs'), 'click', e => { const b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); });
    on(el('hero'), 'click', e => { if (!e.target.closest('[data-hero-toggle]')) return; state.heroOpen = !state.heroOpen; try { localStorage.setItem(LS + ':hero', state.heroOpen ? 'open' : 'strip'); } catch {} render(true); });
    on(el('notices'), 'click', e => { if (e.target.closest('[data-open-settings]')) openSettings(); });
    const content = el('content');
    on(content, 'click', e => {
      const t = e.target;
      let b;
      if ((b = t.closest('[data-filter]'))) { state.filter = b.dataset.filter; render(true); return; }
      if ((b = t.closest('[data-view-link]'))) { setView(b.dataset.viewLink); return; }
      if ((b = t.closest('[data-flow-scale]'))) { state.flowScale = b.dataset.flowScale; render(true); return; }
      if ((b = t.closest('[data-flow-filter]'))) { state.flowFilter = b.dataset.flowFilter; render(true); return; }
      if ((b = t.closest('[data-flow-open]')) && !t.closest('a')) { state.flowOpen = +b.dataset.flowOpen || 0; render(true); return; }
      if ((b = t.closest('[data-week]'))) { state.week = Math.max(0, state.week + (b.dataset.week === 'older' ? 1 : -1)); render(true); return; }
      if ((b = t.closest('[data-copy]'))) { copyDigest(b); return; }
      if ((b = t.closest('[data-wx-events]'))) { state.wxEvents = b.dataset.wxEvents; render(true); return; }
      if ((b = t.closest('[data-wx-step]'))) { state.wxStep = b.dataset.wxStep; render(true); return; }
      if ((b = t.closest('[data-mins-by]'))) { state.minsBy = b.dataset.minsBy; render(true); return; }
      if ((b = t.closest('[data-mins-wf]'))) { state.minsWf = b.dataset.minsWf; render(true); return; }
      if ((b = t.closest('[data-streak-as]'))) { state.viewAs = b.dataset.streakAs === state.viewer ? '' : b.dataset.streakAs; render(true); return; }
      if ((b = t.closest('[data-viewas]'))) { state.viewAs = b.dataset.viewas === state.viewer ? '' : b.dataset.viewas; setView('actions'); return; }
      if (t.closest('[data-open-settings]')) { openSettings(); return; }
      const row = t.closest('.pr');
      if (!row || t.closest('a, select')) return;
      row.classList.toggle('open');
      if (row.classList.contains('open')) fillDetail(row, +state.tab);
    });
    // Hover tips for [data-tip] (the Streaks tab): one floating label on the root, so a card's overflow never clips it.
    const tip = document.createElement('div');
    tip.className = 'bw-tip'; root.appendChild(tip);
    const hideTip = () => tip.classList.remove('on');
    on(content, 'mouseover', e => {
      const t = e.target.closest('[data-tip]');
      if (!t) { hideTip(); return; }
      const r = t.getBoundingClientRect();
      tip.textContent = t.dataset.tip;
      tip.style.left = `${Math.min(innerWidth - 150, Math.max(150, r.left + r.width / 2))}px`;
      tip.style.top = `${r.top}px`;
      tip.classList.add('on');
    });
    on(content, 'mouseleave', hideTip);
    window.addEventListener('scroll', hideTip, { passive: true });
    on(content, 'input', e => { if (e.target.id === 'ob-search') { state.search = e.target.value; render(true); } });
    on(content, 'change', e => { if (e.target.id === 'ob-viewas') { state.viewAs = e.target.value; render(true); } });
    // A broken avatar becomes initials (and stays initials, see brokenImg); any other broken image just disappears.
    on(root, 'error', e => {
      const img = e.target;
      if (!(img instanceof HTMLImageElement)) return;
      brokenImg.add(img.getAttribute('src') || '');
      if (!img.dataset.initials) { img.hidden = true; return; }
      const inAvatar = !!img.closest('.avatar');
      const fb = document.createElement(inAvatar ? 'div' : 'i');
      if (inAvatar) fb.className = 'initials';
      fb.textContent = img.dataset.initials || '?';
      img.replaceWith(fb);
    }, true);
  }
  document.addEventListener('keydown', e => {
    if (dlg.open || e.target.matches('input, textarea')) return;
    if (e.key === 'r') loadAll();
    if (e.key === 't') toggleTheme();
    if (e.key === ',' && !EMBEDDED) openSettings();
  });

  // ---------------------------------------------------------------- live events
  // Woodpecker pushes every pipeline change over SSE (/api/stream/events); a
  // change to a repo just reloads that repo's data and re-renders if anything
  // visible moved. The poll below stays as a safety net, stretched while live.
  const period = () => state.live ? REFRESH_LIVE_SEC : REFRESH_SEC;
  function connectStream() {
    if (state.stream || typeof EventSource === 'undefined') return;
    const url = EMBEDDED ? `${RP}/api/stream/events` : `${state.cfg.server}/api/stream/events?access_token=${encodeURIComponent(state.cfg.wpToken)}`;
    const es = new EventSource(url, { withCredentials: EMBEDDED });
    state.stream = es;
    es.onopen = () => { state.live = true; state.left = Math.max(state.left, period()); stampUpdated(); };   // live: the poll is only a safety net
    es.onerror = () => { state.live = false; stampUpdated(); };   // EventSource reconnects on its own
    es.onmessage = ev => {
      let d; try { d = JSON.parse(ev.data); } catch { return; }
      const repoId = d?.repo?.id ?? d?.pipeline?.repo_id;
      if (repoId == null) return;
      if (applyEvent(repoId, d.pipeline)) return;          // patched in place
      state.pending.add(repoId);
      clearTimeout(state.pendingTimer);
      state.pendingTimer = setTimeout(flushPending, 1500);   // coalesce bursts (one pipeline = many events)
    };
  }
  // Patch one pipeline into the state instead of reloading the repo. Returns
  // false only when the event needs the full reload (unknown PR, new cron, no
  // data yet). Woodpecker emits an event per step change of every pipeline,
  // including the manual validation runs of main the board doesn't show —
  // those must not turn into a reload each, or the page refreshes non-stop.
  function applyEvent(repoId, p) {
    const repo = state.repos.find(r => r.id === repoId), d = state.data[repoId];
    if (!repo || !d || !p || d.phase !== 'meta') return false;   // a load in progress is patched too: it re-reads the same data anyway
    const upsert = (runs, pipe) => {
      const t = trimPipe(pipe), i = runs.findIndex(x => x.number === t.number);
      if (i >= 0) runs[i] = t; else if (!runs.length || t.number > runs[0].number) runs.unshift(t); else return null;
      return runs[0];
    };
    const finished = !LIVE.includes(p.status);
    if (p.event === 'pull_request') {
      const n = prNumOf(p), pr = d.prs.find(x => x.number === n);
      if (!pr) return false;
      const wasHead = pr.pipe?.number;
      const latest = upsert(pr.runs, p); if (!latest) return true;
      pr.pipe = latest; pr.stale = !!(pr.pipe && pr.headSha && pr.pipe.commit !== pr.headSha);
      pr.runs = dropSuperseded(pr.runs); if (pr.runs.length > HISTORY) pr.runs.length = HISTORY;
      pc.pipes[`${repoId}/${n}`] = { headSha: pr.headSha, runs: pr.runs.slice(0, HISTORY) }; pcSave();
      if (finished) detailCache.delete(`${repoId}/${p.number}`);
      if (finished && wasHead !== latest.number) prReportCache.clear();
    } else if (p.event === 'push' && p.branch === repo.default_branch) {
      const latest = upsert(d.mainHist, p); if (!latest) return true;
      const newMain = d.main?.number !== latest.number;
      d.main = latest; d.mainHist = dropSuperseded(d.mainHist); if (d.mainHist.length > HISTORY) d.mainHist.length = HISTORY;
      detailCache.delete(`${repoId}/${p.number}`);
      pipelineDetail(repoId, latest.number).then(x => { latest._detail = x; scheduleRender(); });
      if (newMain && d.prMode === 'github') pmap(d.prs, META_PARALLEL, pr => mergeInfo(repo, pr, latest.commit || '').then(scheduleRender));
    } else if (p.event === 'cron') {
      const c = d.crons.find(x => x.def.name === p.sender);
      if (!c) return false;
      const latest = upsert(c.hist, p); if (!latest) return true;
      c.latest = latest; if (c.hist.length > HISTORY) c.hist.length = HISTORY;
      detailCache.delete(`${repoId}/${p.number}`);
      pipelineDetail(repoId, latest.number).then(x => { latest._detail = x; scheduleRender(); });
    } else return true;   // manual / deployment / tag runs, pushes to other branches: nothing on screen depends on them
    stampUpdated();
    scheduleRender();
    return true;
  }
  async function flushPending() {
    if (state.loading) { state.pendingTimer = setTimeout(flushPending, 1500); return; }
    const ids = [...state.pending]; state.pending.clear();
    const repos = state.repos.filter(r => ids.includes(r.id));
    if (!repos.length) return;
    await Promise.all(repos.map(r => loadRepo(r)));
    stampUpdated();
    render();
    state.left = period();
  }
  function stampUpdated() {
    el('updatedAt').innerHTML = `${state.live ? '<span class="live" title="Live: Woodpecker pushes pipeline events; the periodic poll is a safety net"></span>' : ''}updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }

  // ---------------------------------------------------------------- refresh loop
  function tick() {
    if (!state.loading && (EMBEDDED ? !!window.WOODPECKER_USER : !!state.cfg.wpToken)) {
      state.left -= 1;
      if (state.left <= 0) { state.left = period(); loadAll(); }
    }
    const frac = state.left / period();
    el('ringProg').style.strokeDashoffset = String(56.5 * (1 - Math.max(0, Math.min(1, frac))));
    if (state.left % 30 === 0 && state.repos.length && !state.loading) refreshAgo();
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !state.live && state.left < REFRESH_SEC / 2) loadAll(); });

  loadCfg();
  applyTheme();
  wire();
  loadAll();
  state.timer = setInterval(tick, 1000);

})();
