import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { isSessionPane, clean } from "../src/wezterm.mjs";
import { transcriptMeta } from "../src/transcripts.mjs";
import { doctor } from "../src/doctor.mjs";
import { liveAgentPids, resolveOwningPid } from "../src/proc.mjs";
import { parsePanes } from "../src/tmux.mjs";
import { backend, backendNames } from "../src/terminal.mjs";

test("isSessionPane: bare shells are not sessions", () => {
  for (const t of ["cmd.exe", "powershell.exe", "pwsh.exe", "bash", "zsh", "C:\\WINDOWS\\system32\\cmd.exe".split("\\").pop()]) {
    assert.equal(isSessionPane(t), false, `${t} should not be a session pane`);
  }
});

test("isSessionPane: real titles are sessions", () => {
  for (const t of ["Claude Code", "Fix claude-a resume missing accounts", "Deploy prod"]) {
    assert.equal(isSessionPane(t), true, `${t} should be a session pane`);
  }
});

test("clean strips non-printable/spinner glyphs", () => {
  assert.equal(clean("⠉ Claude Code ⠀"), "Claude Code");
  assert.equal(clean(null), "");
});

test("transcriptMeta pulls cwd + last human preview from a transcript tail", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "deck-test-"));
  const f = path.join(dir, "sess.jsonl");
  const lines = [
    JSON.stringify({ type: "user", cwd: "C:/Dev/foo", message: { role: "user", content: "first message" } }),
    JSON.stringify({ type: "assistant", message: { role: "assistant", content: "hi" } }),
    JSON.stringify({ type: "user", cwd: "C:/Dev/foo", message: { role: "user", content: [{ type: "tool_result", content: "x" }] } }),
    JSON.stringify({ type: "user", cwd: "C:/Dev/foo", message: { role: "user", content: "the real last question here" } }),
  ];
  writeFileSync(f, lines.join("\n") + "\n");
  const meta = transcriptMeta(f);
  assert.equal(meta.cwd, "C:/Dev/foo");
  assert.equal(meta.preview, "the real last question here");
});

test("proc: liveAgentPids returns a Set and never throws (cross-platform)", () => {
  const pids = liveAgentPids();
  assert.ok(pids instanceof Set);
  for (const p of pids) assert.equal(typeof p, "number");
});

test("proc: resolveOwningPid(null) is null, never throws", () => {
  assert.equal(resolveOwningPid(null), null);
  assert.equal(resolveOwningPid(0), null);
});

test("tmux parsePanes maps tab-separated rows to pane objects", () => {
  const raw = "$0\t@1\t%2\tClaude Code\t/home/me/proj\n$0\t@1\t%3\tbash\t/home/me\n";
  const panes = parsePanes(raw);
  assert.equal(panes.length, 2);
  assert.deepEqual(panes[0], { window_id: "$0", tab_id: "@1", pane_id: "%2", title: "Claude Code", cwd: "/home/me/proj" });
  assert.equal(panes[1].cwd, "/home/me");
  assert.deepEqual(parsePanes(""), []);
});

test("terminal.backend selects by name, falls back to wezterm", () => {
  assert.ok(backendNames().includes("tmux"));
  assert.equal(typeof backend("wezterm").restoreGrid, "function");
  assert.equal(typeof backend("tmux").listPanes, "function");
  // unknown name -> wezterm fallback (has restoreGrid)
  assert.equal(typeof backend("nope").restoreGrid, "function");
});

test("doctor runs and returns a report + numeric fail count", () => {
  const r = doctor();
  assert.equal(typeof r.text, "string");
  assert.ok(r.text.includes("Deck doctor"));
  assert.equal(typeof r.fails, "number");
  assert.ok(r.fails >= 0);
});

test("transcriptMeta skips hook/noise messages when choosing preview", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "deck-test-"));
  const f = path.join(dir, "sess2.jsonl");
  const lines = [
    JSON.stringify({ type: "user", cwd: "C:/Dev/bar", message: { role: "user", content: "genuine ask" } }),
    JSON.stringify({ type: "user", cwd: "C:/Dev/bar", message: { role: "user", content: "Stop hook feedback: blah" } }),
  ];
  writeFileSync(f, lines.join("\n") + "\n");
  const meta = transcriptMeta(f);
  assert.equal(meta.preview, "genuine ask");
});
