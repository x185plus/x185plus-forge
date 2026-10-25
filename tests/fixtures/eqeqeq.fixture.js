// Test fixture for rule: eqeqeq

// ruleid: eqeqeq
if (x == "1") {
  console.log(x);
}

// ok: eqeqeq
if (x === "1") {
  console.log(x);
}

/* --- INPUT FIX ---
const isMatch = a==b;
--- */

/* --- EXPECTED FIX ---
const isMatch = a===b;
--- */
