// ==============================================
// CINETALE - Main Server File (Entry Point)
// ==============================================
// This is the starting point of our application.
// When you run "node server.js" or "npm start",
// this file is what Node.js executes first.
// ==============================================

// ------------------------------------------
// STEP 1: Load Environment Variables
// ------------------------------------------
// "dotenv" reads the .env file in the project root
// and makes those values available via process.env
// IMPORTANT: This MUST be at the very top, before
// any other code tries to use process.env values!
const dotenv = require('dotenv');
dotenv.config();

// ------------------------------------------
// STEP 2: Import Required Packages
// ------------------------------------------

// "express" is the web framework that helps us
// create a server and define routes (URLs) easily.
const express = require('express');

// "mongoose" is an ODM (Object Data Modeling) library
// that helps us interact with MongoDB using JavaScript
// objects instead of raw database commands.
const mongoose = require('mongoose');

// "cors" stands for Cross-Origin Resource Sharing.
// It allows our API to be accessed from different
// domains/ports (e.g., a frontend on port 5500
// calling our API on port 3000).
const cors = require('cors');

// "path" is a built-in Node.js module (no install needed).
// It helps us work with file and directory paths in a
// cross-platform way (Windows vs Mac vs Linux).
const path = require('path');

// ------------------------------------------
// STEP 3: Create the Express Application
// ------------------------------------------
// This creates our app object. Think of it as our
// "server" that we'll configure and add routes to.
const app = express();

// Read the PORT from environment variables, or use
// 3000 as a default if PORT is not set in .env
const PORT = process.env.PORT || 3000;

// ------------------------------------------
// STEP 4: Set Up Middleware
// ------------------------------------------
// Middleware are functions that run BEFORE your
// route handlers. They process the request first.

// Enable CORS so the frontend can talk to the backend
// even if they're on different ports during development.
app.use(cors());

// This middleware parses incoming JSON request bodies.
// Without this, req.body would be undefined when someone
// sends JSON data (like when creating a review).
app.use(express.json());

// Serve static files (HTML, CSS, JS, images) from the
// "public" folder. For example, if you have a file at
// public/index.html, it will be accessible at http://localhost:3000/
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------
// STEP 5: Import and Mount Route Files
// ------------------------------------------
// We organize our routes into separate files for
// cleaner code. Each file handles a specific "resource".

// Movie routes - handles fetching movie data from TMDB
const movieRoutes = require('./routes/movies');

// Review routes - handles creating/reading/deleting reviews
const reviewRoutes = require('./routes/reviews');

// Watchlist routes - handles adding/removing watchlist items
const watchlistRoutes = require('./routes/watchlist');

// Auth routes - handles user registration and login
const authRoutes = require('./routes/auth');

// TV show routes - handles fetching TV show data from TMDB
const tvRoutes = require('./routes/tv');

// Favorites routes - handles user's favorite movies/shows
const favoritesRoutes = require('./routes/favorites');

// "Mount" the routes at specific URL prefixes.
// This means all routes in movies.js will start with /api/movies
// For example: GET /api/movies/trending, GET /api/movies/search
app.use('/api/movies', movieRoutes);

// All review routes start with /api/reviews
// For example: GET /api/reviews/:movieId, POST /api/reviews
app.use('/api/reviews', reviewRoutes);

// All watchlist routes start with /api/watchlist
// For example: GET /api/watchlist, POST /api/watchlist
app.use('/api/watchlist', watchlistRoutes);

// All auth routes start with /api/auth
// For example: POST /api/auth/register, POST /api/auth/login
app.use('/api/auth', authRoutes);

// All TV show routes start with /api/tv
// For example: GET /api/tv/trending, GET /api/tv/search
app.use('/api/tv', tvRoutes);

// All favorites routes start with /api/favorites
// For example: GET /api/favorites, POST /api/favorites
app.use('/api/favorites', favoritesRoutes);

// ------------------------------------------
// STEP 5.5: 404 Handler for Unknown Routes
// ------------------------------------------
// This MUST be after all other routes. If no route
// above matched the request, this catches it and
// serves our custom 404 page.
app.use((req, res) => {
 res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ------------------------------------------
// STEP 6: Connect to MongoDB
// ------------------------------------------
// We use mongoose.connect() to establish a connection
// to our MongoDB database. The connection string comes
// from the .env file (MONGODB_URI).

// Get the MongoDB connection string from environment
// variables, or fall back to a local MongoDB instance.
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinetale';

mongoose
 .connect(MONGODB_URI)
 .then(() => {
 // This runs if the connection was successful
 console.log(' Connected to MongoDB successfully!');
 console.log(` Database: ${MONGODB_URI}`);

 // ------------------------------------------
 // STEP 7: Start the Server
 // ------------------------------------------
 // We only start listening for requests AFTER the
 // database connection is established. This ensures
 // our app doesn't try to read/write data before
 // the database is ready.
 app.listen(PORT, () => {
 console.log('');
 console.log('===========================================');
 console.log(' Cinetale Server is Running!');
 console.log('===========================================');
 console.log(` URL: http://localhost:${PORT}`);
 console.log(` API: http://localhost:${PORT}/api/movies/trending`);
 console.log('===========================================');
 console.log('');
 console.log('Press Ctrl+C to stop the server.');
 });
 })
 .catch((error) => {
 // This runs if the connection failed.
 // Common reasons: MongoDB isn't running, wrong URI,
 // network issues, or invalid credentials.
 console.error('');
 console.error(' Failed to connect to MongoDB!');
 console.error('-------------------------------------------');
 console.error('Error:', error.message);
 console.error('');
 console.error(' Troubleshooting tips:');
 console.error(' 1. Make sure MongoDB is installed and running');
 console.error(' 2. Check your MONGODB_URI in the .env file');
 console.error(' 3. If using MongoDB Atlas, check your IP whitelist');
 console.error('-------------------------------------------');

 // Exit the process with an error code (1 means error)
 // because there's no point running the server without
 // a database connection.
 process.exit(1);
 });
