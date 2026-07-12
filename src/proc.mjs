// Process enumeration + ancestor walk-up.
//
// The load-bearing trick: a Claude Code hook is spawned through a transient
// launcher (a cmd.exe/shell that dies right after), so `process.ppid` is NOT a
// usable liveness key. We walk UP the parent chain from the hook until we hit the
// owning `claude` process, and record THAT pid — it is stable for the session's
// whole life and lets the snapshot tell "still open" from "closed" deterministically.
import { execFileSync } from "node:child_process";

const IS_WIN = process.platform === "win32";
const AGENT_NAMES = ["claude.exe", "claude", "node.exe", "node"]; // process names that can be a session root

// All live agent PIDs, as a Set<number>.
export function liveAgentPids() {
  if (IS_WIN) {
    const rows = winProcs();
    return new Set(rows.filter((p) => /^claude(\.exe)?$/i.test(p.name)).map((p) => p.pid));
  }
  return new Set(posixClaudePids());
}

// Walk up from `startPid` to the nearest `claude` process; return its pid or null.
export function resolveOwningPid(startPid) {
  if (!startPid) return null;
  try {
    if (IS_WIN) {
      const ps =
        `$cur=${startPid}; for($i=0;$i -lt 12;$i++){` +
        `$p=Get-CimInstance Win32_Process -Filter "ProcessId=$cur" -ErrorAction SilentlyContinue;` +
        `if(-not $p){break}; if($p.Name -eq 'claude.exe'){Write-Output $cur; break}; $cur=$p.ParentProcessId}`;
      const out = pwsh(ps).trim();
      const pid = parseInt(out, 10);
      return Number.isFinite(pid) ? pid : null;
    }
    // POSIX: walk `ps -o ppid=,comm=` up the chain.
    let cur = startPid;
    for (let i = 0; i < 12; i++) {
      const line = execFileSync("ps", ["-o", "ppid=,comm=", "-p", String(cur)], { encoding: "utf8" }).trim();
      if (!line) return null;
      const [ppid, ...rest] = line.split(/\s+/);
      const comm = rest.join(" ");
      if (/(^|\/)claude$/.test(comm)) return cur;
      cur = parseInt(ppid, 10);
      if (!Number.isFinite(cur) || cur <= 1) return null;
    }
  } catch { /* best effort */ }
  return null;
}

function winProcs() {
  try {
    const out = pwsh(
      "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'claude.exe' } | " +
        "Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress"
    );
    const parsed = JSON.parse(out || "null");
    const arr = parsed === null ? [] : Array.isArray(parsed) ? parsed : [parsed];
    return arr.map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, name: p.Name }));
  } catch { return []; }
}

function posixClaudePids() {
  try {
    const out = execFileSync("pgrep", ["-x", "claude"], { encoding: "utf8" });
    return out.split("\n").map((s) => parseInt(s, 10)).filter(Number.isFinite);
  } catch { return []; }
}

function pwsh(command) {
  return execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 8000,
  });
}

export { IS_WIN, AGENT_NAMES };
