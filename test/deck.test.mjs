import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdtempSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { isSessionPane, clean } from "../src/wezterm.mjs";
import { transcriptMeta } from "../src/transcripts.mjs";
import { doctor } from "../src/doctor.mjs";

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
