# Deck — Build Log

Running log of the autonomous build-out, newest first. So you can see exactly
what shipped while you were away.

---

## ✅ Session summary — v1 is built (2026-07-12)

**Backlog is complete.** Deck is a real, working, discoverable product:

- **Working CLI** — `status · restore [--only] · snapshot · backup · doctor · install`. Deterministic PID-based session capture (no mtime guessing). Runs green on a real machine.
- **Cross-platform** — WezTerm (Windows) **and** tmux (macOS/Linux) back-ends, selected by config. POSIX process walk-up + graceful degradation, never crashes when a back-end is absent.
- **Quality** — 10 passing tests (zero deps), CI on ubuntu+windows × node 18/20/22, `deck doctor` self-diagnostic.
- **Go-to-market** — polished landing page with a real Formspree waitlist, GitHub Pages auto-deploy, Show HN / r/ClaudeAI / Discord launch drafts, a 30-second demo doc, badges, CONTRIBUTING.
- **Repo:** https://github.com/nodesoftwaresolutions/claude-deck — ~10 commits, all pushed.

### What's left for you (3 quick, all optional)
1. **Make the landing page live** — repo Settings → Pages → Source: **GitHub Actions** (workflow is already wired). Instant URL.
2. **Wire the waitlist** — create a free form at formspree.io, replace `YOUR_FORM_ID` in `site/index.html`. Then it captures real emails.
3. **Publish to npm** (makes `npm i -g claude-deck` real): `npm login && npm publish` from `C:/Dev/claude-deck`. Needs your npm account — I left it for you on purpose.

Then post the launch drafts (`docs/launch/`) and you're discoverable. Future product work (Zellij/Windows-Terminal back-ends, other agent CLIs, the paid cloud-sync tier) is in the roadmap in README.

---

## Session 1 (2026-07-12)

**Shipped**
- ✅ Core product: `deck` CLI (status / snapshot / restore / backup / install / hook), deterministic PID-based session capture, additive transcript backup. Runs green on a real 14-session machine.
- ✅ Landing page (`site/index.html`) — polished static page, S3/Pages-ready, with hero, terminal demo, features, how-it-works, pricing (Free + Pro cloud-sync waitlist), CTA.
- ✅ `site/deploy-s3.mjs` — one-command S3 + CloudFront deploy.
- ✅ Test suite (`test/deck.test.mjs`, `node:test`, zero deps) — 5 passing.
- ✅ CI (`.github/workflows/ci.yml`) — syntax-check + tests on ubuntu/windows × node 18/20/22.
- ✅ Pages auto-deploy (`.github/workflows/pages.yml`) — publishes the landing page on every push.
- ✅ Fixed restore bug — GUI path now actually runs `claude --resume` per session.
- ✅ CONTRIBUTING.md, README badges, MIT LICENSE.

**Shipped (cont.)**
- ✅ `deck doctor` — 6-check diagnostic (hooks wired, config, snapshots running, sessions self-registering, backup healthy, terminal back-end) with per-check fixes.
- ✅ npm publish readiness — `npm pack` verified clean (15kB, bin+src+README+LICENSE only, no test/site cruft). Ready to `npm publish`.
- ✅ Launch-post drafts — `docs/launch/`: Show HN, r/ClaudeAI, Claude Code Discord.

**Shipped (cont.)**
- ✅ POSIX hardening — `proc.mjs` refactor: configurable agent process name (`DECK_AGENT_PROCESS`), timeouts on every process call, `liveAgentPids` never throws (empty Set on failure), cross-platform ancestor walk-up. `restore` now returns a clean "terminal back-end not found" guard instead of crashing when WezTerm is absent. +2 tests.

**Shipped (cont.)**
- ✅ Real email-capture waitlist on the landing page — Formspree-backed form with async submit + success/error states, graceful "not wired yet" message until you paste a form id. **One step for you:** create a free form at formspree.io and replace `YOUR_FORM_ID` in `site/index.html`.

**Shipped (cont.)**
- ✅ `deck restore --only <id,id>` — bring back a subset of sessions (matches the 8-char ids from `--dry-run`). Verified filtering 11→1.

**Shipped (cont.)**
- ✅ Second terminal back-end: **tmux** (`src/tmux.mjs`) with the same interface as wezterm, plus a `src/terminal.mjs` selector chosen by `config.terminal`. Refactored status/restore/doctor to be back-end-agnostic. Proves Deck isn't WezTerm-only → opens the whole macOS/Linux market. +2 tests (tmux parser + selector). Windows/wezterm path unchanged + verified.

**Shipped (cont.)**
- ✅ Demo doc (`docs/DEMO.md`) — scripted `status` → restart → `restore` → `doctor` walkthrough with real output; linked from the README. (A GIF isn't feasible headlessly; the doc is the substitute.)

**Blocked on you (not attempted, by design)**
- ⏸ `npm publish` — needs your npm account: `npm login && npm publish` from the repo. Package is verified publish-ready.

**Decisions parked for you**
- Landing page hosting: GitHub Pages (free, one toggle) vs S3+CloudFront (custom domain, your AWS). Pages workflow is wired; enable it in Settings → Pages → Source: GitHub Actions for an instant live URL.
- Paid-tier billing: Stripe vs Paddle/Lemon Squeezy (LS handles VAT/MoR — lower ops for a solo founder).
- Custom domain for the landing page + product.
