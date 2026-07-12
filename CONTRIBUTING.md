# Contributing to Deck

Thanks for helping make terminal AI-agent restarts a non-event.

## Dev setup

```bash
git clone https://github.com/nodesoftwaresolutions/claude-deck
cd claude-deck
node --test test/        # run the suite (no dependencies)
node bin/deck.mjs status # exercise the CLI
```

Deck is dependency-free on purpose — it uses only Node's standard library so it
installs instantly and can't rot. Please keep it that way unless there's a very
good reason.

## Where things live

| Path | What |
|---|---|
| `bin/deck.mjs` | CLI dispatcher |
| `src/record.mjs` | the SessionStart/Stop hook that stamps each session's pid |
| `src/snapshot.mjs` | captures live sessions (deterministic, pid-based) |
| `src/restore.mjs` + `src/wezterm.mjs` | rebuild the grid |
| `src/backup.mjs` | additive transcript mirror |
| `src/status.mjs` | the `deck status` report |
| `site/` | the landing page |
| `test/` | `node:test` suite |

## High-value contributions

- **New terminal back-ends** — tmux, Zellij, Windows Terminal, Kitty. `wezterm.mjs`
  is the reference; the interface is `listPanes()` + `restoreGrid()`.
- **POSIX process walk-up** — `proc.mjs` has a `ps`-based path; battle-test it on
  macOS/Linux.
- **Other agent CLIs** — Codex, Aider, Cursor CLI store transcripts differently;
  generalise `transcripts.mjs`.

## Ground rules

- Keep the standard-library-only constraint.
- Add a test for any logic change (`test/deck.test.mjs`).
- `node --check` must pass on every file (CI enforces it).
- Small, focused PRs.

By contributing you agree your work is released under the MIT license.
