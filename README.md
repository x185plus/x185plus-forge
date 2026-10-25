# X185Plus Forge — Public Governed Repair Rule Index

[![Forge Public Rule CI](https://github.com/x185plus/x185plus-forge/actions/workflows/ci.yml/badge.svg)](https://github.com/x185plus/x185plus-forge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Public governed repair rule index for the X185Plus pilot pack, community-proven patterns, and deterministic AST rules loaded directly by the X185Plus batch repair engine.

---

## 🛡️ The Invariant: Deterministic by Design

> ### ⚠️ Universal System Law
> **You cannot apply a non-deterministic repair by design. We proved it.**

In modern software development, guessing is dangerous. While generative AI models can suggest candidate patches or explain syntax anomalies in sandbox environments, **probabilistic AI output is never permitted to autonomously mutate code in production**. 

In X185Plus, every applied repair is grounded in **mathematical AST determinism**:
1. **We mint our own recipes from AI and the engine:** Candidate patterns synthesized by AI assistants or discovered by the analysis engine are distilled into strict, deterministic AST transformation recipes.
2. **Deterministic Replay:** A recipe must take an exact syntax pattern and produce an identical, byte-reproducible AST replacement every single time.
3. **Fail-Closed Verification:** If a proposed repair cannot be proven deterministically through AST parse gates and syntax postconditions, the system refuses to apply it.

---

## 📦 What is X185Plus Forge?

`x185plus-forge` is the **open-source community hub** for sharing, validating, and distributing governed repair rules under the permissive [MIT License](LICENSE).

It provides:
* **Zero-Secret Public Registry:** An open catalog of vetted AST repair patterns accessible without private keys or tokens.
* **Direct IDE Integration:** The X185Plus Mini IDE and batch runner load rules directly from this repository via GitHub raw endpoints.
* **Offline Sandbox Safety:** All recipes in this index can execute offline in local developer environments with complete blast-radius containment.

---

## 🔄 The 3-Step Human-Controlled Repair Flow

```
   [1. SCAN]                   [2. REPAIR]                [3. PROVE & APPLY]
Inspect findings with       Review the deterministic    Evaluate AST proof gates &
deterministic detectors   →   proposed AST recipe     →  explicitly authorise application
```

1. **Scan:** Detect potential syntax anomalies, type-coercion bugs, or security patterns.
2. **Repair:** Load the matching recipe minted from AI and the engine. Inspect the side-by-side Monaco diff.
3. **Prove & Apply:** Review the verification checks. The human developer retains final authority to apply the change.

---

## 🛠️ Community Rule Structure

Rules in this repository are defined as clean JSON documents:

```json
{
  "ruleId": "quality/loose-equality",
  "description": "Replace non-strict equality (==) with strict equality (===) to prevent unexpected type coercion.",
  "pattern": "([a-zA-Z0-9_$.]+)\\s*==\\s*([a-zA-Z0-9_$.]+)",
  "fix": "$1 === $2",
  "severity": "medium",
  "confidence": "pilot",
  "aliases": ["eqeqeq", "quality-loose-equality"],
  "tags": ["type-safety", "equality", "clean-code"]
}
```

### Rule Fields:
* **`ruleId`**: Canonical namespaced identifier (e.g. `quality/loose-equality`).
* **`description`**: Clear rationale explaining why the change is necessary.
* **`pattern`**: Deterministic regular expression or AST selector matching the target code.
* **`fix`**: Deterministic replacement string.
* **`handler`**: Optional built-in AST handler (e.g. `unused-import-line`).
* **`severity`**: `critical` | `high` | `medium` | `low` | `info`
* **`confidence`**: `pilot` | `local-proven` | `local-unproven` | `gold`

---

## 🚀 Contributing Rules

We welcome community contributions! To add a new rule:
1. Fork this repository.
2. Create your rule under `rules/<category>/<rule-name>.rule.json`.
3. Add your rule entry to `index.json`.
4. Run the local validator:
   ```bash
   npm test
   ```
5. Submit a Pull Request. The public GitHub Action will automatically verify schema validity and AST determinism.

---

## 📄 License

This repository is licensed under the [MIT License](LICENSE).

