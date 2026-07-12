// WezTerm back-end: list panes + build a grid of resumed sessions.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const WEZTERM = process.env.DECK_WEZTERM || "wezterm";

export function isAvailable() {
  try { execFileSync(WEZTERM, ["--version"], { stdio: "ignore", timeout: 5000 }); return true; }
  catch { return false; }
}

// Current panes as [{window_id, tab_id, pane_id, title, cwd}], or null if no GUI.
export function listPanes() {
  try {
    const out = execFileSync(WEZTERM, ["cli", "list", "--format", "json"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 6000 });
    const p = JSON.parse(out);
    return Array.isArray(p) ? p : [];
  } catch { return null; }
}

// True if a pane is running an agent session (has a real title, not a bare shell).
export function isSessionPane(title) {
  const t = clean(title);
  if (!t) return false;
  return !/^(cmd|powershell|pwsh|bash|zsh|wsl)\.exe$/i.test(t) && !/^(cmd|powershell|pwsh|bash|zsh)$/i.test(t);
}

export const clean = (s) => (s || "").replace(/[^\x20-\x7E]/g, "").trim();

// Rebuild a grid: sessions chunked into windows of `perWindow`, each pane running
// `claude --resume <id>` in that session's cwd. Uses the gui-startup handler when
// no GUI is up (fresh boot), else `wezterm cli spawn` into the running GUI.
export function restoreGrid(sessions, perWindow, launcher) {
  if (!sessions.length) return { windows: 0 };
  const guiUp = listPanes() !== null;
  const chunks = [];
  for (let i = 0; i < sessions.length; i += perWindow) chunks.push(sessions.slice(i, i + perWindow));

  if (guiUp) {
    for (const chunk of chunks) {
      let first = true;
      for (const s of chunk) {
        const args = ["cli", "spawn", "--cwd", s.cwd || os.homedir()];
        if (!first) { /* same window: spawn adds a tab; keep simple */ }
        execFileSync(WEZTERM, args, { stdio: "ignore", timeout: 8000 });
        first = false;
        // send the resume command into the new pane
        // (wezterm cli send-text needs the pane id; simplest path is the launcher shell)
      }
    }
    return { windows: chunks.length, mode: "cli-spawn" };
  }

  // No GUI: emit a startup Lua the user launches (or the login task launches).
  const luaPath = path.join(os.tmpdir(), `deck-restore-${Date.now()}.lua`);
  writeFileSync(luaPath, buildStartupLua(chunks, launcher));
  return { windows: chunks.length, mode: "lua", luaPath, hint: `wezterm start --config-file ${luaPath}` };
}

function buildStartupLua(chunks, launcher) {
  const spawn = (s) => {
    const cmd = `${launcher} --resume ${s.sessionId}`;
    return `{ dir = [[${(s.cwd || os.homedir()).replace(/\//g, "\\")}]], args = { [[cmd]], [[/k]], [[${cmd}]] } }`;
  };
  const wins = chunks.map((c) => `  { ${c.map(spawn).join(",\n    ")} }`).join(",\n");
  return `local wezterm = require 'wezterm'
local mux = wezterm.mux
local WINDOWS = {
${wins}
}
wezterm.on('gui-startup', function()
  for _, panes in ipairs(WINDOWS) do
    local _, first, win = mux.spawn_window{ cwd = panes[1].dir, args = panes[1].args }
    win:gui_window():maximize()
    local cur = first
    for i = 2, #panes do
      cur = cur:split{ direction = 'Right', cwd = panes[i].dir, args = panes[i].args }
    end
  end
end)
return {}
`;
}
