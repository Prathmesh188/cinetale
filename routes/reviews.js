// ==============================================
// REVIEW ROUTES
// ==============================================
// These routes handle CRUD operations for reviews.
// CRUD stands for Create, Read, Update, Delete —
// the four basic operations for any data.
// (We're doing Create, Read, and Delete here.)
//
// Reviews are stored in our MongoDB database,
// unlike movies which come from the TMDB API.
// ==============================================

// Import Express and create a Router
const express = require('express');
const router = express.Router();

// Import the Review model so we can interact
// with the "reviews" collection in MongoDB.
const Review = require('../models/Review');

// ------------------------------------------
// GET /api/reviews/:movieId
// ------------------------------------------
// Gets all reviews for a specific movie.
// The ":movieId" is a route parameter — it's the
// TMDB movie ID (not the MongoDB document ID).
//
// Example: GET http://localhost:3000/api/reviews/550
// Returns: Array of all reviews for movie 550

router.get('/:movieId', async (req, res) => {
  try {
    // Extract the movieId from the URL parameters
    const { movieId } = req.params;

    // Use Mongoose's find() to search the database.
    // We're looking for all reviews where the movieId
    // field matches the one in the URL.
    //
    // .sort({ createdAt: -1 }) sorts results by date.
    //   -1 = descending (newest first)
    //    1 = ascending (oldest first)
    const reviews = await Review.find({ movieId: Number(movieId) })
      .sort({ createdAt: -1 });

    // Send the array of reviews back as JSON
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    res.status(500).json({
      error: 'Failed to fetch reviews',
      message: error.message,
    });
  }
});

// ------------------------------------------
// POST /api/reviews
// ------------------------------------------
// Creates a new review and saves it to the database.
// The review data comes in the request body as JSON.
//
// Example request body:
// {
//   "movieId": 550,
//   "movieTitle": "Fight Club",
//   "author": "John",
//   "content": "Amazing movie with a great twist!",
//   "rating": "perfection"
// }
//
// Example: POST http://localhost:3000/api/reviews

router.post('/', async (req, res) => {
  try {
    // Extract the review data from the request body.
    // req.body is available because we set up
    // express.json() middleware in server.js.
    const { movieId, movieTitle, author, content, rating } = req.body;

    // ------------------------------------------
    // Validate required fields
    // ------------------------------------------
    // Before saving to the database, we check that
    // the required fields are present. This gives
    // users a clear error message if they forget something.

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

    if (!content) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Review content is required',
      });
    }

    if (!rating) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Rating is required (skip, timepass, goforit, or perfection)',
      });
    }

    // ------------------------------------------
    // Create and save the review
    // ------------------------------------------
    // We create a new Review document using the
    // data from the request body. Mongoose will
    // validate it against our schema before saving.

    const newReview = new Review({
      movieId,
      movieTitle,
      author: author || 'Anonymous', // Use 'Anonymous' if no author provided
      content,
      rating,
    });

    // .save() writes the document to MongoDB.
    // It returns the saved document (with the
    // auto-generated _id and createdAt fields).
    const savedReview = await newReview.save();

    // Send back the saved review with a 201 status.
    // 201 means "Created" — a new resource was
    // successfully created on the server.
    res.status(201).json(savedReview);
  } catch (error) {
    // Mongoose validation errors have a special structure.
    // We check for them to give a more helpful error message.
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    console.error('Error creating review:', error.message);
    res.status(500).json({
      error: 'Failed to create review',
      message: error.message,
    });
  }
});

// ------------------------------------------
// DELETE /api/reviews/:id
// ------------------------------------------
// Deletes a review by its MongoDB document ID.
// Note: This uses the MongoDB _id (a 24-character
// hex string), NOT the TMDB movieId.
//
// Example: DELETE http://localhost:3000/api/reviews/6543abc123def456

router.delete('/:id', async (req, res) => {
  try {
    // Extract the MongoDB document ID from the URL
    const { id } = req.params;

    // findByIdAndDelete() finds a document by its _id
    // and deletes it in one step. It returns the deleted
    // document, or null if no document was found.
    const deletedReview = await Review.findByIdAndDelete(id);

    // If no review was found with that ID, send a 404 error
    if (!deletedReview) {
      return res.status(404).json({
        error: 'Review not found',
        message: `No review found with ID: ${id}`,
      });
    }

    // Send a success message along with the deleted review
    res.json({
      message: 'Review deleted successfully',
      deletedReview,
    });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    res.status(500).json({
      error: 'Failed to delete review',
      message: error.message,
    });
  }
});

// ------------------------------------------
// Export the Router
// ------------------------------------------
module.exports = router;
