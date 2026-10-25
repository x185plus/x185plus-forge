// Test fixture for rule: unused-import

// ruleid: unused-import
import { unusedFn, activeFn } from "./module";

// ok: unused-import
import { activeFn } from "./module";

/* --- INPUT FIX ---
import { unusedFn, activeFn } from "./module";
--- */

/* --- EXPECTED FIX ---
import { activeFn } from "./module";
--- */
