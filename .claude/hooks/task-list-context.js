// SessionStart hook: puts the launch tracker's "Resume here" block and the
// task-list rule into Claude's context at the start of every session.
const fs = require("fs");
const path = require("path");

const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const trackerPath = path.join(root, "docs", "launch", "README.md");

let resume = "(could not read docs/launch/README.md)";
try {
  const text = fs.readFileSync(trackerPath, "utf8").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.startsWith("### Resume here"));
  if (start !== -1) {
    let end = lines.findIndex((l, i) => i > start && /^#{2,3} /.test(l));
    if (end === -1) end = lines.length;
    resume = lines.slice(start, end).join("\n").trim();
  }
} catch {
  // Tracker missing: still emit the rule below.
}

const context = [
  "Task list: docs/launch/README.md (live tracker; phase files beside it, feature specs in docs/superpowers/specs/).",
  "Rule (CLAUDE.md, \"Task list - keep it current\"): any new task raised this session gets written into the tracker before the session ends; finished tasks are ticked with the date in the same commit; refresh \"Resume here\" when the next step changes.",
  "",
  resume,
].join("\n");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
  })
);
