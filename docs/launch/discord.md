# Claude Code Discord — #show-and-tell draft

Short, low-key, link-first (Discord hates walls):

---

Made a little thing for anyone who runs lots of Claude Code sessions and loses
them on a PC restart 👇

**Deck** — `deck restore` rebuilds your whole terminal grid after a reboot and
resumes every session, and backs up all your transcripts so nothing's ever lost.
Free + MIT.

Captures sessions by process id (not file-mtime guessing), so idle-but-open panes
don't get dropped — that was the bug that made my first version only find 2 of my
18 sessions 😅

`npm i -g nodesoftwaresolutions/claude-deck && deck install`
<https://github.com/nodesoftwaresolutions/claude-deck>

v1 is WezTerm/Windows; would love tmux/macOS PRs.

---

**Follow-up if asked "how's the pid thing work":**
Each session's SessionStart/Stop hook walks up the process tree from the (transient)
hook launcher to the owning `claude` process and records that pid. The 1-min
snapshot then keeps a session iff that pid is still alive. No mtime, no window.
