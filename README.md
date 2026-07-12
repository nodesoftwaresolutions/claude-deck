# Deck 🃏

**Never lose your Claude Code sessions again.**

[![CI](https://github.com/nodesoftwaresolutions/claude-deck/actions/workflows/ci.yml/badge.svg)](https://github.com/nodesoftwaresolutions/claude-deck/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-6ee7b7.svg)](./LICENSE)
![Node](https://img.shields.io/badge/node-%3E%3D18-38bdf8.svg)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

You run a dozen terminal AI-coding sessions across a grid of panes. Then your PC
restarts — a Windows update, a crash, a reboot — and they're *gone*. The layout,
the context, which chat was doing what. You spend the next hour trying to
remember and manually `--resume`-ing them one by one.

Deck fixes that. It quietly records every running Claude Code session, and after
a restart it **rebuilds your entire terminal grid** exactly as it was. It also
**mirrors every transcript to a safe backup**, so even a disk wipe can't lose a
conversation.

```
$ deck status
  THE GRID          3 windows · 5 tabs · 6 live sessions
  RECORDED          6/6 sessions captured  ✓
  BACKED UP         228/228 transcripts mirrored (fresh 2m ago)  ✓
  VERDICT           OK — a restart cannot lose your work.

$ deck restore        # after a reboot — your whole grid comes back
```

---

## Why this exists

Terminal AI agents (Claude Code, and friends) store each chat as a transcript on
disk, and can `--resume` any one by id. But nothing tells you **which sessions
were open**, in **which panes**, when the machine went down. The built-in resume
picker is scoped to one project and can't rebuild a multi-window grid.

Deck is the missing layer: **session-state capture + grid restore + backup**, so
a restart is a non-event.

It is deliberately **not** a credential-rotation tool. Deck never touches your
auth, never pools accounts, never helps you dodge a provider's rate limits. It
only manages *your own* sessions.

## What it does

- **📸 Snapshot** — a lightweight recorder notes every live session (by process,
  not by guesswork) every minute, plus which pane/cwd it lives in.
- **♻️ Restore** — after a reboot, rebuild the exact window→tab→pane grid and
  `--resume` each session into its right place.
- **💾 Backup** — mirror every transcript to a safe folder (keeps deleted ones
  too), so the *conversation* survives even if everything else doesn't.
- **✅ Status** — one command shows your grid, what's recorded, and proof
  everything is backed up — so you *know* it's safe before you restart.

## How it stays reliable (the important bit)

Naïve tools guess which sessions are open by looking at recently-changed files —
which silently drops any pane you left open but idle. Deck doesn't guess. Each
session **stamps its own process id** via a Claude Code hook; the recorder keeps
a session only if that process is still alive. Deterministic, no time-window, no
dropped panes.

## Install

> **Proven on Claude Code + [WezTerm](https://wezterm.org) on Windows**, with a
> **tmux back-end** for macOS/Linux (`terminal: "tmux"` in config). Other
> terminals are a small module away — PRs welcome (the core is terminal-agnostic).

```bash
npm install -g claude-deck
deck install     # wires the Claude Code hooks + the 1-min snapshot task
```

`deck install` will:
1. Add the recorder hook to your Claude Code `settings.json` (SessionStart + Stop).
2. Register a scheduled task that snapshots your grid every minute.
3. Start the transcript backup.

Then just work. Before a restart, run `deck status` to confirm you're safe. After
a restart, run `deck restore` (or let the auto-restore task do it on login).

## Commands

| Command | What it does |
|---|---|
| `deck status` | Show the grid + recorded sessions + backup proof + a verdict. |
| `deck restore` | Rebuild your grid after a restart (`--dry-run` to preview). |
| `deck snapshot` | Force a capture right now (also runs every minute). |
| `deck backup` | Mirror transcripts to the backup dir now. |
| `deck install` / `deck uninstall` | Wire / unwire the hooks + tasks. |

## Config

`~/.deck/config.json` (created by `deck install`):

```jsonc
{
  "backupDir": "~/ClaudeSessionBackup", // where transcripts are mirrored
  "perWindow": 6,                       // panes per window on restore
  "terminal": "wezterm",                // "wezterm" (Windows) or "tmux" (macOS/Linux)
  "interactiveOnly": true               // restore chats you drove, not job runs
}
```

## Roadmap

- [x] macOS / Linux process walk-up (`ps` instead of PowerShell)
- [x] tmux back-end
- [ ] Zellij + Windows Terminal back-ends
- [ ] Other agent CLIs (Codex, Aider, Cursor CLI)
- [ ] Optional encrypted cloud sync of the grid + backup (the paid tier)

## License

MIT — see [LICENSE](./LICENSE). Use it, fork it, ship it.

---

*Deck is an independent tool and is not affiliated with or endorsed by Anthropic.*
