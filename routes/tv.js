// ==============================================
// TV SHOW ROUTES
// ==============================================
// These routes handle all TV show-related API calls.
// They work exactly like the movie routes (movies.js)
// but call TMDB's TV endpoints instead.
//
// TMDB has separate endpoints for movies and TV shows:
// Movies: /movie/...
// TV: /tv/...
//
// The data structure is slightly different too:
// Movies use: title, release_date, runtime
// TV uses: name, first_air_date, number_of_seasons
// ==============================================

// Import Express and create a Router
const express = require('express');
const router = express.Router();

// Read the TMDB API key from environment variables
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Base URL for the TMDB API
const TMDB_BASE_URL = 'https://api.tmdb.org/3';

// ------------------------------------------
// GET /api/tv/trending
// ------------------------------------------
// Fetches the trending TV shows of the week from TMDB.
// Perfect for the homepage alongside trending movies.
//
// Example: GET http://localhost:3000/api/tv/trending
// Returns: A JSON object with a "results" array of TV shows

router.get('/trending', async (req, res) => {
 try {
 // Build the TMDB API URL for trending TV shows.
 // "trending/tv/week" gets TV shows trending this week.
 const url = `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`;

 // Make the HTTP request to TMDB
 const response = await fetch(url);

 if (!response.ok) {
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 const data = await response.json();
 res.json(data);
 } catch (error) {
 console.error('Error fetching trending TV shows:', error.message);
 res.status(500).json({
 error: 'Failed to fetch trending TV shows',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/tv/popular
// ------------------------------------------
// Fetches popular TV shows from TMDB.
//
// Example: GET http://localhost:3000/api/tv/popular

router.get('/popular', async (req, res) => {
 try {
 const url = `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}`;
 const response = await fetch(url);

 if (!response.ok) {
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 const data = await response.json();
 res.json(data);
 } catch (error) {
 console.error('Error fetching popular TV shows:', error.message);
 res.status(500).json({
 error: 'Failed to fetch popular TV shows',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/tv/top-rated
// ------------------------------------------
// Fetches top rated TV shows from TMDB.
//
// Example: GET http://localhost:3000/api/tv/top-rated

router.get('/top-rated', async (req, res) => {
 try {
 const url = `${TMDB_BASE_URL}/tv/top_rated?api_key=${TMDB_API_KEY}`;
 const response = await fetch(url);

 if (!response.ok) {
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 const data = await response.json();
 res.json(data);
 } catch (error) {
 console.error('Error fetching top rated TV shows:', error.message);
 res.status(500).json({
 error: 'Failed to fetch top rated TV shows',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/tv/search?q=breaking+bad
// ------------------------------------------
// Searches for TV shows by name using a query string.
//
// Example: GET http://localhost:3000/api/tv/search?q=breaking+bad
// Returns: A JSON object with a "results" array of matching shows

router.get('/search', async (req, res) => {
 try {
 const { q } = req.query;

 // Validate that the user provided a search query
 if (!q) {
 return res.status(400).json({
 error: 'Search query is required',
 message: 'Please provide a search term using the "q" query parameter. Example: /api/tv/search?q=breaking+bad',
 });
 }

 const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;
 const response = await fetch(url);

 if (!response.ok) {
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 const data = await response.json();
 res.json(data);
 } catch (error) {
 console.error('Error searching TV shows:', error.message);
 res.status(500).json({
 error: 'Failed to search TV shows',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/tv/:id
// ------------------------------------------
// Gets detailed information about a specific TV show.
// Also includes cast/crew info with append_to_response.
//
// TV show details include different fields than movies:
// - name (instead of title)
// - first_air_date (instead of release_date)
// - number_of_seasons (instead of runtime)
// - number_of_episodes
//
// Example: GET http://localhost:3000/api/tv/1396 (Breaking Bad)

router.get('/:id', async (req, res) => {
 try {
 const { id } = req.params;

 const url = `${TMDB_BASE_URL}/tv/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
 const response = await fetch(url);

 if (!response.ok) {
 if (response.status === 404) {
 return res.status(404).json({
 error: 'TV show not found',
 message: `No TV show found with ID: ${id}`,
 });
 }
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 const data = await response.json();
 res.json(data);
 } catch (error) {
 console.error('Error fetching TV show details:', error.message);
 res.status(500).json({
 error: 'Failed to fetch TV show details',
 message: error.message,
 });
 }
});

// ------------------------------------------
// Export the Router
// ------------------------------------------
module.exports = router;
