# x185plus-forge

Community repair rules for the X185Plus scanner.

## Structure

```
schema/
  repair-rule.schema.json   # formal JSON schema for .rule.json files
rules/
  pilot/                    # built-in pilot pack rules
  community/                # community-contributed rules (promoted templates)
  gold-derived/             # patterns derived from Gold-certified repairs
index.json                  # manifest of all rules with status and trust level
```

## Rule format

Each `.rule.json` file contains a single repair rule:

```json
{
  "ruleId": "security/hardcoded-secret",
  "pattern": "regex source (not /delimited/)",
  "fix": "replacement string ($1..$9, $U1 = uppercase group 1)",
  "severity": "critical",
  "category": "Security",
  "flags": "gi",
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

The X185Plus Detectors workspace loads rules from this repo via the GitHub API. Click "Load forge rules from GitHub" in the Rules panel.
