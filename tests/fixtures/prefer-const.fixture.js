// Test fixture for rule: prefer-const

// ruleid: prefer-const
let pi = 3.14159;

// ok: prefer-const
const pi = 3.14159;

/* --- INPUT FIX ---
let staticValue = 42;
--- */

/* --- EXPECTED FIX ---
const staticValue = 42;
--- */
