// The recorder hook. Claude Code invokes this on SessionStart (`--open`) and on
// Stop (`--turn`), passing the hook JSON on stdin: { session_id, cwd, ... }.
//
// It writes ~/.deck/registry/<sessionId>.json with the OWNING claude pid (resolved
// by walking up from the transient hook launcher). The snapshot then treats a
// session as live iff that pid is still running — deterministic, no guessing.
//
// Fail-safe: any error exits 0 so it can never break the hook chain.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REGISTRY_DIR, ensureDir } from "./config.mjs";
import { resolveOwningPid } from "./proc.mjs";

export function record(mode) {
  let raw = "";
  try { raw = readFileSync(0, "utf8"); } catch {}
  let hook = {};
  try { hook = JSON.parse(raw || "{}"); } catch {}

  const sessionId = hook.session_id || hook.sessionId;
  const cwd = hook.cwd || hook.workingDirectory || process.cwd();
  if (!sessionId || !/^[0-9a-f-]{32,40}$/i.test(sessionId)) return;

  ensureDir(REGISTRY_DIR);
  const file = path.join(REGISTRY_DIR, `${sessionId}.json`);

  let rec = {};
  try { rec = JSON.parse(readFileSync(file, "utf8")); } catch {}

  const now = new Date().toISOString();
  rec.sessionId = sessionId;
  rec.cwd = cwd;
  // Resolve the owning claude pid ONCE (stable for the session's life). Sessions
  // that predate this record compute it on their next turn.
  if (!rec.claudePid) {
    const pid = resolveOwningPid(process.ppid);
    if (pid) rec.claudePid = pid;
  }
  if (!rec.openedAt) rec.openedAt = now;
  if (mode === "turn") rec.lastTurnAt = now; // genuine work; resume does not hit this
  rec.lastSeen = now;

  try { writeFileSync(file, JSON.stringify(rec, null, 2) + "\n"); } catch {}
}
