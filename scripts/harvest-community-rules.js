#!/usr/bin/env node

/*
 * Harvests a small, hand-vetted set of ESLint core rules and converts them
 * into this repo's .rule.json schema (regex pattern/fix only -- no AST).
 *
 * Only rules with a genuinely safe, deterministic regex fix are included.
 * Most ESLint core rules are AST-based and cannot be soundly reduced to a
 * find/replace regex (e.g. blindly collapsing ";;" would break `for(;;){}`),
 * so this harvester does not attempt to auto-convert arbitrary rules -- it
 * fetches each candidate's real upstream source to confirm it still exists
 * and pulls its description, then emits only the rules in VETTED_RULES below.
 *
 * Semgrep is intentionally excluded: semgrep-rules is governed by the
 * "Semgrep Rules License v1.0" (semgrep.dev/legal/rules-license), not MIT,
 * so it cannot be attributed as MIT here.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const COMMUNITY_DIR = path.join(REPO_ROOT, "rules", "community");
const INDEX_PATH = path.join(REPO_ROOT, "index.json");
const NOTICE_PATH = path.join(REPO_ROOT, "NOTICE.md");

const ESLINT_LICENSE_TEXT = "MIT License -- Copyright OpenJS Foundation and other contributors, <www.openjsfoundation.org>";
const ESLINT_RAW_BASE = "https://raw.githubusercontent.com/eslint/eslint/main/lib/rules/";
const ESLINT_DOCS_BASE = "https://eslint.org/docs/latest/rules/";

const VETTED_RULES = [
  {
    ruleId: "no-trailing-spaces",
    eslintRuleFile: "no-trailing-spaces.js",
    severity: "info",
    category: "Style",
    flags: "gm",
    pattern: "[ \\t]+$",
    fix: "",
    aliases: ["style/no-trailing-spaces"]
  },
  {
    ruleId: "no-multiple-empty-lines",
    eslintRuleFile: "no-multiple-empty-lines.js",
    severity: "info",
    category: "Style",
    flags: "g",
    // Matches ESLint's default max:2 (up to 2 blank lines allowed == up to
    // 3 newline characters); 4+ consecutive newlines get collapsed to 3.
    pattern: "\\n{4,}",
    fix: "\n\n\n",
    aliases: ["style/no-multiple-empty-lines"]
  },
  {
    ruleId: "no-irregular-whitespace",
    eslintRuleFile: "no-irregular-whitespace.js",
    severity: "low",
    category: "Security",
    flags: "g",
    // Non-standard whitespace characters (excludes normal space/tab/newline
    // and line/paragraph separators, which ESLint treats as line terminators).
    pattern: "[\\f\\v\\u00a0\\u1680\\u180e\\u2000-\\u200a\\u202f\\u205f\\u3000\\ufeff]",
    fix: " ",
    aliases: ["security/no-irregular-whitespace"]
  }
];

function listExistingRuleIds() {
  const ids = new Set();
  const dirs = [path.join(REPO_ROOT, "rules", "pilot"), COMMUNITY_DIR];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".rule.json")) continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
        if (data.ruleId) ids.add(data.ruleId);
      } catch {
        // ignore unparsable file, existence check falls back to filename below
      }
    }
  }
  return ids;
}

async function fetchDescription(ruleFile) {
  const url = ESLINT_RAW_BASE + ruleFile;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const source = await res.text();
  const match = source.match(/description:\s*["'`]([^"'`]+)["'`]/);
  return { url, description: match ? match[1] : null };
}

function loadIndex() {
  if (!fs.existsSync(INDEX_PATH)) {
    return { version: "1.0.0", rules: [] };
  }
  return JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
}

function saveIndex(index) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n");
}

function updateNotice(newEntries) {
  const START = "<!-- COMMUNITY-RULE-ATTRIBUTION:START -->";
  const END = "<!-- COMMUNITY-RULE-ATTRIBUTION:END -->";
  let notice = fs.readFileSync(NOTICE_PATH, "utf8");
  const startIdx = notice.indexOf(START);
  const endIdx = notice.indexOf(END);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error("NOTICE.md is missing the COMMUNITY-RULE-ATTRIBUTION markers");
  }

  const existingBlock = notice.slice(startIdx + START.length, endIdx).trim();
  const existingRows = [];
  const rowRe = /^\|\s*`([^`]+)`\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/gm;
  let m;
  while ((m = rowRe.exec(existingBlock)) !== null) {
    existingRows.push({ ruleId: m[1], source: m[2], license: m[3], notes: m[4] });
  }

  const byRuleId = new Map(existingRows.map((r) => [r.ruleId, r]));
  for (const entry of newEntries) {
    byRuleId.set(entry.ruleId, entry);
  }

  const rows = Array.from(byRuleId.values()).sort((a, b) => a.ruleId.localeCompare(b.ruleId));
  const table =
    rows.length === 0
      ? "_No harvested rules yet._"
      : [
          "| Rule | Source | License | Notes |",
          "|------|--------|---------|-------|",
          ...rows.map((r) => `| \`${r.ruleId}\` | ${r.source} | ${r.license} | ${r.notes} |`)
        ].join("\n");

  notice = notice.slice(0, startIdx + START.length) + "\n" + table + "\n" + notice.slice(endIdx);
  fs.writeFileSync(NOTICE_PATH, notice);
}

async function main() {
  fs.mkdirSync(COMMUNITY_DIR, { recursive: true });

  const existingIds = listExistingRuleIds();
  const index = loadIndex();
  const indexedIds = new Set(index.rules.map((r) => r.ruleId));

  const added = [];
  const skipped = [];
  const noticeEntries = [];

  for (const rule of VETTED_RULES) {
    const targetPath = path.join(COMMUNITY_DIR, `${rule.ruleId}.rule.json`);

    if (fs.existsSync(targetPath) || existingIds.has(rule.ruleId)) {
      skipped.push({ ruleId: rule.ruleId, reason: "already exists, not overwritten" });
      continue;
    }

    let description = null;
    let sourceUrl = ESLINT_DOCS_BASE + rule.ruleId;
    try {
      const meta = await fetchDescription(rule.eslintRuleFile);
      description = meta.description;
    } catch (err) {
      skipped.push({ ruleId: rule.ruleId, reason: `upstream fetch failed: ${err.message}` });
      continue;
    }

    const ruleFile = {
      ruleId: rule.ruleId,
      pattern: rule.pattern,
      fix: rule.fix,
      severity: rule.severity,
      category: rule.category,
      flags: rule.flags,
      confidence: "pilot",
      aliases: rule.aliases
    };

    fs.writeFileSync(targetPath, JSON.stringify(ruleFile, null, 2) + "\n");

    index.rules.push({
      ruleId: rule.ruleId,
      path: `rules/community/${rule.ruleId}.rule.json`,
      status: "active",
      trustLevel: "pilot"
    });
    indexedIds.add(rule.ruleId);

    noticeEntries.push({
      ruleId: rule.ruleId,
      source: `[ESLint core \`${rule.ruleId}\`](${sourceUrl})`,
      license: ESLINT_LICENSE_TEXT,
      notes: description ? `Simplified regex reimplementation. Upstream: "${description}"` : "Simplified regex reimplementation."
    });

    added.push(rule.ruleId);
  }

  if (added.length > 0) {
    saveIndex(index);
    updateNotice(noticeEntries);
  }

  console.log(`Harvest complete: ${added.length} added, ${skipped.length} skipped.`);
  if (added.length > 0) {
    console.log("Added:");
    for (const id of added) console.log(`  - ${id}`);
  }
  if (skipped.length > 0) {
    console.log("Skipped:");
    for (const s of skipped) console.log(`  - ${s.ruleId}: ${s.reason}`);
  }

  console.log("\nNote: .rule.json files are strict JSON and cannot contain comment headers.");
  console.log("Attribution for every harvested rule is recorded in NOTICE.md instead.");
}

main().catch((err) => {
  console.error("Harvest failed:", err);
  process.exitCode = 1;
});
