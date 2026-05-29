// ==============================================
// WATCHLIST ROUTES
// ==============================================
// These routes let users manage their watchlist —
// a list of movies they want to watch later.
//
// The watchlist is stored in MongoDB, so it
// persists even when the server restarts.
// ==============================================

// Import Express and create a Router
const express = require('express');
const router = express.Router();

// Import the Watchlist model so we can interact
// with the "watchlists" collection in MongoDB.
const Watchlist = require('../models/Watchlist');

// ------------------------------------------
// GET /api/watchlist
// ------------------------------------------
// Gets ALL movies in the user's watchlist.
// Returns them sorted by addedAt (newest first).
//
// Example: GET http://localhost:3000/api/watchlist
// Returns: Array of all watchlist items

router.get('/', async (req, res) => {
  try {
    // Use Mongoose's find() with no filter to get
    // ALL documents from the watchlists collection.
    //
    // .sort({ addedAt: -1 }) sorts by the addedAt field
    // in descending order, so the most recently added
    // movies appear first in the list.
    const watchlist = await Watchlist.find()
      .sort({ addedAt: -1 });

    // Send the array of watchlist items as JSON
    res.json(watchlist);
  } catch (error) {
    console.error('Error fetching watchlist:', error.message);
    res.status(500).json({
      error: 'Failed to fetch watchlist',
      message: error.message,
    });
  }
});

// ------------------------------------------
// POST /api/watchlist
// ------------------------------------------
// Adds a movie to the watchlist.
// Before adding, it checks if the movie is already
// in the watchlist (using the movieId).
//
// Example request body:
// {
//   "movieId": 550,
//   "movieTitle": "Fight Club",
//   "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
// }
//
// Example: POST http://localhost:3000/api/watchlist

router.post('/', async (req, res) => {
  try {
    // Extract the movie data from the request body
    const { movieId, movieTitle, posterPath } = req.body;

    // ------------------------------------------
    // Validate required fields
    // ------------------------------------------
    if (!movieId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'movieId is required',
      });
    }

    if (!movieTitle) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'movieTitle is required',
      });
    }

    // ------------------------------------------
    // Check if movie is already in the watchlist
    // ------------------------------------------
    // findOne() searches for a single document that
    // matches the filter. If found, the movie is
    // already in the watchlist and we shouldn't add
    // it again.
    const existingItem = await Watchlist.findOne({ movieId });

    if (existingItem) {
      // Return a 409 (Conflict) status to indicate
      // that this resource already exists.
      return res.status(409).json({
        error: 'Already in watchlist',
        message: `"${movieTitle}" is already in your watchlist!`,
      });
    }

    // ------------------------------------------
    // Create and save the watchlist item
    // ------------------------------------------
    const newItem = new Watchlist({
      movieId,
      movieTitle,
      posterPath,
    });

    // Save the new item to MongoDB
    const savedItem = await newItem.save();

    // Send back the saved item with a 201 (Created) status
    res.status(201).json({
      message: `"${movieTitle}" added to your watchlist!`,
      item: savedItem,
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    // Handle duplicate key error (from the unique index on movieId).
    // Error code 11000 is MongoDB's code for duplicate key violations.
    // This is a safety net — our findOne() check above should
    // catch duplicates first, but this handles race conditions.
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Already in watchlist',
        message: 'This movie is already in your watchlist!',
      });
    }

    console.error('Error adding to watchlist:', error.message);
    res.status(500).json({
      error: 'Failed to add to watchlist',
      message: error.message,
    });
  }
});

// ------------------------------------------
// DELETE /api/watchlist/:movieId
// ------------------------------------------
// Removes a movie from the watchlist using the
// TMDB movieId (NOT the MongoDB _id).
//
// This is different from the review delete route!
// Reviews use MongoDB _id, but watchlist uses
// movieId because it's more intuitive — you want
// to remove "Fight Club" by its TMDB ID, not by
// some random database ID.
//
// Example: DELETE http://localhost:3000/api/watchlist/550

router.delete('/:movieId', async (req, res) => {
  try {
    // Extract the TMDB movieId from the URL
    const { movieId } = req.params;

    // findOneAndDelete() searches for a document
    // matching the filter and deletes it.
    // We search by movieId (TMDB ID), not _id.
    const deletedItem = await Watchlist.findOneAndDelete({
      movieId: Number(movieId),
    });

    // If no item was found, send a 404 error
    if (!deletedItem) {
      return res.status(404).json({
        error: 'Not found in watchlist',
        message: `No movie with ID ${movieId} found in your watchlist`,
      });
    }

    // Send a success message with the deleted item
    res.json({
      message: `"${deletedItem.movieTitle}" removed from your watchlist`,
      deletedItem,
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error.message);
    res.status(500).json({
      error: 'Failed to remove from watchlist',
      message: error.message,
    });
  }
});

// ------------------------------------------
// Export the Router
// ------------------------------------------
module.exports = router;
