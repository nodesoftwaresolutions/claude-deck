// `deck status` — the "am I safe to restart?" report.
//   1. THE GRID       every WezTerm window/tab/pane + the session in each
//   2. RECONCILE      live agent panes vs recorded sessions (explicit match/gap)
//   3. RECORDED       what restore will bring back, each [backed up] or [NOT BACKED]
//   4. BACKUP + VERDICT
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.mjs";
import { snapshot } from "./snapshot.mjs";
import { backupState } from "./backup.mjs";
import { backend, isSessionPane, clean } from "./terminal.mjs";

const ago = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 90) return `${s}s ago`;
  const m = Math.round(s / 60); if (m < 90) return `${m}m ago`;
  const h = Math.round(m / 60); return h < 48 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};
const short = (u) => decodeURIComponent(String(u || "")).replace(/^file:\/\/\//, "").replace(/[\\/]$/, "").split(/[\\/]/).slice(-2).join("/");

function backedUp(dest, id) {
  if (!existsSync(dest)) return false;
  try { for (const d of readdirSync(dest)) if (existsSync(path.join(dest, d, `${id}.jsonl`))) return true; } catch {}
  return false;
}

export function status() {
  const cfg = loadConfig();
  const now = Date.now();
  const panes = backend(cfg.terminal).listPanes();
  const snap = snapshot({ write: false });
  const bk = backupState();
  const out = [];
  out.push("=".repeat(56), "  DECK STATUS  —  " + new Date(now).toLocaleString(), "=".repeat(56), "");

  // 1. THE GRID
  out.push("THE GRID");
  let livePanes = 0;
  if (panes === null) out.push("  (WezTerm GUI not reachable)");
  else {
    const wins = new Map();
    for (const p of panes) { if (!wins.has(p.window_id)) wins.set(p.window_id, new Map()); const t = wins.get(p.window_id); if (!t.has(p.tab_id)) t.set(p.tab_id, []); t.get(p.tab_id).push(p); }
    out.push(`  ${wins.size} window(s) · ${new Set(panes.map((p) => p.tab_id)).size} tab(s) · ${panes.length} pane(s)`);
    let wi = 0;
    for (const [, tabs] of wins) {
      wi++; out.push(`  Window ${wi}`);
      for (const [, ps] of tabs) for (const p of ps) {
        const isSess = isSessionPane(p.title);
        if (isSess) livePanes++;
        const label = isSess ? clean(p.title).slice(0, 48) : "(empty pane)";
        out.push(`     • ${label.padEnd(48)}  ${short(p.cwd)}`);
      }
    }
  }
  out.push("");

  // 2. RECONCILE — the explicit "we see all of them" proof.
  const recorded = snap.sessions.length;
  if (panes !== null) {
    const match = livePanes === recorded;
    out.push(`RECONCILE   ${livePanes} live agent pane(s)  vs  ${recorded} recorded  ->  ${match ? "MATCH ✓" : "GAP ⚠"}`);
    if (!match) out.push(`  ⚠ counts differ — a session may not be captured; check RECORDED below against your screen.`);
    out.push("");
  }

  // 3. RECORDED SESSIONS
  out.push(`RECORDED SESSIONS  (${snap.sessions.length}, will be restored)`);
  if (!snap.sessions.length) out.push("  (none)");
  let notBacked = 0;
  for (const s of snap.sessions) {
    const bu = backedUp(bk.dir, s.sessionId);
    if (!bu) notBacked++;
    out.push(`  ${bu ? "[backed up]" : "[NOT BACKED]"}  ${s.sessionId.slice(0, 8)}  ${short(s.cwd).padEnd(24)}  ${(s.preview || "").slice(0, 40)}`);
  }
  out.push("");

  // 4. BACKUP + VERDICT
  const fresh = bk.newest && (now - bk.newest) < 15 * 60 * 1000;
  const covered = bk.inBackup >= bk.onDisk && fresh;
  out.push("BACKUP");
  out.push(`  on disk: ${bk.onDisk}   ·   backed up: ${bk.inBackup} (keeps deleted)   ·   refreshed ${bk.newest ? ago(now - bk.newest) : "never"}`);
  out.push(`  ${bk.dir}`, "");

  const issues = [];
  if (!covered) issues.push("backup behind — run `deck backup`");
  if (notBacked) issues.push(`${notBacked} recorded session(s) not yet mirrored`);
  out.push("VERDICT");
  out.push(issues.length ? "  ⚠ " + issues.join("; ") : "  OK — a restart cannot lose your work.");
  return out.join("\n");
}
