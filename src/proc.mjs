// Process enumeration + ancestor walk-up.
//
// The load-bearing trick: a Claude Code hook is spawned through a transient
// launcher (a cmd.exe/shell that dies right after), so `process.ppid` is NOT a
// usable liveness key. We walk UP the parent chain from the hook until we hit the
// owning agent process, and record THAT pid — it is stable for the session's
// whole life and lets the snapshot tell "still open" from "closed" deterministically.
//
// The agent process is named `claude` (`claude.exe` on Windows) by default. On a
// setup where Claude Code runs under a differently-named process, set
// DECK_AGENT_PROCESS to override (e.g. `node`).
import { execFileSync } from "node:child_process";

const IS_WIN = process.platform === "win32";
const AGENT = (process.env.DECK_AGENT_PROCESS || "claude").replace(/\.exe$/i, "");
const winName = `${AGENT}.exe`;
const agentRe = new RegExp(`(^|[\\\\/])${AGENT}(\\.exe)?$`, "i");
const OPTS = { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 8000 };

// All live agent PIDs, as a Set<number>. Never throws (returns empty on failure).
export function liveAgentPids() {
  try {
    if (IS_WIN) return new Set(winProcs().filter((p) => p.name && p.name.toLowerCase() === winName.toLowerCase()).map((p) => p.pid));
    const out = execFileSync("pgrep", ["-x", AGENT], OPTS);
    return new Set(out.split("\n").map((s) => parseInt(s, 10)).filter(Number.isFinite));
  } catch { return new Set(); }
}

// Walk up from `startPid` to the nearest agent process; return its pid or null.
export function resolveOwningPid(startPid) {
  if (!startPid) return null;
  try {
    if (IS_WIN) {
      const ps =
        `$cur=${startPid}; for($i=0;$i -lt 12;$i++){` +
        `$p=Get-CimInstance Win32_Process -Filter "ProcessId=$cur" -ErrorAction SilentlyContinue;` +
        `if(-not $p){break}; if($p.Name -eq '${winName}'){Write-Output $cur; break}; $cur=$p.ParentProcessId}`;
      const pid = parseInt(pwsh(ps).trim(), 10);
      return Number.isFinite(pid) ? pid : null;
    }
    let cur = startPid;
    for (let i = 0; i < 12; i++) {
      const line = execFileSync("ps", ["-o", "ppid=,comm=", "-p", String(cur)], OPTS).trim();
      if (!line) return null;
      const m = line.match(/^(\d+)\s+(.*)$/);
      if (!m) return null;
      if (agentRe.test(m[2].trim())) return cur;
      cur = parseInt(m[1], 10);
      if (!Number.isFinite(cur) || cur <= 1) return null;
    }
  } catch { /* best effort */ }
  return null;
}

function winProcs() {
  try {
    const out = pwsh(
      `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq '${winName}' } | ` +
        "Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress"
    );
    const parsed = JSON.parse(out || "null");
    const arr = parsed === null ? [] : Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, name: p.Name }));
  } catch { return []; }
}

function pwsh(command) {
  return execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], OPTS);
}

export { IS_WIN, AGENT };
