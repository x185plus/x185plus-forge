// Test fixture for rule: security/hardcoded-secret

// ruleid: security/hardcoded-secret
const api_key = "AIzaSyD1234567890abcdef";

// ok: security/hardcoded-secret
const api_key = process.env.API_KEY;

/* --- INPUT FIX ---
const api_key = "AIzaSyD1234567890abcdef";
--- */

/* --- EXPECTED FIX ---
const api_key = process.env.API_KEY;
--- */
