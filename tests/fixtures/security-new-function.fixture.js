// Test fixture for rule: security/new-function

// ruleid: security/new-function
const dyn = new Function("a", "b", "return a + b");

// ok: security/new-function
const dyn = (a, b) => a + b;

/* --- INPUT FIX ---
const fn = new Function("code");
--- */

/* --- EXPECTED FIX ---
const fn = /* x185-rule:new-function-removed */ void("code");
--- */
