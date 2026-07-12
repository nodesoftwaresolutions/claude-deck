// Read Claude Code transcripts (~/.claude/projects/<encoded>/<sessionId>.jsonl).
//
// We deliberately read the real `cwd` from INSIDE each transcript rather than
// trying to reverse Claude's lossy directory-name encoding — it's exact and
// portable across machines.
import { existsSync, readdirSync, statSync, openSync, fstatSync, readSync, closeSync } from "node:fs";
import path from "node:path";
import { PROJECTS_DIR } from "./config.mjs";

// Locate the .jsonl for a session id across all project folders.
export function findTranscript(sessionId) {
  if (!existsSync(PROJECTS_DIR)) return null;
  for (const dir of readdirSync(PROJECTS_DIR)) {
    const p = path.join(PROJECTS_DIR, dir, `${sessionId}.jsonl`);
    if (existsSync(p)) return p;
  }
  return null;
}

// Every transcript on disk, newest-first, with lightweight metadata.
export function allSessions() {
  const out = [];
  if (!existsSync(PROJECTS_DIR)) return out;
  for (const dir of readdirSync(PROJECTS_DIR)) {
    const projDir = path.join(PROJECTS_DIR, dir);
    let files;
    try { files = readdirSync(projDir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith(".jsonl")) continue;
      const sessionId = f.slice(0, -6);
      if (!/^[0-9a-f-]{32,40}$/i.test(sessionId)) continue;
      const jsonlPath = path.join(projDir, f);
      let mtime;
      try { mtime = statSync(jsonlPath).mtimeMs; } catch { continue; }
      out.push({ sessionId, jsonlPath, mtime });
    }
  }
  out.sort((a, b) => b.mtime - a.mtime);
  return out;
}

// Pull cwd + a preview of the last human message from a transcript tail.
export function transcriptMeta(jsonlPath) {
  const meta = { cwd: null, preview: null };
  let fd;
  try {
    fd = openSync(jsonlPath, "r");
    const size = fstatSync(fd).size;
    const len = Math.min(size, 128 * 1024);
    const buf = Buffer.alloc(len);
    readSync(fd, buf, 0, len, size - len);
    const lines = buf.toString("utf8").split("\n").filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
      let o;
      try { o = JSON.parse(lines[i]); } catch { continue; }
      if (!meta.cwd && o.cwd) meta.cwd = o.cwd;
      if (!meta.preview && (o.type === "user" || (o.message && o.message.role === "user"))) {
        const content = o.message ? o.message.content : o.content;
        let s = typeof content === "string" ? content
          : Array.isArray(content) ? (content.find((c) => c && c.type === "text") || {}).text || "" : "";
        s = (s || "").replace(/\s+/g, " ").trim();
        if (s && !isNoise(s)) meta.preview = s.slice(0, 60);
      }
      if (meta.cwd && meta.preview) break;
    }
  } catch { /* best effort */ }
  finally { if (fd !== undefined) try { closeSync(fd); } catch {} }
  return meta;
}

function isNoise(s) {
  return /^(<|Caveat:|Stop hook feedback|PreToolUse|PostToolUse|UserPromptSubmit|Base directory for this skill|# \/|\[Request interrupted|This session is being continued|tool_result)/.test(s)
    || /hook feedback:|"type":"tool_result"/.test(s);
}
