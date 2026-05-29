// ==============================================
// REVIEW MODEL
// ==============================================
// A "model" in Mongoose defines the structure of
// documents (records) that will be stored in a
// MongoDB collection. Think of it as a blueprint
// for what a "review" looks like in our database.
// ==============================================

// Import mongoose so we can define a schema and model
const mongoose = require('mongoose');

// ------------------------------------------
// Define the Review Schema
// ------------------------------------------
// A schema is like a set of rules for our data.
// It tells MongoDB: "A review MUST have these
// fields, and they MUST be these types."

const reviewSchema = new mongoose.Schema({
  // movieId: The unique ID from TMDB (The Movie Database).
  // We store this so we know which movie this review belongs to.
  // Type "Number" because TMDB uses numeric IDs (e.g., 550 for Fight Club).
  // "required: true" means you CANNOT create a review without a movieId.
  movieId: {
    type: Number,
    required: [true, 'Movie ID is required'],
  },

  // movieTitle: The name of the movie (e.g., "Inception").
  // We store this alongside the review so we can display
  // the movie name without making another API call to TMDB.
  movieTitle: {
    type: String,
    required: [true, 'Movie title is required'],
  },

  // author: Who wrote the review. Defaults to "Anonymous"
  // if no name is provided. The "trim" option removes
  // extra whitespace from the beginning and end.
  author: {
    type: String,
    required: true,
    default: 'Anonymous',
    trim: true,
  },

  // content: The actual review text.
  // This is the main body of what the user wrote.
  content: {
    type: String,
    required: [true, 'Review content is required'],
    trim: true,
  },

  // rating: Instead of boring 1-5 stars, we use fun labels!
  //   - "Skip"        → Don't bother watching
  //   - "Time Pass"    → Watch if you have nothing else to do
  //   - "Go For It"    → Worth watching, recommended!
  //   - "Perfection"   → A masterpiece, must watch!
  //
  // "enum" restricts the value to ONLY these four options.
  // If someone tries to use a different value, MongoDB
  // will reject it with a validation error.
  rating: {
    type: String,
    required: [true, 'Rating is required'],
    enum: {
      values: ['Skip', 'Time Pass', 'Go For It', 'Perfection'],
      message: 'Rating must be one of: Skip, Time Pass, Go For It, Perfection',
    },
  },

  // createdAt: Automatically records when the review was created.
  // "Date.now" gives us the current date and time.
  // We don't need to set this manually — it happens automatically.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ------------------------------------------
// Create and Export the Model
// ------------------------------------------
// mongoose.model() creates a Model from our schema.
// The first argument 'Review' becomes the collection
// name "reviews" in MongoDB (it auto-lowercases and
// pluralizes the name).
//
// module.exports makes this model available for other
// files to import using require('./models/Review').

module.exports = mongoose.model('Review', reviewSchema);
