// `deck install` / `deck uninstall` — wire the recorder hook into Claude Code's
// settings.json (SessionStart + Stop) and create the default config. It edits
// settings.json idempotently and backs it up first.
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CLAUDE_SETTINGS, CONFIG_PATH, loadConfig, saveConfig, ensureDir, DECK_DIR } from "./config.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOOK_ENTRY = path.join(HERE, "..", "bin", "deck.mjs");
const NODE = process.execPath;

const openCmd = `"${NODE}" "${HOOK_ENTRY}" hook --open`;
const turnCmd = `"${NODE}" "${HOOK_ENTRY}" hook --turn`;

export function install() {
  ensureDir(DECK_DIR);
  if (!existsSync(CONFIG_PATH)) saveConfig(loadConfig());

  const changed = editSettings((s) => {
    addHook(s, "SessionStart", openCmd);
    addHook(s, "Stop", turnCmd);
  });

  return {
    settingsChanged: changed,
    config: CONFIG_PATH,
    next: [
      "Hooks wired into Claude Code settings.json (SessionStart + Stop).",
      "Now register the 1-minute snapshot task (platform-specific):",
      process.platform === "win32"
        ? `  schtasks /create /tn DeckSnapshot /tr "\\"${NODE}\\" \\"${HOOK_ENTRY}\\" snapshot" /sc minute /mo 1 /f`
        : `  (cron)  * * * * * "${NODE}" "${HOOK_ENTRY}" snapshot`,
      "Run `deck status` any time to confirm you're safe.",
    ],
  };
}

export function uninstall() {
  const changed = editSettings((s) => {
    removeHook(s, "SessionStart", openCmd);
    removeHook(s, "Stop", turnCmd);
  });
  return { settingsChanged: changed };
}

function editSettings(mut) {
  let s = {};
  if (existsSync(CLAUDE_SETTINGS)) {
    copyFileSync(CLAUDE_SETTINGS, CLAUDE_SETTINGS + ".deck-backup");
    try { s = JSON.parse(readFileSync(CLAUDE_SETTINGS, "utf8")); } catch { s = {}; }
  }
  s.hooks = s.hooks || {};
  const before = JSON.stringify(s);
  mut(s);
  const after = JSON.stringify(s);
  if (before !== after) { ensureDir(path.dirname(CLAUDE_SETTINGS)); writeFileSync(CLAUDE_SETTINGS, JSON.stringify(s, null, 2) + "\n"); return true; }
  return false;
}

function addHook(s, event, command) {
  s.hooks[event] = s.hooks[event] || [];
  const all = s.hooks[event].flatMap((g) => (g.hooks || []).map((h) => h.command));
  if (all.includes(command)) return;
  s.hooks[event].push({ matcher: "", hooks: [{ type: "command", command }] });
}

function removeHook(s, event, command) {
  if (!s.hooks[event]) return;
  s.hooks[event] = s.hooks[event]
    .map((g) => ({ ...g, hooks: (g.hooks || []).filter((h) => h.command !== command) }))
    .filter((g) => (g.hooks || []).length);
}
