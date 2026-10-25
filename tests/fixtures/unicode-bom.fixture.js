// Test fixture for rule: unicode-bom

// ruleid: unicode-bom
﻿const bom = true;

// ok: unicode-bom
const noBom = true;

/* --- INPUT FIX ---
﻿const value = 42;
--- */

/* --- EXPECTED FIX ---
const value = 42;
--- */
