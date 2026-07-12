# Show HN draft

**Title:** Show HN: Deck – never lose your Claude Code sessions when your PC restarts

**URL:** https://github.com/nodesoftwaresolutions/claude-deck

**Body:**

I run a grid of Claude Code sessions across a dozen terminal panes. Every time
my PC restarted — a Windows update, a crash — they were gone: the layout, the
context, which chat was doing what. I'd spend an hour trying to remember and
manually `--resume`-ing them one at a time.

Deck records every running session and rebuilds the whole terminal grid after a
reboot, and mirrors every transcript to a backup so a chat can't be lost.

The part I'm slightly proud of: naive approaches guess which sessions are open by
looking at recently-changed files, which silently drops any pane you left open
but idle (this bit me — a "restore" that only found 2 of my 18 sessions). Deck
doesn't guess. Each session stamps its own process id via a Claude Code hook, and
the recorder keeps a session only if that process is still alive. Deterministic,
no time-window, no dropped panes. `deck status` reconciles your live panes
against what's recorded so you can *see* it's complete before you restart.

It's Node, zero dependencies, MIT. v1 targets WezTerm on Windows (what I use);
the core is terminal-agnostic and I'd love PRs for tmux/Zellij/macOS.

Not affiliated with Anthropic — just scratching my own itch. Happy to answer
anything about the pid-walk-up trick or the restore internals.
