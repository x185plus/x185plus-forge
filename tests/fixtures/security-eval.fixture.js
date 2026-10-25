// Test fixture for rule: security/eval

// ruleid: security/eval
eval(untrustedInput);

// ok: security/eval
JSON.parse(untrustedInput);

/* --- INPUT FIX ---
eval(payload);
--- */

/* --- EXPECTED FIX ---
/* x185-rule:eval-removed */ void(payload);
--- */
