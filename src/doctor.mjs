// `deck doctor` — diagnose a broken or half-finished install and tell you the fix.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { CLAUDE_SETTINGS, CONFIG_PATH, SNAPSHOT_PATH, REGISTRY_DIR } from "./config.mjs";
import { backupState } from "./backup.mjs";
import { isAvailable } from "./wezterm.mjs";

const PASS = "✓", FAIL = "✗", WARN = "!";

export function doctor() {
  const checks = [];
  const add = (level, name, detail, fix) => checks.push({ level, name, detail, fix });

  // 1. hooks wired?
  let hooksOk = false;
  try {
    const s = JSON.parse(readFileSync(CLAUDE_SETTINGS, "utf8"));
    const all = JSON.stringify(s.hooks || {});
    hooksOk = all.includes("deck.mjs") && all.includes("hook");
  } catch {}
  add(hooksOk ? PASS : FAIL, "Recorder hooks wired",
    hooksOk ? "SessionStart + Stop call deck" : "no deck hook in Claude settings.json",
    "run `deck install`");

  // 2. config exists?
  const cfgOk = existsSync(CONFIG_PATH);
  add(cfgOk ? PASS : WARN, "Config present", cfgOk ? CONFIG_PATH : "using built-in defaults", "run `deck install`");

  // 3. snapshot recent?
  let snapAge = null;
  try { snapAge = Date.now() - new Date(JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8")).capturedAt).getTime(); } catch {}
  const snapOk = snapAge !== null && snapAge < 10 * 60 * 1000;
  add(snapOk ? PASS : (snapAge === null ? FAIL : WARN), "Snapshots running",
    snapAge === null ? "no snapshot yet" : `last capture ${Math.round(snapAge / 60000)}m ago`,
    "register the 1-min snapshot task (see `deck install` output)");

  // 4. any sessions registered a pid?
  let registered = 0;
  try { for (const f of readdirSync(REGISTRY_DIR)) { if (!f.endsWith(".json")) continue; const r = JSON.parse(readFileSync(`${REGISTRY_DIR}/${f}`, "utf8")); if (r.claudePid) registered++; } } catch {}
  add(registered > 0 ? PASS : WARN, "Sessions self-registering",
    `${registered} session(s) have a resolved pid`,
    "take a turn in each open session (or restart) so they register");

  // 5. backup fresh?
  const bk = backupState();
  const bkFresh = bk.newest && (Date.now() - bk.newest) < 30 * 60 * 1000 && bk.inBackup >= bk.onDisk;
  add(bkFresh ? PASS : WARN, "Backup healthy",
    `${bk.inBackup}/${bk.onDisk} mirrored`, "run `deck backup`");

  // 6. terminal back-end?
  const wez = isAvailable();
  add(wez ? PASS : WARN, "Terminal back-end", wez ? "WezTerm found" : "WezTerm not on PATH (restore needs it)",
    "install WezTerm or set DECK_WEZTERM to its path");

  const lines = ["Deck doctor", "==========="];
  for (const c of checks) {
    lines.push(`  ${c.level} ${c.name.padEnd(28)} ${c.detail}`);
    if (c.level === FAIL) lines.push(`      fix: ${c.fix}`);
  }
  const fails = checks.filter((c) => c.level === FAIL).length;
  const warns = checks.filter((c) => c.level === WARN).length;
  lines.push("");
  lines.push(fails ? `  ${fails} problem(s) to fix above.` : warns ? `  Healthy (${warns} advisory).` : "  All green — you're protected.");
  return { text: lines.join("\n"), fails };
}
