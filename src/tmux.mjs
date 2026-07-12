// tmux back-end — same interface as wezterm.mjs (isAvailable / listPanes /
// restoreGrid), so Deck works on any macOS/Linux box running tmux.
//
// tmux hierarchy (server → session → window → pane) maps to Deck's grid as:
//   tmux session -> "window",  tmux window -> "tab",  pane -> pane.
import { execFileSync } from "node:child_process";
import os from "node:os";
import { clean, isSessionPane } from "./wezterm.mjs";

const TMUX = process.env.DECK_TMUX || "tmux";
const OPTS = { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"], timeout: 6000 };
const FMT = "#{session_id}\t#{window_id}\t#{pane_id}\t#{pane_title}\t#{pane_current_path}";

export function isAvailable() {
  try { execFileSync(TMUX, ["-V"], { ...OPTS, stdio: "ignore" }); return true; }
  catch { return false; }
}

// Pure parser (exported for tests): tab-separated `list-panes` rows -> pane objects.
export function parsePanes(raw) {
  return (raw || "").split("\n").filter(Boolean).map((line) => {
    const [sid, wid, pid, title, cwd] = line.split("\t");
    return { window_id: sid, tab_id: wid, pane_id: pid, title: title || "", cwd: cwd || "" };
  });
}

export function listPanes() {
  try {
    const out = execFileSync(TMUX, ["list-panes", "-a", "-F", FMT], OPTS);
    return parsePanes(out);
  } catch {
    return null; // no server running / tmux absent
  }
}

// Rebuild the grid: each chunk of `perWindow` sessions becomes one tmux session
// (a "window" in Deck terms), with a tmux window per session running the resume
// command in its cwd.
export function restoreGrid(sessions, perWindow, launcher) {
  if (!sessions.length) return { windows: 0 };
  const chunks = [];
  for (let i = 0; i < sessions.length; i += perWindow) chunks.push(sessions.slice(i, i + perWindow));
  let made = 0, panes = 0;
  chunks.forEach((chunk, wi) => {
    const name = `deck-${wi + 1}`;
    chunk.forEach((s, i) => {
      const cwd = s.cwd || os.homedir();
      const cmd = `${launcher} --resume ${s.sessionId}`;
      try {
        if (i === 0) execFileSync(TMUX, ["new-session", "-d", "-s", name, "-c", cwd], OPTS);
        else execFileSync(TMUX, ["new-window", "-t", name, "-c", cwd], OPTS);
        execFileSync(TMUX, ["send-keys", "-t", name, cmd, "Enter"], OPTS);
        panes++;
      } catch { /* skip this pane */ }
    });
    made++;
  });
  return { windows: made, panes, mode: "tmux", hint: `tmux attach -t deck-1` };
}

export { clean, isSessionPane };
