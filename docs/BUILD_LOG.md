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

**Queued (in priority order)**
- [ ] npm publish readiness — verify `npm pack` contents, add a `prepublishOnly` guard, publish `claude-deck@0.1.0`.
- [ ] `deck doctor` — diagnose a broken install (hooks not wired, no snapshots, backup stale).
- [ ] Demo asset — a scripted asciinema/GIF of `status` → restart → `restore` for the README + landing hero.
- [ ] POSIX hardening — exercise the `ps` walk-up + `pgrep` path; make status/backup degrade gracefully with no WezTerm.
- [ ] Second terminal back-end — Windows Terminal or tmux (proves it's not WezTerm-only).
- [ ] Launch post drafts — r/ClaudeAI, HN "Show HN", the Claude Code Discord.
- [ ] Waitlist that actually captures emails (Formspree/Tally embed) instead of a mailto.
- [ ] `deck restore --pick` — interactive selection of which sessions to bring back.

**Decisions parked for you**
- Landing page hosting: GitHub Pages (free, one toggle) vs S3+CloudFront (custom domain, your AWS). Pages workflow is wired; enable it in Settings → Pages → Source: GitHub Actions for an instant live URL.
- Paid-tier billing: Stripe vs Paddle/Lemon Squeezy (LS handles VAT/MoR — lower ops for a solo founder).
- Custom domain for the landing page + product.
