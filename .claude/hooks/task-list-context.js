// SessionStart hook: puts the ticket list's "Resume here" block, the next free
// ticket ID and the ticket rule into Claude's context at the start of every session.
const fs = require("fs");
const path = require("path");

const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..");
const ticketsPath = path.join(root, "docs", "TICKETS.md");

let resume = "(could not read docs/TICKETS.md)";
let nextId = "";
try {
  const text = fs.readFileSync(ticketsPath, "utf8").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const start = lines.findIndex((l) => /^#{2,3} Resume here/.test(l));
  if (start !== -1) {
    let end = lines.findIndex((l, i) => i > start && /^#{2,3} /.test(l));
    if (end === -1) end = lines.length;
    resume = lines.slice(start, end).join("\n").trim();
  }
  const m = text.match(/Next ID:\s*(T-\d+)/);
  if (m) nextId = m[1];
} catch {
  // Ticket list missing: still emit the rule below.
}

const context = [
  `Ticket list: docs/TICKETS.md (Next ID: ${nextId || "unknown"}; launch phase detail in docs/launch/, feature specs in docs/superpowers/specs/).`,
  "Rule (CLAUDE.md, \"Work rules (this repo)\"): any new task raised this session gets a T-ID and a line in TICKETS.md right away (bump Next ID); finished tickets are ticked with the date and PR in their own PR; refresh \"Resume here\" when the next step changes. One branch per ticket off main; merge only when the user says so.",
  "",
  resume,
].join("\n");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: context },
  })
);
