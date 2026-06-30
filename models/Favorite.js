// ==============================================
// FAVORITE MODEL
// ==============================================
// This model represents a movie or TV show that
// a user has marked as a "favorite." Unlike the
// watchlist (which is "want to watch"), favorites
// are things the user has already seen and loved.
//
// Each entry stores the TMDB media ID, type
// (movie or TV), title, and poster path so we
// can display favorites without extra API calls.
// ==============================================

// Import mongoose for schema and model creation
const mongoose = require('mongoose');

// ------------------------------------------
// Define the Favorite Schema
// ------------------------------------------
// This schema defines what a favorite item looks
// like in the database. Each favorite is linked
// to a specific user via their userId.

const favoriteSchema = new mongoose.Schema({
 // userId: Links this favorite to a specific user.
 // "ObjectId" is MongoDB's unique identifier type.
 // "ref: 'User'" tells Mongoose this ID points to
 // a document in the "users" collection, enabling
 // population (auto-fetching the full user data).
 userId: {
 type: mongoose.Schema.Types.ObjectId,
 ref: 'User',
 required: true,
 },

 // mediaId: The unique numeric ID from TMDB.
 // This works for both movies and TV shows since
 // TMDB uses numeric IDs for everything.
 mediaId: {
 type: Number,
 required: [true, 'Media ID is required'],
 },

 // mediaType: Whether this is a movie or TV show.
 // "enum" restricts the value to ONLY 'movie' or 'tv'.
 // This lets us handle both types in one collection
 // instead of needing separate "favoriteMovies" and
 // "favoriteTVShows" collections.
 mediaType: {
 type: String,
 required: true,
 enum: ['movie', 'tv'],
 },

 // title: The name of the movie or TV show.
 // Stored so we can display favorites without
 // needing to call the TMDB API every time.
 title: {
 type: String,
 required: [true, 'Title is required'],
 },

 // posterPath: The relative path to the poster image
 // on TMDB. For example: "/abc123.jpg"
 // The frontend prepends the TMDB image base URL:
 // "https://image.tmdb.org/t/p/w500" + posterPath
 // Not required because some items might not have posters.
 posterPath: {
 type: String,
 },

 // addedAt: When this item was favorited.
 // Defaults to the current date/time automatically.
 addedAt: {
 type: Date,
 default: Date.now,
 },
});

// ------------------------------------------
// Compound Unique Index
// ------------------------------------------
// This creates a "compound index" on three fields together.
// It ensures that the COMBINATION of userId + mediaId +
// mediaType is unique. This means:
// - User A can favorite movie 550
// - User B can ALSO favorite movie 550
// - User A canNOT favorite movie 550 TWICE
// - User A can favorite TV show 550 (different mediaType)
//
// Without this index, a user could accidentally add the
// same item to their favorites multiple times.
favoriteSchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: true });

// ------------------------------------------
// Create and Export the Model
// ------------------------------------------
// The model name 'Favorite' will become the
// "favorites" collection in MongoDB.

module.exports = mongoose.model('Favorite', favoriteSchema);
