/* ==========================================================================
 CINETALE — Shared Authentication Utilities (auth.js)
 ==========================================================================
 This file is loaded on EVERY page BEFORE the page-specific JavaScript.
 It provides shared authentication utilities that all pages can use:

 - Token management (save, get, remove JWT from localStorage)
 - User info extraction from the JWT token payload
 - authFetch() — a drop-in replacement for fetch() that auto-adds the
 Authorization header so protected API endpoints work seamlessly
 - Navbar updates to show/hide login, profile, and logout links
 based on whether the user is currently logged in
 - escapeHTML() — a helper to prevent XSS when inserting user content

 -------------------------------------------------------------------------
 HOW JWT TOKENS WORK (brief overview for beginners):
 -------------------------------------------------------------------------
 A JWT (JSON Web Token) has 3 parts separated by dots:
 header.payload.signature

 The PAYLOAD (middle part) contains user data like:
 { userId: "abc123", name: "Alice", email: "alice@test.com", exp: 1735689600 }

 We decode the payload with atob() to read user info and check expiry.
 The token is stored in localStorage so it persists between page loads.
 ========================================================================== */


/* --------------------------------------------------------------------------
 1. TOKEN MANAGEMENT
 --------------------------------------------------------------------------
 Functions to save, retrieve, and remove the JWT token from localStorage.
 localStorage is a browser API that stores key-value pairs permanently
 (until the user clears browser data or we remove them manually).
 -------------------------------------------------------------------------- */

/**
 * getToken()
 * Retrieves the JWT token from localStorage.
 *
 * @returns {string|null} - The token string, or null if not logged in
 */
function getToken() {
 return localStorage.getItem('cinetale_token');
}

/**
 * setToken(token)
 * Saves the JWT token to localStorage after a successful login/register.
 *
 * @param {string} token - The JWT token string received from the server
 */
function setToken(token) {
 localStorage.setItem('cinetale_token', token);
}

/**
 * removeToken()
 * Deletes the JWT token from localStorage (used during logout).
 */
function removeToken() {
 localStorage.removeItem('cinetale_token');
}


/* --------------------------------------------------------------------------
 2. AUTH STATE HELPERS
 --------------------------------------------------------------------------
 Functions to check if the user is logged in and to extract user info
 from the JWT token payload.
 -------------------------------------------------------------------------- */

/**
 * isLoggedIn()
 * Checks whether the user is currently authenticated.
 * We do this by:
 * 1. Checking if a token exists
 * 2. Decoding the token payload to check the expiration time
 *
 * @returns {boolean} - true if the user has a valid, non-expired token
 */
function isLoggedIn() {
 const token = getToken();
 if (!token) return false;

 try {
 // JWT structure: header.payload.signature
 // We split by '.' and take the middle part (index 1 = payload)
 // atob() decodes a Base64-encoded string back to plain text
 const payload = JSON.parse(atob(token.split('.')[1]));

 // The 'exp' field is the expiry time in SECONDS since Unix epoch
 // Date.now() returns MILLISECONDS, so we multiply exp by 1000
 return payload.exp * 1000 > Date.now();
 } catch {
 // If decoding fails for any reason, treat as not logged in
 return false;
 }
}

/**
 * getUser()
 * Extracts the user information from the JWT token payload.
 *
 * @returns {Object|null} - User object { id, name, email } or null if no token
 */
function getUser() {
 const token = getToken();
 if (!token) return null;

 try {
 const payload = JSON.parse(atob(token.split('.')[1]));
 return {
 id: payload.userId,
 name: payload.name,
 email: payload.email
 };
 } catch {
 return null;
 }
}


/* --------------------------------------------------------------------------
 3. AUTH FETCH — Authenticated HTTP Requests
 --------------------------------------------------------------------------
 A wrapper around the browser's built-in fetch() function that
 automatically adds the Authorization header with the JWT token.

 This means we can use authFetch() exactly like fetch(), but it will
 include auth credentials on every request. Protected API endpoints
 (like /api/watchlist, /api/favorites) require this header.

 Usage example:
 const response = await authFetch('/api/watchlist');
 // This sends: Authorization: Bearer <token>
 -------------------------------------------------------------------------- */

/**
 * authFetch(url, options)
 * Works exactly like fetch() but auto-injects the Authorization header.
 *
 * @param {string} url - The URL to fetch
 * @param {Object} options - Standard fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} - The fetch Response object
 */
async function authFetch(url, options = {}) {
 const token = getToken();

 if (token) {
 // Merge our auth header with any existing headers
 // The spread operator (...) copies existing headers so we don't lose them
 options.headers = {
 ...options.headers,
 'Authorization': `Bearer ${token}`
 };
 }

 return fetch(url, options);
}


/* --------------------------------------------------------------------------
 4. NAVBAR UPDATE — Show/Hide Auth Links
 --------------------------------------------------------------------------
 Every page has a navbar with three auth-related elements:
 - loginLink → shown when NOT logged in
 - profileLink → shown when logged in
 - logoutBtn → shown when logged in

 This function checks the auth state and toggles visibility accordingly.
 -------------------------------------------------------------------------- */

/**
 * updateNavbar()
 * Shows or hides the login/profile/logout links in the navbar
 * based on whether the user is currently logged in.
 */
function updateNavbar() {
 const loginLink = document.getElementById('loginLink');
 const profileLink = document.getElementById('profileLink');
 const logoutBtn = document.getElementById('logoutBtn');

 // If any of these elements don't exist on the page, bail out
 if (!loginLink || !profileLink || !logoutBtn) return;

 if (isLoggedIn()) {
 // User IS logged in → hide login, show profile & logout
 loginLink.style.display = 'none';
 profileLink.style.display = 'inline-flex';
 logoutBtn.style.display = 'inline-flex';
 } else {
 // User is NOT logged in → show login, hide profile & logout
 loginLink.style.display = 'inline-flex';
 profileLink.style.display = 'none';
 logoutBtn.style.display = 'none';
 }
}


/* --------------------------------------------------------------------------
 5. LOGOUT
 --------------------------------------------------------------------------
 Removes the token and redirects to the home page.
 -------------------------------------------------------------------------- */

/**
 * logout()
 * Logs the user out by removing their token and redirecting home.
 */
function logout() {
 removeToken();
 window.location.href = '/';
}


/* --------------------------------------------------------------------------
 6. ESCAPE HTML — XSS Prevention
 --------------------------------------------------------------------------
 When inserting user-generated content (like review text or names) into
 the page, we MUST escape HTML special characters to prevent XSS attacks.

 XSS (Cross-Site Scripting) is when an attacker injects malicious
 <script> tags or HTML into a page via user input. escapeHTML() converts
 characters like < > & " into their safe HTML entity equivalents.
 -------------------------------------------------------------------------- */

/**
 * escapeHTML(str)
 * Converts a string so that HTML special characters are escaped.
 * Uses the browser's own text encoding by setting textContent (safe)
 * and then reading innerHTML (which gives us the escaped version).
 *
 * @param {string} str - The raw user input string
 * @returns {string} - The HTML-safe escaped string
 */
function escapeHTML(str) {
 if (!str) return '';
 const div = document.createElement('div');
 div.textContent = str;
 return div.innerHTML;
}


/* --------------------------------------------------------------------------
 7. INITIALIZE ON EVERY PAGE
 --------------------------------------------------------------------------
 This runs on every page load (since auth.js is included on every page).
 We update the navbar auth state and wire up the logout button.
 -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
 // Update navbar links based on login state
 updateNavbar();

 // Attach the logout handler to the logout button (if it exists)
 const logoutBtn = document.getElementById('logoutBtn');
 if (logoutBtn) {
 logoutBtn.addEventListener('click', logout);
 }
});
