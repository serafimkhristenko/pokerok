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
  via the GitHub API, so it can diverge without warning. Before any reconciliation, **report
  status first and let the user decide** how to resolve divergences — never auto-rebase,
  reset, or force-push. When updating via the GitHub API, fetch the current file SHA (GET)
  before PUT-ing base64 content, and update files one at a time, checking each step.
