# x185plus-forge

Community repair rules for the X185Plus scanner.

## Structure

```
schema/
  repair-rule.schema.json   # formal JSON schema for .rule.json files
rules/
  pilot/                    # built-in pilot pack (9 rules)
  community/                # community-contributed rules
  gold-derived/             # patterns derived from Gold-certified repairs
index.json                  # manifest of all rules with status and trust level
```

## Rule format

Each `.rule.json` file contains a single repair rule:

```json
{
  "ruleId": "eqeqeq",
  "pattern": "([^=!<>])==([^=])",
  "fix": "$1===$2",
  "severity": "medium",
  "category": "Quality",
  "flags": "g",
  "confidence": "pilot",
  "aliases": ["quality/eqeqeq", "no-eq-null"]
}
```

Handler rules (no regex) use `handler` + empty `pattern`/`fix`:

```json
{
  "ruleId": "unused-import",
  "pattern": "",
  "fix": "",
  "handler": "unused-import-line",
  "confidence": "pilot"
}
```

See `schema/repair-rule.schema.json` for the full schema.

## Trust levels

- **pilot** -- built-in rules shipped with X185Plus
- **local-proven** -- passed Local Forge proof gate (parse + rescan)
- **local-unproven** -- stored pattern, never auto-applied
- **gold** -- Gold-certified (Supabase-backed, not stored here)

## Usage

The X185Plus Detectors workspace and batch producer load rules from this repo via the GitHub API. Rules are injected through `injectRepairRules()` in `src/lib/repair/rules/ruleIndex.ts`.
