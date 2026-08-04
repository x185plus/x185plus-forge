# X185Plus Community Repair Rules

Community-maintained repair rules for the X185Plus scanner. This repository holds deterministic, human-readable rule definitions that describe how a specific finding should be fixed — no proprietary logic, no external services, just pattern/fix pairs and small structural handlers.

MIT licensed. Contributions welcome.

## Structure

```
schema/
  repair-rule.schema.json   # formal JSON schema for .rule.json files
rules/
  pilot/                    # built-in pilot pack (9 rules)
  community/                # community-contributed rules
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

- **pilot** -- built-in rules shipped by default
- **local-proven** -- passed a local proof gate (parse + rescan) before being trusted
- **local-unproven** -- a stored pattern that has not been auto-applied yet
- **governed** -- passed a stricter review/governance process before being trusted

## Contributing

1. Add a new `.rule.json` file under `rules/community/` that validates against `schema/repair-rule.schema.json`.
2. Add an entry for it in `index.json`.
3. Open a pull request describing the finding the rule fixes and why the fix is safe.

## License

MIT — see [LICENSE](LICENSE).
