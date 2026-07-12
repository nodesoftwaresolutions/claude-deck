// Capture the set of live sessions into ~/.deck/snapshot.json (+ a rolling
// history). Deterministic: a registered session is live iff its owning claude
// pid is still running. A recency fallback covers sessions that started before
// they had a chance to register a pid.
import { existsSync, readdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  REGISTRY_DIR, SNAPSHOT_PATH, HISTORY_DIR, PREREBOOT_PATH, BOOTSTAMP_PATH,
  ensureDir, loadConfig,
} from "./config.mjs";
import { liveAgentPids } from "./proc.mjs";
import { findTranscript, transcriptMeta, allSessions } from "./transcripts.mjs";

const FALLBACK_FLOOR_MS = 12 * 3600 * 1000; // recency floor for the pre-registration fallback

export function snapshot({ write = true } = {}) {
  const cfg = loadConfig();
  const live = liveAgentPids();
  const captured = new Set();
  const sessions = [];

  // 1. Deterministic: registered sessions whose owning pid is still alive.
  if (existsSync(REGISTRY_DIR)) {
    for (const f of readdirSync(REGISTRY_DIR)) {
      if (!f.endsWith(".json")) continue;
      let rec;
      try { rec = JSON.parse(readFileSync(path.join(REGISTRY_DIR, f), "utf8")); } catch { continue; }
      const pid = rec.claudePid;
      if (!rec.sessionId || !pid || !live.has(pid)) continue;
      const sid = rec.sessionId.toLowerCase();
      if (captured.has(sid)) continue;
      sessions.push(enrich(sid, rec.cwd));
      captured.add(sid);
    }
  }

  // 2. Fallback: if more claude processes are alive than we captured, back-fill
  //    from the most-recently-active transcripts (bounded by a recency floor so
  //    it can't resurrect stale idle chats). Transitional only.
  const missing = Math.max(0, live.size - captured.size);
  if (missing > 0) {
    const floor = Date.now() - FALLBACK_FLOOR_MS;
    let added = 0;
    for (const s of allSessions()) {
      if (added >= missing) break;
      if (captured.has(s.sessionId)) continue;
      if (s.mtime < floor) continue;
      sessions.push({ ...enrich(s.sessionId, null), fallback: true });
      captured.add(s.sessionId);
      added++;
    }
  }

  sessions.sort((a, b) => (a.lastActivity < b.lastActivity ? 1 : -1));
  const snap = { capturedAt: new Date().toISOString(), sessionCount: sessions.length, sessions };

  if (!write) return snap;

  preservePreReboot();

  // Never clobber a good snapshot with an empty one (right after a reboot no
  // agent is running yet — that must not wipe the restore target).
  if (sessions.length === 0 && existsSync(SNAPSHOT_PATH)) return snap;

  ensureDir(path.dirname(SNAPSHOT_PATH));
  const body = JSON.stringify(snap, null, 2) + "\n";
  writeFileSync(SNAPSHOT_PATH, body);

  ensureDir(HISTORY_DIR);
  const stamp = snap.capturedAt.replace(/[:.]/g, "-");
  try { writeFileSync(path.join(HISTORY_DIR, `snapshot-${stamp}.json`), body); } catch {}
  pruneHistory(cfg.historyKeep);
  return snap;
}

function enrich(sessionId, cwd) {
  const jsonl = findTranscript(sessionId);
  const meta = jsonl ? transcriptMeta(jsonl) : {};
  let lastActivity = new Date().toISOString();
  try { if (jsonl) lastActivity = new Date(statSync(jsonl).mtime).toISOString(); } catch {}
  return { sessionId, cwd: cwd || meta.cwd || null, preview: meta.preview || null, lastActivity };
}

function preservePreReboot() {
  try {
    if (!existsSync(SNAPSHOT_PATH)) return;
    const bootMs = Date.now() - os.uptime() * 1000;
    const prev = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
    const prevMs = new Date(prev.capturedAt).getTime();
    const bootStamp = Math.floor(bootMs / 1000).toString();
    const done = existsSync(BOOTSTAMP_PATH) ? readFileSync(BOOTSTAMP_PATH, "utf8").trim() : "";
    if (Number.isFinite(prevMs) && prevMs < bootMs && (prev.sessions?.length || 0) > 0 && done !== bootStamp) {
      writeFileSync(PREREBOOT_PATH, JSON.stringify(prev, null, 2) + "\n");
      writeFileSync(BOOTSTAMP_PATH, bootStamp);
    }
  } catch { /* non-fatal */ }
}

function pruneHistory(keep) {
  try {
    const files = readdirSync(HISTORY_DIR).filter((f) => f.startsWith("snapshot-") && f.endsWith(".json")).sort();
    while (files.length > keep) { try { unlinkSync(path.join(HISTORY_DIR, files.shift())); } catch { break; } }
  } catch {}
}
