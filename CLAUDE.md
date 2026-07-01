# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static promo landing page for **ПОКЕРОК** (online poker brand), theme «Жаркое лето,
яркие бонусы». No framework, no build step, no package manager — plain HTML/CSS/JS
served as-is. Deployed via **GitHub Pages "from branch"** (root of `main`); `.nojekyll`
disables Jekyll processing.

There are **two independent pages**, each with its own CSS + JS:

- **`index.html`** — the flagship: a scroll-driven 3-act panorama ("descend the yacht":
  deck → narrow metal passage → cabin). Uses `assets/css/styles.css` + `assets/js/panorama.js`
  plus vendored GSAP/ScrollTrigger/Lenis.
- **`single.html`** — a one-screen poster variant (no scroll-jack), all content in one
  viewport + footer payment bar. Uses `assets/css/single.css` + `assets/js/single.js`.
  This is a lighter alternative, not a refactor of `index.html` — keep the two in sync
  manually only when the user asks.

## Commands

There is no build/lint/test toolchain. To preview locally:

```bash
python3 -m http.server 8099   # then open http://localhost:8099/index.html or /single.html
```

Browser checks (Chromium + Playwright are available) are **not** run by default — only
when explicitly requested.

## Architecture — `index.html` panorama (`assets/js/panorama.js`)

The whole descent is driven by **one seamless background image** (`assets/scenes/panorama.webp`,
2560×7532), not multiple scenes. Mechanics:

- A `sticky` stage is pinned; scroll progress `0..1` (via GSAP **ScrollTrigger** `scrub`,
  smoothed by **Lenis**) pans the single strip vertically.
- Three focal points are fractions of the image height: `DECK_F` / `METAL_F` / `CABIN_F`
  at the top of `panorama.js`. Progress is split at `0.5` and lerped between these so each
  act sits centered. Tuning the framing = adjusting these constants.
- The narrow-passage feeling is a `smooth()` bump peaking at progress `0.5`: it grows a
  letterbox (`.lb-top`/`.lb-bot`) and a horizontal `sway`. Content panels
  (`#deck-panel` / `#passage-panel` / `#cabin-panel`) translate up in lockstep with the pan.
- **`prefers-reduced-motion` / no-GSAP fallback** (early `return` in `panorama.js`): the page
  degrades to a normal stacked scroll, counters fill instantly. Always preserve this branch.
- Cross-cutting widgets, also present in `single.js`: `countUp()` for `[data-count]`
  (`data-prefix`/`data-suffix`/`data-group` attrs), the FOMO countdown (60-min personal
  deadline in `localStorage` key `pokerok_fomo_deadline`, soft-restart, never shows 00:00),
  and live social-proof counters (`#ls-players`/`#ls-paid`) that drift upward over time.

`assets/css/styles.css` is organized by these acts with banner comments
(`STICKY HEADER` / `BACKGROUND PANORAMA` / `ACT 1 DECK` / `ACT 2 PASSAGE` / `ACT 3 CABIN`
/ `FOOTER`) and a CSS-variable palette in `:root`. Payment icons are an inline monochrome
SVG sprite (`#pay-*`, `currentColor`) reused across both pages.

## Brand rules (from `docs/landing-improvement-plan.md` + logobook — must hold)

`docs/landing-improvement-plan.md` is the source of truth for brand + content/ТЗ checklist.
Non-negotiable:

- The **ПОКЕРОК wordmark stays monochrome** — no distortion, rotation, color fill,
  per-letter gradient, drop-shadow, or letter outline. The only allowed stylization is a
  soft **glow around** the sign (not the letters), poker-red `#E71F43`.
- Mascots are the yellow 3D emoji (👍 approving, 🤭 hush) and replace the «О» in `ПОКЕР_К`
  or stack into «ОК». Stickers in `assets/mascots/` (`*.webp` + `*.png` fallback) map to
  meaning: $-eyes→bonus, chips→prize pool, fire→WSOP, 👍→formats.
- Palette: `--red #E71F43`, `--red-deep #C01935`, `--black #080808`, white; gold sums
  `#FFD24A`. Fonts: **Montserrat** (headings) + **Raleway** (body).
- Visual hierarchy is intentional: interactive elements (register CTA, clickable pillar
  icons) are most prominent; the cabin "reason" cards are deliberately **non-interactive**
  (no hover lift). Don't make cabin cards look like buttons.
- Placeholder links are `./` on purpose (this is a test-task mockup).

## Working conventions (user-requested)

- **Scope discipline:** do only the change asked. If you spot an unrelated problem, report
  it in text — don't fix it as part of the current task. Don't run tests/servers/Playwright
  unless explicitly requested.
- **Images:** don't open images with Read/view just to "check" them. A path/filename is
  enough to reference an image in HTML/CSS. Use `file` / `identify` (imagemagick) for
  dimensions/format. Don't re-open an image already viewed this session.
- **Git / GitHub:** `main` is sometimes updated in parallel from other sessions or directly
  via the GitHub API, so it can diverge without warning. When updating via the GitHub API,
  fetch the current file SHA (GET) before PUT-ing base64 content, and update files one at a
  time, checking each step.
- **Auto-push (user-requested for this repo — "пуш автоматически"):** after making the
  requested change, commit **and** push to `main` automatically — but always `git fetch`
  and check divergence **first**. Only push when `IN SYNC` or `AHEAD` (fast-forward). If
  `BEHIND` or `DIVERGED`, **stop and report** — never auto-rebase, reset, or force-push.
  Divergence check:
  ```bash
  git fetch origin main -q
  L=$(git rev-parse @); R=$(git rev-parse origin/main); B=$(git merge-base @ origin/main)
  [ "$L" = "$R" ] && echo SYNC || { [ "$R" = "$B" ] && echo AHEAD || { [ "$L" = "$B" ] && echo BEHIND || echo DIVERGED; }; }
  ```
- Sign commits with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Deploy — GitHub Pages lag (important when "verifying" a fix)

Pages deploys from `main` but **the live site lags a push by ~1–2 min** (build + CDN cache):
right after pushing, `single.css`/HTML on `serafimkhristenko.github.io/pokerok` still serve
the **previous** commit. So when a user reports "the change isn't there," **do not assume a
code bug** — first confirm what's actually live:

```bash
# cache-busted fetch of the live CSS
curl -s "https://serafimkhristenko.github.io/pokerok/assets/css/single.css?v=$(date +%s)" | grep -o '<some-rule-you-just-added>'
# build status + which commit is built
gh api repos/serafimkhristenko/pokerok/pages/builds/latest --jq '.status+" "+.commit[0:7]'
```
If the live CSS lacks your rule and the build is `building`/on the old SHA, the code is fine —
tell the user to hard-refresh (Ctrl+F5) once it's `built`.

## Local preview & headless screenshots (this Windows machine)

Repo is checked out at `D:\pokerok`. Preview + verify visually without asking:

```bash
(cd /d/pokerok && python -m http.server 8099 >/dev/null 2>&1 &); sleep 1
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu \
  --hide-scrollbars --window-size=1920,960 \
  --screenshot="<scratchpad>/shot.png" "http://localhost:8099/single.html"
```
Notes learned the hard way: `--force-device-scale-factor=2` can render **blank** (use dsf=1);
`<img src=file://…>` fails (`ERR_FILE_NOT_FOUND`) — serve over http instead; a mobile
`--window-size=390,…` gets clamped to ~482 CSS px, so "cut-off" edges in a mobile shot are
often a screenshot artifact, not a real overflow — sanity-check at width ≥500.

## `single.html` footer (current layout, after 2026-07 rework)

Structure: `.site-footer > .footer-bar > { .footer-brand , .footer-pays }`, where
`.footer-pays` wraps `.pay-row--crypto` (7 wordmark crypto icons, `.pay-i--crypto` 30px) and
`.pay-row--cards` (7 card/wallet icons, `.pay-i` 18px). Icons live in `assets/pay/*.svg`
(monochrome, `currentColor`-ish). Layout rules:
- `.footer-bar` is `display:flex; justify-content:center` inside `max-width:1320px; margin:0
  auto`, so **both icon groups center on the page axis**.
- `.footer-brand` is **taken out of flow** (`position:absolute; left:clamp(14px,2.5vw,34px);
  bottom:16px`, anchored to the full-width `.site-footer`) so it doesn't push the icons
  off-center. It's a row `[18+] ПОКЕРОК`: the wordmark sits on the bottom strip and the red
  `.age-badge` is moved left of it via `order:-1`.
- A true single 14-icon row doesn't fit even at 1920px (crypto logos carry wordmarks), so it
  intentionally wraps to two centered rows — this is the agreed fallback, not a bug.
- Mobile (`@media max-width:640px`): `.footer-bar` becomes a centered column and
  `.footer-brand` returns to `position:static`.

## Figma UI kit (design system mirror of this site)

A component library built from this site lives in Figma file `inEgIu1dorY0ScPJM9bdPA`
("POKEROK — UI Kit", Anna Alemasova / My Team, Pro). It has foundations (color/type/effect
variables), payment icons, mascot **Sticker** components, and a **Pillar Card** set with 4
variants on a `Pillar` axis (Bonus/Prize/WSOP/Formats). Use the Figma MCP (`use_figma`,
`get_screenshot`, etc.) and the `/figma-*` skills when extending it.
