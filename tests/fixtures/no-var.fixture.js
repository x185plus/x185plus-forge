// Test fixture for rule: no-var

// ruleid: no-var
var count = 10;

// ok: no-var
const count = 10;

/* --- INPUT FIX ---
var total = 100;
--- */

/* --- EXPECTED FIX ---
let total = 100;
--- */
