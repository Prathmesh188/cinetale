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

// Import authentication middleware.
// requireAuth blocks unauthenticated requests (for POST/DELETE).
const { requireAuth } = require('../middleware/auth');

// ------------------------------------------
// GET /api/reviews/user/me
// ------------------------------------------
// Gets all reviews written by the logged-in user.
// Returns: Array of user's reviews
router.get('/user/me', requireAuth, async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error.message);
    res.status(500).json({
      error: 'Failed to fetch user reviews',
      message: error.message,
    });
  }
});

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
 // -1 = descending (newest first)
 // 1 = ascending (oldest first)
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
// "movieId": 550,
// "movieTitle": "Fight Club",
// "author": "John",
// "content": "Amazing movie with a great twist!",
// "rating": "perfection"
// }
//
// Example: POST http://localhost:3000/api/reviews

router.post('/', requireAuth, async (req, res) => {
  try {
  // Extract the review data from the request body.
  // req.body is available because we set up
  // express.json() middleware in server.js.
  const { movieId, movieTitle, author, content, rating, mediaType } = req.body;

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

  const numericRating = Number(rating);
  if (!rating || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Rating must be a number between 1 and 5',
    });
  }

  // ------------------------------------------
  // Create and save the review
  // ------------------------------------------
  // We create a new Review document using the
  // data from the request body. Mongoose will
  // validate it against our schema before saving.
 
   const newReview = new Review({
     userId: req.user._id, // Set from authenticated user
     movieId,
     movieTitle,
     author: req.user.name, // Author name comes from user account
     content,
     rating: numericRating, // Store as a number (1-5)
     mediaType: mediaType || 'movie'
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

router.delete('/:id', requireAuth, async (req, res) => {
 try {
 const { id } = req.params;

 // First, find the review to check ownership
 const review = await Review.findById(id);

 if (!review) {
 return res.status(404).json({
 error: 'Review not found',
 message: `No review found with ID: ${id}`,
 });
 }

 // Check if this review belongs to the logged-in user.
 // Users can only delete their OWN reviews!
 if (review.userId.toString() !== req.user._id.toString()) {
 return res.status(403).json({
 error: 'Forbidden',
 message: 'You can only delete your own reviews',
 });
 }

 // Now delete it
 const deletedReview = await Review.findByIdAndDelete(id);



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
