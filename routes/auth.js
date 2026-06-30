// ==============================================
// AUTH ROUTES
// ==============================================
// These routes handle user registration, login,
// and profile management. They use JWT (JSON Web
// Tokens) for authentication — a popular way to
// keep users logged in without server-side sessions.
//
// How JWT auth works (simplified):
// 1. User sends email + password to /login
// 2. Server verifies credentials
// 3. Server creates a signed "token" (a long string)
// 4. User stores the token in their browser
// 5. User sends the token with every future request
// 6. Server verifies the token to know WHO is asking
// ==============================================

// Import Express and create a Router
const express = require('express');
const router = express.Router();

// Import jsonwebtoken — the library that creates and
// verifies JWT tokens. Think of it like a digital stamp
// that proves "this user has logged in successfully."
const jwt = require('jsonwebtoken');

// Import our User model to interact with the users
// collection in MongoDB
const User = require('../models/User');

// Import our auth middleware to protect certain routes
const { requireAuth } = require('../middleware/auth');

// Read the JWT secret key from environment variables.
// This secret is used to "sign" tokens — it's like
// the private key to a lock. NEVER share this!
const JWT_SECRET = process.env.JWT_SECRET;

// ------------------------------------------
// Helper: Generate JWT Token
// ------------------------------------------
// Creates a signed JWT token containing the user's
// ID, name, and email. The token expires in 7 days.
//
// @param {Object} user - The user object from MongoDB
// @returns {String} - A signed JWT token string

function generateToken(user) {
 return jwt.sign(
 {
 userId: user._id,
 name: user.name,
 email: user.email,
 },
 JWT_SECRET,
 { expiresIn: '7d' } // Token is valid for 7 days
 );
}

// ------------------------------------------
// POST /api/auth/register
// ------------------------------------------
// Creates a new user account.
//
// Request body: { name, email, password }
// Returns: { message, token, user }
//
// Example:
// POST http://localhost:3000/api/auth/register
// Body: { "name": "John", "email": "john@example.com", "password": "123456" }

router.post('/register', async (req, res) => {
 try {
 // Extract user data from the request body
 const { name, email, password } = req.body;

 // ------ Validation ------
 // Make sure all required fields are provided
 if (!name || !email || !password) {
 return res.status(400).json({
 error: 'Missing fields',
 message: 'Please provide name, email, and password',
 });
 }

 // Check password length (minimum 6 characters)
 if (password.length < 6) {
 return res.status(400).json({
 error: 'Password too short',
 message: 'Password must be at least 6 characters long',
 });
 }

 // Check if a user with this email already exists
 const existingUser = await User.findOne({ email: email.toLowerCase() });
 if (existingUser) {
 return res.status(409).json({
 error: 'Email already registered',
 message: 'An account with this email already exists. Try logging in instead.',
 });
 }

 // ------ Create User ------
 // Create a new User document. The password will be
 // automatically hashed by the pre('save') hook in
 // the User model — we don't hash it here!
 const user = new User({
 name: name.trim(),
 email: email.toLowerCase().trim(),
 password, // Will be hashed automatically
 });

 // Save the user to the database
 const savedUser = await user.save();

 // ------ Generate Token ------
 // Create a JWT token so the user is automatically
 // logged in after registering (no need to log in again)
 const token = generateToken(savedUser);

 // Send back the token and user info (WITHOUT password)
 res.status(201).json({
 message: 'Account created successfully! ',
 token,
 user: {
 id: savedUser._id,
 name: savedUser.name,
 email: savedUser.email,
 createdAt: savedUser.createdAt,
 },
 });
 } catch (error) {
 console.error('Error registering user:', error.message);

 // Handle MongoDB duplicate key error (email already exists)
 if (error.code === 11000) {
 return res.status(409).json({
 error: 'Email already registered',
 message: 'An account with this email already exists.',
 });
 }

 res.status(500).json({
 error: 'Registration failed',
 message: error.message,
 });
 }
});

// ------------------------------------------
// POST /api/auth/login
// ------------------------------------------
// Authenticates a user and returns a JWT token.
//
// Request body: { email, password }
// Returns: { message, token, user }
//
// Example:
// POST http://localhost:3000/api/auth/login
// Body: { "email": "john@example.com", "password": "123456" }

router.post('/login', async (req, res) => {
 try {
 const { email, password } = req.body;

 // ------ Validation ------
 if (!email || !password) {
 return res.status(400).json({
 error: 'Missing fields',
 message: 'Please provide both email and password',
 });
 }

 // ------ Find User ------
 // Look up the user by email. Note: we DON'T use
 // select('-password') here because we NEED the
 // password to verify it. We'll exclude it from
 // the response manually.
 const user = await User.findOne({ email: email.toLowerCase() });

 // If no user found, return a generic error message.
 // We don't say "email not found" for security reasons
 // (so attackers can't figure out which emails exist).
 if (!user) {
 return res.status(401).json({
 error: 'Invalid credentials',
 message: 'Incorrect email or password',
 });
 }

 // ------ Verify Password ------
 // Use the comparePassword method we defined in the
 // User model. It uses bcrypt to compare the plain-text
 // password with the stored hash.
 const isPasswordCorrect = await user.comparePassword(password);

 if (!isPasswordCorrect) {
 return res.status(401).json({
 error: 'Invalid credentials',
 message: 'Incorrect email or password',
 });
 }

 // ------ Generate Token ------
 const token = generateToken(user);

 // Send back the token and user info
 res.json({
 message: 'Login successful! ',
 token,
 user: {
 id: user._id,
 name: user.name,
 email: user.email,
 createdAt: user.createdAt,
 },
 });
 } catch (error) {
 console.error('Error logging in:', error.message);
 res.status(500).json({
 error: 'Login failed',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/auth/me
// ------------------------------------------
// Returns the currently logged-in user's info.
// This route is PROTECTED — the requireAuth
// middleware checks the JWT token first.
//
// Headers required: Authorization: Bearer <token>
// Returns: User object (without password)

router.get('/me', requireAuth, async (req, res) => {
 try {
 // req.user was set by the requireAuth middleware.
 // It already excludes the password field.
 res.json(req.user);
 } catch (error) {
 console.error('Error getting user:', error.message);
 res.status(500).json({
 error: 'Failed to get user info',
 message: error.message,
 });
 }
});

// ------------------------------------------
// PUT /api/auth/me
// ------------------------------------------
// Updates the currently logged-in user's name.
// This is the only field users can edit themselves.
//
// Headers required: Authorization: Bearer <token>
// Request body: { name }
// Returns: Updated user object

router.put('/me', requireAuth, async (req, res) => {
 try {
 const { name } = req.body;

 // Validate that a name was provided
 if (!name || !name.trim()) {
 return res.status(400).json({
 error: 'Name is required',
 message: 'Please provide a name',
 });
 }

 // Update the user's name in the database.
 // findByIdAndUpdate returns the updated document
 // when { new: true } is set.
 // select('-password') excludes the password from the result.
 const updatedUser = await User.findByIdAndUpdate(
 req.user._id,
 { name: name.trim() },
 { new: true, runValidators: true }
 ).select('-password');

 res.json({
 message: 'Name updated successfully!',
 user: updatedUser,
 });
 } catch (error) {
 console.error('Error updating user:', error.message);
 res.status(500).json({
 error: 'Failed to update name',
 message: error.message,
 });
 }
});

// ------------------------------------------
// Export the Router
// ------------------------------------------
module.exports = router;
