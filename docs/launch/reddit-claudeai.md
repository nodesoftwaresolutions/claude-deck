# r/ClaudeAI post draft

**Title:** I built a free tool so a PC restart never loses your Claude Code sessions again

**Flair:** Resources / Tools

**Body:**

If you run a bunch of Claude Code sessions in terminal panes, you know the pain:
your PC reboots and the whole grid is gone. You can `--resume` individual chats
if you remember their ids, but nothing tracks *which* sessions were open, in
which panes.

I made **Deck** to fix it (free, open source, MIT):

- `deck restore` rebuilds your entire terminal grid after a reboot and resumes
  each session in its own folder.
- It captures sessions *deterministically* — each one stamps its process id, so
  even panes you left open but idle aren't dropped (the thing that made my first
  attempt only recover 2 of 18 sessions).
- Every transcript is mirrored to a backup, so even a wipe can't lose a chat.
- `deck status` shows your grid + proves everything's captured before you restart.

```
npm install -g nodesoftwaresolutions/claude-deck && deck install
```

Repo: https://github.com/nodesoftwaresolutions/claude-deck

v1 is WezTerm + Windows (what I use). If you're on tmux/Zellij/macOS I'd genuinely
love help extending it — the core doesn't care about the terminal. Feedback very
welcome; tell me where it breaks for you.
