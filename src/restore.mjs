// `deck restore` — rebuild the grid after a restart. Prefers the pre-reboot grid
// (preserved across the shutdown), then the live snapshot.
import { existsSync, readFileSync } from "node:fs";
import { SNAPSHOT_PATH, PREREBOOT_PATH, loadConfig } from "./config.mjs";
import { restoreGrid, isAvailable } from "./wezterm.mjs";

const LAUNCHER = process.env.DECK_LAUNCHER || "claude"; // the CLI used to resume a session

export function restore({ dryRun = false, only = null } = {}) {
  const cfg = loadConfig();
  const src = pickSource();
  if (!src) return { ok: false, reason: "no snapshot found — has `deck snapshot` ever run?" };
  if (!dryRun && !isAvailable()) {
    return { ok: false, reason: "terminal back-end not found — install WezTerm, or set DECK_WEZTERM to its path (`deck restore --dry-run` works without it)." };
  }

  let sessions = (src.snap.sessions || []).filter((s) => s.cwd && s.sessionId);
  if (cfg.interactiveOnly) sessions = sessions.filter((s) => s.preview !== undefined); // all kept for v1; hook for job-run filtering

  // --only <id-prefixes>: restore just the matching sessions (pairs with --dry-run's list).
  if (only && only.length) {
    const wanted = only.map((x) => x.toLowerCase().trim()).filter(Boolean);
    sessions = sessions.filter((s) => wanted.some((w) => s.sessionId.toLowerCase().startsWith(w)));
    if (!sessions.length) return { ok: false, reason: `no session matched --only ${only.join(",")} (run --dry-run to see ids)` };
  }

  if (!sessions.length) return { ok: false, reason: "snapshot has no restorable sessions" };

  if (dryRun) {
    return {
      ok: true, dryRun: true, source: src.name, count: sessions.length,
      sessions: sessions.map((s) => ({ id: s.sessionId.slice(0, 8), cwd: s.cwd, preview: s.preview })),
    };
  }

  const res = restoreGrid(sessions, cfg.perWindow, LAUNCHER);
  return { ok: true, source: src.name, count: sessions.length, ...res };
}

function pickSource() {
  for (const [name, p] of [["pre-reboot", PREREBOOT_PATH], ["snapshot", SNAPSHOT_PATH]]) {
    try { if (existsSync(p)) { const snap = JSON.parse(readFileSync(p, "utf8")); if (snap.sessions?.length) return { name, snap }; } } catch {}
  }
  return null;
}
