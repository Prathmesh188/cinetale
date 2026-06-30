// ==============================================
// FAVORITES ROUTES
// ==============================================
// These routes handle the user's favorites — movies
// and TV shows they loved. This is separate from the
// watchlist (which is for "want to watch" items).
//
// All favorites routes require authentication because
// each user has their own personal favorites list.
// ==============================================

// Import Express and create a Router
const express = require('express');
const router = express.Router();

// Import our Favorite model
const Favorite = require('../models/Favorite');

// Import the auth middleware — all routes here need it
const { requireAuth } = require('../middleware/auth');

// ------------------------------------------
// Apply auth middleware to ALL favorites routes
// ------------------------------------------
// router.use() applies middleware to every route
// in this router. This means you MUST be logged in
// to access any favorites endpoint.
router.use(requireAuth);

// ------------------------------------------
// GET /api/favorites
// ------------------------------------------
// Gets all favorites for the logged-in user.
// Sorted by most recently added first.
//
// Headers required: Authorization: Bearer <token>
// Returns: Array of favorite items

router.get('/', async (req, res) => {
 try {
 // Find all favorites belonging to this user.
 // req.user._id was set by the requireAuth iddleware.
 const favorites = await Favorite.find({ userId: req.user._id })
 .sort({ addedAt: -1 }); // Newest first

 res.json(favorites);
 } catch (error) {
 console.error('Error fetching favorites:', error.message);
 res.status(500).json({
 error: 'Failed to fetch favorites',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/favorites/count
// ------------------------------------------
// Gets the count of favorites grouped by type.
// Used on the profile page to show statistics.
//
// Returns: { movie: X, tv: Y, total: Z }

router.get('/count', async (req, res) => {
 try {
 // Count movies and TV shows separately
 const movieCount = await Favorite.countDocuments({
 userId: req.user._id,
 mediaType: 'movie',
 });

 const tvCount = await Favorite.countDocuments({
 userId: req.user._id,
 mediaType: 'tv',
 });

 res.json({
 movie: movieCount,
 tv: tvCount,
 total: movieCount + tvCount,
 });
 } catch (error) {
 console.error('Error counting favorites:', error.message);
 res.status(500).json({
 error: 'Failed to count favorites',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/favorites/check/:mediaId?type=movie
// ------------------------------------------
// Checks if a specific item is in the user's favorites.
// Used on the movie detail page to toggle the heart icon.
//
// Query params: type (movie or tv, defaults to movie)
// Returns: { isFavorited: true/false }

router.get('/check/:mediaId', async (req, res) => {
 try {
 const { mediaId } = req.params;
 const mediaType = req.query.type || 'movie';

 // Look for this specific item in the user's favorites
 const favorite = await Favorite.findOne({
 userId: req.user._id,
 mediaId: Number(mediaId),
 mediaType,
 });

 // Return true if found, false if not
 res.json({ isFavorited: !!favorite });
 } catch (error) {
 console.error('Error checking favorite:', error.message);
 res.status(500).json({
 error: 'Failed to check favorite status',
 message: error.message,
 });
 }
});

// ------------------------------------------
// POST /api/favorites
// ------------------------------------------
// Adds a movie or TV show to the user's favorites.
//
// Request body: { mediaId, mediaType, title, posterPath }
// Returns: { message, item } with status 201

router.post('/', async (req, res) => {
 try {
 const { mediaId, mediaType, title, posterPath } = req.body;

 // ------ Validation ------
 if (!mediaId || !title) {
 return res.status(400).json({
 error: 'Missing fields',
 message: 'Please provide mediaId and title',
 });
 }

 // Check if this item is already favorited
 const existing = await Favorite.findOne({
 userId: req.user._id,
 mediaId: Number(mediaId),
 mediaType: mediaType || 'movie',
 });

 if (existing) {
 return res.status(409).json({
 error: 'Already favorited',
 message: 'This item is already in your favorites',
 });
 }

 // Create and save the new favorite
 const favorite = new Favorite({
 userId: req.user._id,
 mediaId: Number(mediaId),
 mediaType: mediaType || 'movie',
 title,
 posterPath,
 });

 const savedFavorite = await favorite.save();

 res.status(201).json({
 message: 'Added to favorites! ️',
 item: savedFavorite,
 });
 } catch (error) {
 console.error('Error adding favorite:', error.message);

 // Handle duplicate key error (shouldn't happen with our
 // check above, but just in case of race conditions)
 if (error.code === 11000) {
 return res.status(409).json({
 error: 'Already favorited',
 message: 'This item is already in your favorites',
 });
 }

 res.status(500).json({
 error: 'Failed to add favorite',
 message: error.message,
 });
 }
});

// ------------------------------------------
// DELETE /api/favorites/:mediaId?type=movie
// ------------------------------------------
// Removes an item from the user's favorites.
//
// Query params: type (movie or tv, defaults to movie)
// Returns: { message, deletedItem }

router.delete('/:mediaId', async (req, res) => {
 try {
 const { mediaId } = req.params;
 const mediaType = req.query.type || 'movie';

 // Find and delete the favorite.
 // We match by userId to ensure users can only
 // delete their OWN favorites.
 const deletedItem = await Favorite.findOneAndDelete({
 userId: req.user._id,
 mediaId: Number(mediaId),
 mediaType,
 });

 if (!deletedItem) {
 return res.status(404).json({
 error: 'Not found',
 message: 'This item is not in your favorites',
 });
 }

 res.json({
 message: 'Removed from favorites',
 deletedItem,
 });
 } catch (error) {
 console.error('Error removing favorite:', error.message);
 res.status(500).json({
 error: 'Failed to remove favorite',
 message: error.message,
 });
 }
});

// ------------------------------------------
// Export the Router
// ------------------------------------------
module.exports = router;
