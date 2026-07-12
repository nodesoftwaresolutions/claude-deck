// Terminal back-end selector. Picks the back-end named by config.terminal
// (default "wezterm"), falling back to wezterm if the name is unknown.
//
// Every back-end exposes: isAvailable(), listPanes(), restoreGrid(sessions, perWindow, launcher).
import * as wezterm from "./wezterm.mjs";
import * as tmux from "./tmux.mjs";
import { loadConfig } from "./config.mjs";

const BACKENDS = { wezterm, tmux };

export function backend(name) {
  const key = String(name || loadConfig().terminal || "wezterm").toLowerCase();
  return BACKENDS[key] || wezterm;
}

export function backendNames() { return Object.keys(BACKENDS); }

// Pane string helpers are back-end-agnostic; re-export the canonical versions.
export { clean, isSessionPane } from "./wezterm.mjs";
