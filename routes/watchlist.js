// ==============================================
// WATCHLIST ROUTES
// ==============================================
// These routes let users manage their watchlist —
// a list of movies and TV shows they want to watch.
//
// All routes require authentication because each
// user has their OWN personal watchlist.
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

// Import authentication middleware — all watchlist
// routes require the user to be logged in.
const { requireAuth } = require('../middleware/auth');

// Apply auth middleware to ALL watchlist routes.
// This means every route below will require a valid JWT token.
router.use(requireAuth);

// ------------------------------------------
// GET /api/watchlist
// ------------------------------------------
// Gets ALL items in the logged-in user's watchlist.
// Returns them sorted by addedAt (newest first).
//
// Headers required: Authorization: Bearer <token>
// Returns: Array of watchlist items

router.get('/', async (req, res) => {
 try {
 // Find all watchlist items belonging to this user.
 // req.user._id was set by the requireAuth middleware.
 const watchlist = await Watchlist.find({ userId: req.user._id })
 .sort({ addedAt: -1 });

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
// GET /api/watchlist/count
// ------------------------------------------
// Gets the count of watchlist items grouped by type.
// Used on the profile page to show statistics.
//
// Returns: { movie: X, tv: Y, total: Z }

router.get('/count', async (req, res) => {
 try {
 const movieCount = await Watchlist.countDocuments({
 userId: req.user._id,
 mediaType: 'movie',
 });

 const tvCount = await Watchlist.countDocuments({
 userId: req.user._id,
 mediaType: 'tv',
 });

 res.json({
 movie: movieCount,
 tv: tvCount,
 total: movieCount + tvCount,
 });
 } catch (error) {
 console.error('Error counting watchlist:', error.message);
 res.status(500).json({
 error: 'Failed to count watchlist',
 message: error.message,
 });
 }
});

// ------------------------------------------
// POST /api/watchlist
// ------------------------------------------
// Adds a movie or TV show to the user's watchlist.
// Before adding, it checks if the item is already
// in the user's watchlist.
//
// Request body:
// {
// "movieId": 550,
// "movieTitle": "Fight Club",
// "posterPath": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
// "mediaType": "movie" (or "tv")
// }

router.post('/', async (req, res) => {
 try {
 const { movieId, movieTitle, posterPath, mediaType } = req.body;

 // ------ Validation ------
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

 // ------ Check for duplicates ------
 // Check if THIS USER already has THIS ITEM in their watchlist
 const existingItem = await Watchlist.findOne({
 userId: req.user._id,
 movieId: Number(movieId),
 mediaType: mediaType || 'movie',
 });

 if (existingItem) {
 return res.status(409).json({
 error: 'Already in watchlist',
 message: `"${movieTitle}" is already in your watchlist!`,
 });
 }

 // ------ Create and save ------
 const newItem = new Watchlist({
 userId: req.user._id,
 movieId: Number(movieId),
 movieTitle,
 posterPath,
 mediaType: mediaType || 'movie',
 });

 const savedItem = await newItem.save();

 res.status(201).json({
 message: `"${movieTitle}" added to your watchlist!`,
 item: savedItem,
 });
 } catch (error) {
 if (error.name === 'ValidationError') {
 return res.status(400).json({
 error: 'Validation error',
 message: error.message,
 });
 }

 // Handle duplicate key error (safety net for race conditions)
 if (error.code === 11000) {
 return res.status(409).json({
 error: 'Already in watchlist',
 message: 'This item is already in your watchlist!',
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
// Removes an item from the user's watchlist.
// Uses the TMDB movieId (NOT MongoDB _id).
// Also accepts a ?type= query parameter to
// distinguish between movies and TV shows.
//
// Example: DELETE /api/watchlist/550?type=movie

router.delete('/:movieId', async (req, res) => {
 try {
 const { movieId } = req.params;
 const mediaType = req.query.type || 'movie';

 // Find and delete — only matches items belonging
 // to the logged-in user (can't delete others' items!)
 const deletedItem = await Watchlist.findOneAndDelete({
 userId: req.user._id,
 movieId: Number(movieId),
 mediaType,
 });

 if (!deletedItem) {
 return res.status(404).json({
 error: 'Not found in watchlist',
 message: `No item with ID ${movieId} found in your watchlist`,
 });
 }

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
