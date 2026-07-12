#!/usr/bin/env node
// Deck CLI — never lose your Claude Code sessions again.
//   deck status | snapshot | restore [--dry-run] | backup | install | uninstall
//   deck hook --open|--turn      (invoked by Claude Code hooks, not by you)
import { status } from "../src/status.mjs";
import { snapshot } from "../src/snapshot.mjs";
import { restore } from "../src/restore.mjs";
import { backup } from "../src/backup.mjs";
import { record } from "../src/record.mjs";
import { install, uninstall } from "../src/install.mjs";

const [cmd, ...args] = process.argv.slice(2);
const has = (f) => args.includes(f);

try {
  switch (cmd) {
    case "status":
      console.log(status());
      break;

    case "snapshot": {
      const snap = snapshot({ write: true });
      if (has("--verbose")) console.log(JSON.stringify(snap, null, 2));
      else console.log(`Snapshot: ${snap.sessionCount} live session(s) captured.`);
      break;
    }

    case "restore": {
      const res = restore({ dryRun: has("--dry-run") });
      if (!res.ok) { console.error("Restore failed:", res.reason); process.exit(1); }
      if (res.dryRun) {
        console.log(`Would restore ${res.count} session(s) (source: ${res.source}):`);
        for (const s of res.sessions) console.log(`  ${s.id}  ${s.cwd}  ${s.preview || ""}`);
      } else {
        console.log(`Restoring ${res.count} session(s) into ${res.windows} window(s) [${res.mode}].`);
        if (res.hint) console.log(`  launch:  ${res.hint}`);
      }
      break;
    }

    case "backup": {
      const r = backup({ verbose: has("--verbose") });
      console.log(`Backup: ${r.copied} new/changed of ${r.seen} transcript(s) -> ${r.dest}`);
      break;
    }

    case "install": {
      const r = install();
      console.log("Deck installed." + (r.settingsChanged ? " Hooks added to Claude settings." : " Hooks already present."));
      console.log("Config:", r.config);
      for (const line of r.next) console.log(line);
      break;
    }

    case "uninstall": {
      const r = uninstall();
      console.log("Deck hooks " + (r.settingsChanged ? "removed." : "were not present."));
      break;
    }

    case "hook": {
      // Called by Claude Code with the hook JSON on stdin.
      record(has("--turn") ? "turn" : "open");
      break;
    }

    default:
      console.log(`Deck — never lose your Claude Code sessions.

  deck status               show your grid + what's recorded + backup proof
  deck restore [--dry-run]  rebuild your grid after a restart
  deck snapshot             capture live sessions now (also runs every minute)
  deck backup               mirror transcripts to the safe backup now
  deck install              wire the recorder hooks + config
  deck uninstall            remove the hooks
`);
      if (cmd && cmd !== "help" && cmd !== "--help" && cmd !== "-h") process.exit(2);
  }
} catch (e) {
  console.error("deck:", e && e.message ? e.message : e);
  process.exit(1);
}
