// ==============================================
// WATCHLIST MODEL
// ==============================================
// This model represents a movie saved to the
// user's watchlist — their "want to watch" list.
// Each entry stores the TMDB movie ID, title,
// and poster image path so we can display the
// watchlist without extra API calls.
// ==============================================

// Import mongoose for schema and model creation
const mongoose = require('mongoose');

// ------------------------------------------
// Define the Watchlist Schema
// ------------------------------------------
// This schema defines what a watchlist item
// looks like in the database.

const watchlistSchema = new mongoose.Schema({
  // movieId: The unique numeric ID from TMDB.
  // "unique: true" means no two watchlist entries
  // can have the same movieId. This prevents users
  // from accidentally adding the same movie twice.
  // MongoDB will create an index on this field for
  // faster lookups.
  movieId: {
    type: Number,
    required: [true, 'Movie ID is required'],
    unique: true,
  },

  // movieTitle: The name of the movie.
  // Stored so we can display the watchlist without
  // needing to call the TMDB API every time.
  movieTitle: {
    type: String,
    required: [true, 'Movie title is required'],
  },

  // posterPath: The relative path to the movie's
  // poster image on TMDB. For example: "/abc123.jpg"
  // The frontend will prepend the TMDB image base URL:
  // "https://image.tmdb.org/t/p/w500" + posterPath
  // Not required because some movies might not have posters.
  posterPath: {
    type: String,
  },

  // addedAt: When the movie was added to the watchlist.
  // Defaults to the current date/time automatically.
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// ------------------------------------------
// Create and Export the Model
// ------------------------------------------
// The model name 'Watchlist' will become the
// "watchlists" collection in MongoDB.

module.exports = mongoose.model('Watchlist', watchlistSchema);
