// Mirror every transcript to a safe backup dir. Additive: it copies new/changed
// transcripts and NEVER deletes from the backup, so a chat that gets wiped on the
// live side survives in the backup and stays recoverable.
import { existsSync, readdirSync, statSync, copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { PROJECTS_DIR, loadConfig } from "./config.mjs";

export function backup({ verbose = false } = {}) {
  const cfg = loadConfig();
  const dest = path.join(cfg.backupDir, "projects");
  ensure(dest);
  let copied = 0, seen = 0;
  if (existsSync(PROJECTS_DIR)) {
    for (const dir of readdirSync(PROJECTS_DIR)) {
      const srcDir = path.join(PROJECTS_DIR, dir);
      let files;
      try { files = readdirSync(srcDir); } catch { continue; }
      const outDir = path.join(dest, dir);
      for (const f of files) {
        if (!f.endsWith(".jsonl")) continue;
        seen++;
        const src = path.join(srcDir, f);
        const dst = path.join(outDir, f);
        try {
          const s = statSync(src);
          let need = true;
          try { need = statSync(dst).mtimeMs < s.mtimeMs; } catch { need = true; }
          if (!need) continue;
          ensure(outDir);
          copyFileSync(src, dst);
          copied++;
          if (verbose) console.error(`  + ${dir}/${f}`);
        } catch {}
      }
    }
  }
  return { dest, copied, seen };
}

// Count / freshness of the backup, for status.
export function backupState() {
  const cfg = loadConfig();
  const dest = path.join(cfg.backupDir, "projects");
  return { dir: dest, onDisk: count(PROJECTS_DIR), inBackup: count(dest), newest: newest(dest) };
}

function count(root) {
  let n = 0;
  try { for (const d of readdirSync(root)) { try { n += readdirSync(path.join(root, d)).filter((f) => f.endsWith(".jsonl")).length; } catch {} } } catch {}
  return n;
}
function newest(root) {
  let t = 0;
  try {
    for (const d of readdirSync(root)) {
      const dp = path.join(root, d);
      let files; try { files = readdirSync(dp); } catch { continue; }
      for (const f of files) { if (!f.endsWith(".jsonl")) continue; try { const m = statSync(path.join(dp, f)).mtimeMs; if (m > t) t = m; } catch {} }
    }
  } catch {}
  return t;
}
function ensure(d) { try { mkdirSync(d, { recursive: true }); } catch {} }
