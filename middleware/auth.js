// ==============================================
// AUTHENTICATION MIDDLEWARE
// ==============================================
// Middleware are functions that run BETWEEN the
// incoming request and your route handler. They
// sit in the "middle" of the request pipeline.
//
// Think of middleware as a security guard at a
// building entrance. The guard checks your ID
// before letting you into certain rooms.
//
// HOW next() WORKS:
// Every middleware receives three arguments:
// (req, res, next). When you call next(), it
// passes control to the NEXT middleware or route
// handler in the chain. If you DON'T call next(),
// the request gets stuck and the client hangs.
//
// WHAT ARE JWT TOKENS?
// JWT (JSON Web Token) is a compact, self-contained
// way to transmit information between parties as a
// JSON object. When a user logs in, the server
// creates a JWT containing the user's ID, signs it
// with a secret key, and sends it to the client.
// The client then includes this token in every
// subsequent request to prove their identity.
//
// A JWT has three parts separated by dots:
// header.payload.signature
// Example: eyJhbGci...eyJ1c2Vy...SflKxwRJ...
//
// WHAT ARE BEARER TOKENS?
// "Bearer" is the type of authentication scheme.
// The word "Bearer" literally means "the person
// carrying this token." The client sends the token
// in the Authorization header like this:
// Authorization: Bearer eyJhbGci...
//
// The server extracts the token by removing the
// "Bearer " prefix and then verifies it.
// ==============================================

// Import jsonwebtoken for creating and verifying JWT tokens
const jwt = require('jsonwebtoken');

// Import the User model to look up users by their ID
const User = require('../models/User');

// Read the JWT secret key from environment variables.
// This secret is used to SIGN and VERIFY tokens.
// It should be a long, random string that only the
// server knows. If someone gets this secret, they
// could forge tokens and impersonate any user!
const JWT_SECRET = process.env.JWT_SECRET;

// ------------------------------------------
// requireAuth Middleware
// ------------------------------------------
// This middleware BLOCKS the request if the user
// is not logged in. Use this for protected routes
// like creating reviews, managing watchlists, etc.
//
// If the token is valid, it attaches the user
// object to req.user so route handlers can use it.
//
// USAGE IN ROUTES:
// router.get('/profile', requireAuth, async (req, res) => {
// // req.user is available here!
// res.json(req.user);
// });

const requireAuth = async (req, res, next) => {
 try {
 // STEP 1: Get the token from the Authorization header.
 // The header looks like: "Bearer eyJhbGci..."
 const authHeader = req.headers.authorization;

 // Check if the header exists and starts with "Bearer "
 if (!authHeader || !authHeader.startsWith('Bearer ')) {
 return res.status(401).json({
 error: 'Access denied',
 message: 'Please log in to continue',
 });
 }

 // STEP 2: Extract the token by removing the "Bearer " prefix.
 // "Bearer eyJhbGci...".split(' ') → ["Bearer", "eyJhbGci..."]
 // We want index [1] which is the actual token.
 const token = authHeader.split(' ')[1];

 // STEP 3: Verify the token using the secret key.
 // jwt.verify() checks:
 // - Is the token properly signed with our secret?
 // - Has the token expired?
 // - Has the token been tampered with?
 // If any check fails, it throws an error.
 const decoded = jwt.verify(token, JWT_SECRET);

 // STEP 4: Find the user in the database using the
 // userId stored inside the token.
 //
 // WHY .select('-password')?
 // The select('-password') tells Mongoose to return
 // ALL fields EXCEPT the password. Even though the
 // password is hashed, there's no reason to include
 // it in req.user. This is a security best practice
 // called "principle of least privilege."
 const user = await User.findById(decoded.userId).select('-password');

 // If no user was found (maybe the account was deleted
 // after the token was issued), deny access.
 if (!user) {
 return res.status(401).json({
 error: 'Access denied',
 message: 'User not found',
 });
 }

 // STEP 5: Attach the user to the request object.
 // Now any route handler that runs after this middleware
 // can access the logged-in user via req.user.
 req.user = user;

 // Call next() to pass control to the next middleware
 // or route handler in the chain.
 next();
 } catch (error) {
 // If the token is invalid, expired, or tampered with,
 // jwt.verify() will throw an error. We catch it here
 // and send a 401 (Unauthorized) response.
 console.error('Auth middleware error:', error.message);
 return res.status(401).json({
 error: 'Access denied',
 message: 'Invalid or expired token',
 });
 }
};

// ------------------------------------------
// optionalAuth Middleware
// ------------------------------------------
// This middleware is DIFFERENT from requireAuth.
// It tries to authenticate the user, but if there's
// no token or the token is invalid, it just continues
// WITHOUT blocking the request.
//
// USE CASE: A route that works for everyone but
// shows extra info for logged-in users. For example,
// a movie page that shows "Add to Favorites" only
// if the user is logged in.
//
// USAGE IN ROUTES:
// router.get('/movies', optionalAuth, async (req, res) => {
// if (req.user) {
// // User is logged in — show personalized content
// } else {
// // User is anonymous — show generic content
// }
// });

const optionalAuth = async (req, res, next) => {
 try {
 const authHeader = req.headers.authorization;

 // Only try to authenticate if a Bearer token is present
 if (authHeader && authHeader.startsWith('Bearer ')) {
 const token = authHeader.split(' ')[1];
 const decoded = jwt.verify(token, JWT_SECRET);
 const user = await User.findById(decoded.userId).select('-password');

 // Attach user if found (don't throw if not found)
 if (user) req.user = user;
 }
 } catch (error) {
 // Token is invalid or expired — that's totally fine.
 // We just continue without attaching a user.
 // No error response here, because authentication
 // is OPTIONAL for this middleware.
 }

 // Always call next(), whether or not we found a user.
 // This is the key difference from requireAuth!
 next();
};

// ------------------------------------------
// Export the Middleware Functions
// ------------------------------------------
// We export both functions so routes can import
// whichever one they need:
// const { requireAuth } = require('../middleware/auth');
// const { optionalAuth } = require('../middleware/auth');

module.exports = { requireAuth, optionalAuth };
