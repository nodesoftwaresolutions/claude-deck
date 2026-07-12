# Deck — Build Log

Running log of the autonomous build-out, newest first. So you can see exactly
what shipped while you were away.

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

**Queued (in priority order)**
- [ ] Second terminal back-end — Windows Terminal or tmux (proves it's not WezTerm-only).
- [ ] Demo asset — a scripted asciinema/GIF of `status` → restart → `restore`.
- [ ] `npm publish` the package (needs an npm token — one command once you're set up).

**Decisions parked for you**
- Landing page hosting: GitHub Pages (free, one toggle) vs S3+CloudFront (custom domain, your AWS). Pages workflow is wired; enable it in Settings → Pages → Source: GitHub Actions for an instant live URL.
- Paid-tier billing: Stripe vs Paddle/Lemon Squeezy (LS handles VAT/MoR — lower ops for a solo founder).
- Custom domain for the landing page + product.
