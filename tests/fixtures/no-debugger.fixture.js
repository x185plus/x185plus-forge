// Test fixture for rule: no-debugger

// ruleid: no-debugger
debugger;

// ok: no-debugger
console.log("clean code without breakpoints");

/* --- INPUT FIX ---
function test() { debugger; }
--- */

/* --- EXPECTED FIX ---
function test() { /* x185-rule:debugger-removed */ }
--- */
