// ==============================================
// USER MODEL
// ==============================================
// This model represents a registered user of our
// app. Each user has a name, email, and password.
// The password is NEVER stored as plain text —
// it's hashed (scrambled) before saving so that
// even if someone gets access to the database,
// they can't read the actual passwords.
// ==============================================

// Import mongoose for schema and model creation
const mongoose = require('mongoose');

// Import bcryptjs for password hashing.
// bcryptjs is a pure JavaScript implementation of
// the bcrypt password hashing algorithm. It's used
// to securely hash passwords before storing them.
const bcrypt = require('bcryptjs');

// ------------------------------------------
// Define the User Schema
// ------------------------------------------
// This schema defines what a user document looks
// like in the database. Each field has a type and
// validation rules.

const userSchema = new mongoose.Schema({
 // name: The user's display name.
 // "trim" removes extra whitespace from both ends.
 // "maxlength" limits the name to 50 characters.
 name: {
 type: String,
 required: [true, 'Name is required'],
 trim: true,
 maxlength: 50,
 },

 // email: The user's email address (used for login).
 // "unique: true" ensures no two users can register
 // with the same email address.
 // "lowercase: true" converts the email to lowercase
 // before saving, so "John@Email.com" and "john@email.com"
 // are treated as the same email.
 email: {
 type: String,
 required: [true, 'Email is required'],
 unique: true,
 lowercase: true,
 trim: true,
 },

 // password: The user's password (will be hashed).
 // "minlength: 6" requires at least 6 characters.
 // IMPORTANT: The actual value stored in the database
 // will be a hashed version, NOT the plain text password.
 password: {
 type: String,
 required: [true, 'Password is required'],
 minlength: 6,
 },

 // createdAt: When the user account was created.
 // Defaults to the current date/time automatically.
 createdAt: {
 type: Date,
 default: Date.now,
 },
});

// ------------------------------------------
// Pre-Save Middleware (Password Hashing)
// ------------------------------------------
// "pre('save')" is a Mongoose middleware that runs
// BEFORE a document is saved to the database.
// Think of it as a "hook" — it intercepts the save
// operation and lets us modify the data first.
//
// WHY HASH PASSWORDS?
// If we stored passwords as plain text (e.g., "myPassword123"),
// anyone who gains access to the database could read
// every user's password. Hashing converts the password
// into a scrambled string (e.g., "$2a$10$X7jK...") that
// CANNOT be reversed back to the original password.
//
// WHAT ARE SALT ROUNDS?
// A "salt" is random data added to the password before
// hashing. This ensures that even if two users have the
// same password, their hashes will be different.
// "10 salt rounds" means the hashing algorithm runs 2^10
// (1024) iterations, making it slower and harder to crack
// with brute force attacks. Higher = more secure but slower.
//
// WHY CHECK isModified('password')?
// When a user updates their profile (e.g., changes their
// name), we don't want to re-hash the already-hashed
// password. isModified() checks if the password field
// was actually changed in this save operation.

userSchema.pre('save', async function (next) {
 // Only hash the password if it was modified (or is new)
 if (!this.isModified('password')) return next();

 // Generate a salt and hash the password.
 // bcrypt.genSalt(10) creates a random salt with 10 rounds.
 const salt = await bcrypt.genSalt(10);

 // bcrypt.hash() combines the plain password with the salt
 // and produces a hashed string that we store instead.
 this.password = await bcrypt.hash(this.password, salt);

 // Call next() to continue with the save operation.
 next();
});

// ------------------------------------------
// Instance Method: comparePassword
// ------------------------------------------
// This method is available on every User document.
// It compares a plain-text password (what the user
// types during login) with the hashed password stored
// in the database.
//
// HOW IT WORKS:
// bcrypt.compare() takes the plain password, hashes it
// using the same salt that was used originally, and then
// compares the result with the stored hash. If they match,
// the password is correct!
//
// USAGE:
// const isMatch = await user.comparePassword('myPassword123');
// if (isMatch) { /* password is correct */ }

userSchema.methods.comparePassword = async function (candidatePassword) {
 return bcrypt.compare(candidatePassword, this.password);
};

// ------------------------------------------
// Create and Export the Model
// ------------------------------------------
// The model name 'User' will become the
// "users" collection in MongoDB.

module.exports = mongoose.model('User', userSchema);
