// Test fixture for rule: no-multiple-empty-lines

// ruleid: no-multiple-empty-lines
const a = 1;




const b = 2;

// ok: no-multiple-empty-lines
const x = 1;

const y = 2;

/* --- INPUT FIX ---
const a = 1;




const b = 2;
--- */

/* --- EXPECTED FIX ---
const a = 1;


const b = 2;
--- */
