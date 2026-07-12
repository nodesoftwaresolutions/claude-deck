// Shared paths + user config. Everything is derived from the OS home dir, so the
// tool works on any machine without hardcoded paths.
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import os from "node:os";

export const HOME = process.env.USERPROFILE || os.homedir();

// Claude Code's on-disk locations.
export const CLAUDE_DIR = path.join(HOME, ".claude");
export const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects");
export const CLAUDE_SETTINGS = path.join(CLAUDE_DIR, "settings.json");

// Deck's own state.
export const DECK_DIR = path.join(HOME, ".deck");
export const CONFIG_PATH = path.join(DECK_DIR, "config.json");
export const REGISTRY_DIR = path.join(DECK_DIR, "registry");        // <sessionId>.json (pid, cwd, ...)
export const SNAPSHOT_PATH = path.join(DECK_DIR, "snapshot.json");   // last captured grid
export const HISTORY_DIR = path.join(DECK_DIR, "history");           // rolling snapshots
export const PREREBOOT_PATH = path.join(DECK_DIR, "pre-reboot.json");
export const BOOTSTAMP_PATH = path.join(DECK_DIR, ".bootstamp");

const DEFAULTS = {
  backupDir: path.join(HOME, "ClaudeSessionBackup"),
  perWindow: 6,
  terminal: "wezterm",
  interactiveOnly: true,
  historyKeep: 1000,
};

export function loadConfig() {
  let cfg = { ...DEFAULTS };
  try {
    if (existsSync(CONFIG_PATH)) cfg = { ...cfg, ...JSON.parse(readFileSync(CONFIG_PATH, "utf8")) };
  } catch { /* fall back to defaults */ }
  cfg.backupDir = expand(cfg.backupDir);
  return cfg;
}

export function saveConfig(cfg) {
  ensureDir(DECK_DIR);
  writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + "\n");
}

export function ensureDir(d) {
  try { mkdirSync(d, { recursive: true }); } catch {}
}

function expand(p) {
  if (typeof p === "string" && p.startsWith("~")) return path.join(HOME, p.slice(1));
  return p;
}
