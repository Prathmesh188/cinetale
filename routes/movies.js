// ==============================================
// MOVIE ROUTES
// ==============================================
// These routes handle all movie-related API calls.
// They act as a "proxy" — our frontend calls OUR
// server, and our server calls the TMDB API.
//
// Why not call TMDB directly from the frontend?
// 1. Security: Our API key stays on the server
// and is never exposed to the browser.
// 2. Control: We can add caching, rate limiting,
// or transform the data before sending it.
// ==============================================

// Import Express and create a Router.
// A Router is like a mini Express app that handles
// a specific group of related routes.
const express = require('express');
const router = express.Router();

// Read the TMDB API key from environment variables.
// This key is needed to authenticate with the TMDB API.
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Base URL for the TMDB API — all endpoints start with this
const TMDB_BASE_URL = 'https://api.tmdb.org/3';

// ------------------------------------------
// GET /api/movies/trending
// ------------------------------------------
// Fetches the trending movies of the week from TMDB.
// This is great for the homepage — shows what's popular!
//
// Example: GET http://localhost:3000/api/movies/trending
// Returns: A JSON object with a "results" array of movies

router.get('/trending', async (req, res) => {
 try {
 // Build the TMDB API URL for trending movies.
 // "trending/movie/week" gets movies trending this week.
 const url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`;

 // Use the built-in fetch API (available in Node.js 18+)
 // to make an HTTP GET request to the TMDB API.
 const response = await fetch(url);

 // Check if the response was successful (status 200-299)
 if (!response.ok) {
 // If TMDB returned an error, throw it so we can
 // catch it below and send a proper error to the client.
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 // Parse the response body as JSON.
 // This converts the raw text into a JavaScript object.
 const data = await response.json();

 // Send the TMDB data back to our frontend as JSON.
 // res.json() automatically sets the Content-Type header
 // to application/json and stringifies the data.
 res.json(data);
 } catch (error) {
 // If anything goes wrong (network error, TMDB down, etc.),
 // log the error for debugging and send a 500 error response.
 console.error('Error fetching trending movies:', error.message);
 res.status(500).json({
 error: 'Failed to fetch trending movies',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/movies/search?q=inception
// ------------------------------------------
// Searches for movies by name using a query string.
// The search term comes from the "q" query parameter.
//
// Example: GET http://localhost:3000/api/movies/search?q=batman
// Returns: A JSON object with a "results" array of matching movies

router.get('/search', async (req, res) => {
 try {
 // req.query contains URL query parameters.
 // For the URL "/search?q=batman", req.query.q = "batman"
 const { q } = req.query;

 // Validate that the user provided a search query.
 // If "q" is empty or missing, send a 400 (Bad Request) error.
 if (!q) {
 return res.status(400).json({
 error: 'Search query is required',
 message: 'Please provide a search term using the "q" query parameter. Example: /api/movies/search?q=batman',
 });
 }

 // Build the TMDB search URL.
 // encodeURIComponent() safely encodes the search query
 // for use in a URL (e.g., spaces become %20).
 const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}`;

 // Make the HTTP request to TMDB
 const response = await fetch(url);

 // Check if the response was successful
 if (!response.ok) {
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 // Parse and send the response
 const data = await response.json();
 res.json(data);
 } catch (error) {
 console.error('Error searching movies:', error.message);
 res.status(500).json({
 error: 'Failed to search movies',
 message: error.message,
 });
 }
});

// ------------------------------------------
// GET /api/movies/:id
// ------------------------------------------
// Gets detailed information about a specific movie
// using its TMDB ID. Also includes cast/crew info
// thanks to the "append_to_response=credits" parameter.
//
// The ":id" is a route parameter — it's a placeholder
// that matches any value. For example:
// GET /api/movies/550 → req.params.id = "550"
//
// Example: GET http://localhost:3000/api/movies/550
// Returns: Detailed movie info including cast and crew

router.get('/:id', async (req, res) => {
 try {
 // req.params contains route parameters.
 // For the URL "/api/movies/550", req.params.id = "550"
 const { id } = req.params;

 // Build the TMDB movie details URL.
 // "append_to_response=credits" is a TMDB feature that
 // lets us get the movie details AND its cast/crew info
 // in a SINGLE API call instead of two separate calls.
 const url = `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;

 // Make the HTTP request to TMDB
 const response = await fetch(url);

 // Check if the response was successful
 if (!response.ok) {
 // If it's a 404, the movie ID doesn't exist in TMDB
 if (response.status === 404) {
 return res.status(404).json({
 error: 'Movie not found',
 message: `No movie found with ID: ${id}`,
 });
 }
 throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
 }

 // Parse and send the response
 const data = await response.json();
 res.json(data);
 } catch (error) {
 console.error('Error fetching movie details:', error.message);
 res.status(500).json({
 error: 'Failed to fetch movie details',
 message: error.message,
 });
 }
});

// ------------------------------------------
// Export the Router
// ------------------------------------------
// This makes our router available for server.js
// to import and mount at /api/movies

module.exports = router;
