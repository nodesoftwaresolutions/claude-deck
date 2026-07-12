# Deck in 30 seconds

A real walkthrough — the commands and their actual output.

## 1. Check you're safe before a restart

```console
$ deck status
========================================================
  DECK STATUS  —  7/12/2026, 7:02:20 PM
========================================================

THE GRID
  3 window(s) · 5 tab(s) · 14 pane(s)
  Window 1
     • Fix the payment webhook retry logic         legal-ai/backend
  Window 2
     • Draft the Q3 board update                   notes/board
     • Refactor the auth middleware                app/server
  Window 3
     • Claude Code                                 app/web
     • Investigate the flaky e2e test              app/web
     • (empty pane)                                ~

RECONCILE   14 live agent pane(s)  vs  14 recorded  ->  MATCH ✓

RECORDED SESSIONS  (14, will be restored)
  [backed up]  a1b2c3d4  app/server   Refactor the auth middleware to use the new…
  [backed up]  e5f6a7b8  app/web      Investigate the flaky e2e test — it fails on…
  … (12 more)

BACKUP
  on disk: 238   ·   backed up: 238 (keeps deleted)   ·   refreshed 2s ago
  ~/ClaudeSessionBackup/projects

VERDICT
  OK — a restart cannot lose your work.
```

`RECONCILE … MATCH ✓` is the line that matters: every live pane is captured. No
guessing, no dropped sessions.

## 2. Restart happens

Windows update. A crash. A reboot. Every terminal closes. In the old world, this
is where you lose an hour.

## 3. Bring the whole grid back

```console
$ deck restore
Restoring 14 session(s) into 3 window(s) [cli-spawn (tabs)].
```

Every session reopens in its own directory, resumed exactly where you left off —
same windows, same context. Want only a couple back first?

```console
$ deck restore --dry-run
Would restore 14 session(s) (source: pre-reboot):
  a1b2c3d4  app/server   Refactor the auth middleware…
  e5f6a7b8  app/web      Investigate the flaky e2e test…
  …

$ deck restore --only a1b2c3d4,e5f6a7b8
Restoring 2 session(s) into 1 window(s) [cli-spawn (tabs)].
```

## 4. If anything looks off

```console
$ deck doctor
Deck doctor
===========
  ✓ Recorder hooks wired         SessionStart + Stop call deck
  ✓ Config present               ~/.deck/config.json
  ✓ Snapshots running            last capture 0m ago
  ✓ Sessions self-registering    14 session(s) have a resolved pid
  ✓ Backup healthy               238/238 mirrored
  ✓ Terminal back-end            wezterm found

  All green — you're protected.
```

That's the whole product: know you're safe, restart without fear, get everything
back.
