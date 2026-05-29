/* ==========================================================================
   CINETALE — Movie Detail Page JavaScript (movie.js)
   ==========================================================================
   This file handles the movie detail page (movie.html):
   - Fetching and displaying full movie details (backdrop, poster, info)
   - Rendering the cast section
   - Fetching and displaying user reviews
   - The Cinetale Meter (community rating aggregation)
   - Review form submission
   - Watchlist add/remove toggle
   
   The movie ID comes from the URL query parameter: movie.html?id=12345
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. GET THE MOVIE ID FROM THE URL
   --------------------------------------------------------------------------
   When a user clicks a movie card, they're taken to:
     /movie.html?id=12345
   
   We need to extract that "id" value to know which movie to fetch.
   URLSearchParams is a built-in browser API that parses URL query strings.
   -------------------------------------------------------------------------- */

// Create a URLSearchParams object from the current page's query string
// window.location.search gives us everything after "?" in the URL
const urlParams = new URLSearchParams(window.location.search);

// Get the "id" parameter value (e.g., "12345")
const movieId = urlParams.get('id');

// If there's no movie ID in the URL, redirect back to the home page
if (!movieId) {
  window.location.href = '/';
}


/* --------------------------------------------------------------------------
   2. DOM ELEMENT REFERENCES
   --------------------------------------------------------------------------
   Grab references to all the HTML elements we'll need to update.
   -------------------------------------------------------------------------- */

// Movie header elements
const movieBackdrop = document.getElementById('movieBackdrop');
const moviePoster = document.getElementById('moviePoster');
const movieTitle = document.getElementById('movieTitle');
const movieMeta = document.getElementById('movieMeta');
const movieGenres = document.getElementById('movieGenres');
const movieOverview = document.getElementById('movieOverview');

// Watchlist button
const watchlistBtn = document.getElementById('watchlistBtn');

// Cinetale Meter elements
const skipCount = document.getElementById('skipCount');
const timepassCount = document.getElementById('timepassCount');
const goforitCount = document.getElementById('goforitCount');
const perfectionCount = document.getElementById('perfectionCount');
const verdictValue = document.getElementById('verdictValue');

// Review form and list
const reviewForm = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');

// Cast section
const castGrid = document.getElementById('castGrid');

// Loading and toast
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');

// Search input (for redirect to home on search)
const searchInput = document.getElementById('searchInput');


/* --------------------------------------------------------------------------
   3. CONSTANTS
   -------------------------------------------------------------------------- */

// TMDB image base URLs
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

// Track whether the movie is currently in the watchlist
let isInWatchlist = false;

// Store the current movie data so we can use it for the watchlist
let currentMovie = null;


/* --------------------------------------------------------------------------
   4. UTILITY FUNCTIONS
   -------------------------------------------------------------------------- */

/** Show the full-screen loading spinner */
function showLoading() {
  loadingEl.classList.remove('hidden');
}

/** Hide the loading spinner */
function hideLoading() {
  loadingEl.classList.add('hidden');
}

/**
 * showToast(message)
 * Shows a brief notification at the bottom-right of the screen.
 */
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

/**
 * getYear(dateString)
 * Extracts the year from a "YYYY-MM-DD" date string.
 */
function getYear(dateString) {
  if (!dateString) return '';
  return dateString.substring(0, 4);
}

/**
 * formatRuntime(minutes)
 * Converts total minutes into a readable format like "2h 15m".
 *
 * @param {number} minutes - Total runtime in minutes
 * @returns {string} - Formatted runtime string
 */
function formatRuntime(minutes) {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60); // Integer division
  const mins = minutes % 60;              // Remainder
  return `${hours}h ${mins}m`;
}

/**
 * getRatingClass(rating)
 * Returns the CSS class name for a given Cinetale Meter rating.
 * This is used to color-code rating badges.
 *
 * @param {string} rating - One of: "Skip", "Time Pass", "Go For It", "Perfection"
 * @returns {string} - The corresponding CSS class name
 */
function getRatingClass(rating) {
  const ratingMap = {
    'Skip': 'skip',
    'Time Pass': 'timepass',
    'Go For It': 'goforit',
    'Perfection': 'perfection'
  };
  return ratingMap[rating] || '';
}

/**
 * getInitials(name)
 * Gets the first letter(s) of a name for the avatar.
 * E.g., "John Doe" → "JD", "Alice" → "A"
 *
 * @param {string} name - The person's name
 * @returns {string} - The initials (1-2 characters)
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')              // Split into words
    .map(word => word[0])    // Get first letter of each word
    .join('')                // Join them together
    .toUpperCase()           // Make uppercase
    .substring(0, 2);        // Take at most 2 characters
}


/* --------------------------------------------------------------------------
   5. FETCH & RENDER MOVIE DETAILS
   --------------------------------------------------------------------------
   This is the main function that fetches all movie data and renders it.
   -------------------------------------------------------------------------- */

/**
 * fetchMovieDetails()
 * Fetches the full movie details from our backend API and renders:
 * - Backdrop image
 * - Poster image
 * - Title, meta info, genres, overview
 * - Cast section
 */
async function fetchMovieDetails() {
  showLoading();

  try {
    // Fetch movie details from our backend
    const response = await fetch(`/api/movies/${movieId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch movie. Status: ${response.status}`);
    }

    // Parse the response — this gives us the full movie object
    const movie = await response.json();

    // Store the movie data globally so other functions can use it
    currentMovie = movie;

    // Update the page title in the browser tab
    document.title = `${movie.title} — Cinetale`;

    // --- Render the backdrop image ---
    if (movie.backdrop_path) {
      movieBackdrop.style.backgroundImage =
        `url(${BACKDROP_BASE}${movie.backdrop_path})`;
    }

    // --- Render the poster image ---
    if (movie.poster_path) {
      moviePoster.innerHTML = `
        <img
          src="${POSTER_BASE}${movie.poster_path}"
          alt="${movie.title} poster"
        >
      `;
    } else {
      moviePoster.innerHTML = `<div class="poster-fallback">🎬</div>`;
    }

    // --- Render the title ---
    movieTitle.textContent = movie.title;

    // --- Render meta info (year • runtime • rating) ---
    const year = getYear(movie.release_date);
    const runtime = formatRuntime(movie.runtime);
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    movieMeta.innerHTML = `
      <span>📅 ${year}</span>
      ${runtime ? '<span class="dot"></span>' : ''}
      ${runtime ? `<span>⏱️ ${runtime}</span>` : ''}
      <span class="dot"></span>
      <span class="vote-badge">⭐ ${rating}</span>
    `;

    // --- Render genre pills ---
    if (movie.genres && movie.genres.length > 0) {
      movieGenres.innerHTML = movie.genres
        .map(genre => `<span class="genre-pill">${genre.name}</span>`)
        .join('');
    }

    // --- Render overview ---
    movieOverview.textContent = movie.overview || 'No overview available.';

    // --- Render cast section ---
    if (movie.credits && movie.credits.cast) {
      renderCast(movie.credits.cast);
    }

  } catch (error) {
    console.error('Error fetching movie details:', error);
    showToast('Failed to load movie details.');
  } finally {
    hideLoading();
  }
}


/* --------------------------------------------------------------------------
   6. CAST SECTION
   --------------------------------------------------------------------------
   Renders the horizontally scrollable cast member cards.
   -------------------------------------------------------------------------- */

/**
 * renderCast(castArray)
 * Creates cast member cards and adds them to the cast grid.
 * We limit to the first 20 cast members to keep it manageable.
 *
 * @param {Array} castArray - Array of cast member objects from TMDB
 */
function renderCast(castArray) {
  castGrid.innerHTML = '';

  // Limit to first 20 cast members
  const displayCast = castArray.slice(0, 20);

  if (displayCast.length === 0) {
    castGrid.innerHTML = '<p class="text-muted">No cast information available.</p>';
    return;
  }

  displayCast.forEach(member => {
    // Create a card for each cast member
    const card = document.createElement('div');
    card.className = 'cast-card';

    // Check if they have a profile photo
    const photoHTML = member.profile_path
      ? `<div class="cast-photo">
           <img src="${PROFILE_BASE}${member.profile_path}" alt="${member.name}" loading="lazy">
         </div>`
      : `<div class="cast-photo">
           <div class="cast-photo-fallback">👤</div>
         </div>`;

    card.innerHTML = `
      ${photoHTML}
      <div class="cast-name">${member.name}</div>
      <div class="cast-character">${member.character || ''}</div>
    `;

    castGrid.appendChild(card);
  });
}


/* --------------------------------------------------------------------------
   7. REVIEWS
   --------------------------------------------------------------------------
   Fetch reviews, render them, and handle the review form submission.
   -------------------------------------------------------------------------- */

/**
 * fetchReviews()
 * Fetches all reviews for the current movie and renders them.
 * Also updates the Cinetale Meter with the aggregate ratings.
 */
async function fetchReviews() {
  try {
    const response = await fetch(`/api/reviews/${movieId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch reviews. Status: ${response.status}`);
    }

    // The API returns an array of review objects
    const reviews = await response.json();

    // Render the reviews list
    renderReviews(reviews);

    // Update the Cinetale Meter with aggregate ratings
    updateMeter(reviews);

  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
}

/**
 * renderReviews(reviews)
 * Creates review cards and adds them to the reviews list.
 *
 * @param {Array} reviews - Array of review objects with:
 *   - _id or id: unique review ID
 *   - author: reviewer's name
 *   - content: review text
 *   - rating: Cinetale Meter rating
 *   - createdAt: date string
 */
function renderReviews(reviews) {
  reviewsList.innerHTML = '';

  // If no reviews, show a message
  if (!reviews || reviews.length === 0) {
    reviewsList.innerHTML = `
      <div class="no-reviews">
        <p>No reviews yet. Be the first to share your thoughts! ✍️</p>
      </div>
    `;
    return;
  }

  // Create a card for each review
  reviews.forEach(review => {
    const card = document.createElement('div');
    card.className = 'review-card';

    // Get the review ID (MongoDB uses _id, our backend might use id)
    const reviewId = review._id || review.id;

    // Format the date (if available)
    const date = review.createdAt
      ? new Date(review.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '';

    // Get the CSS class for the rating badge color
    const ratingClass = getRatingClass(review.rating);

    // Get the author's initials for the avatar
    const initials = getInitials(review.author);

    card.innerHTML = `
      <div class="review-header">
        <div class="review-author">
          <div class="review-avatar">${initials}</div>
          <div>
            <div class="review-author-name">${review.author}</div>
            <div class="review-date">${date}</div>
          </div>
        </div>
        <span class="review-rating ${ratingClass}">${review.rating}</span>
      </div>
      <div class="review-content">${review.content}</div>
      <button class="review-delete-btn" data-id="${reviewId}">🗑️ Delete</button>
    `;

    // Add click handler for the delete button
    const deleteBtn = card.querySelector('.review-delete-btn');
    deleteBtn.addEventListener('click', () => deleteReview(reviewId));

    reviewsList.appendChild(card);
  });
}

/**
 * updateMeter(reviews)
 * Counts how many reviews have each rating and updates the
 * Cinetale Meter display. Also determines the "community verdict"
 * (the most popular rating).
 *
 * @param {Array} reviews - Array of review objects
 */
function updateMeter(reviews) {
  // Initialize counters for each rating tier
  const counts = {
    'Skip': 0,
    'Time Pass': 0,
    'Go For It': 0,
    'Perfection': 0
  };

  // Count reviews for each rating
  if (reviews && reviews.length > 0) {
    reviews.forEach(review => {
      if (counts.hasOwnProperty(review.rating)) {
        counts[review.rating]++;
      }
    });
  }

  // Update the count displays
  skipCount.textContent = `${counts['Skip']} vote${counts['Skip'] !== 1 ? 's' : ''}`;
  timepassCount.textContent = `${counts['Time Pass']} vote${counts['Time Pass'] !== 1 ? 's' : ''}`;
  goforitCount.textContent = `${counts['Go For It']} vote${counts['Go For It'] !== 1 ? 's' : ''}`;
  perfectionCount.textContent = `${counts['Perfection']} vote${counts['Perfection'] !== 1 ? 's' : ''}`;

  // Determine the community verdict (rating with most votes)
  const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);

  if (totalVotes === 0) {
    verdictValue.textContent = 'No ratings yet';
    verdictValue.style.color = 'var(--text-muted)';
    return;
  }

  // Find the rating with the highest count
  let maxRating = '';
  let maxCount = 0;

  for (const [rating, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxRating = rating;
    }
  }

  // Set the verdict text with appropriate color
  verdictValue.textContent = `${maxRating} (${totalVotes} vote${totalVotes !== 1 ? 's' : ''})`;

  // Set the verdict color based on the winning rating
  const colorMap = {
    'Skip': 'var(--danger)',
    'Time Pass': 'var(--warning)',
    'Go For It': 'var(--success)',
    'Perfection': 'var(--gold)'
  };
  verdictValue.style.color = colorMap[maxRating] || 'var(--text-primary)';
}


/* --------------------------------------------------------------------------
   8. REVIEW FORM SUBMISSION
   --------------------------------------------------------------------------
   When the user fills out the review form and clicks "Submit",
   we send the review data to our backend API.
   -------------------------------------------------------------------------- */

/**
 * Review form "submit" event handler
 * Validates the form, sends the review to the API, and refreshes the list.
 */
reviewForm.addEventListener('submit', async (event) => {
  // Prevent the default form submission (which would reload the page)
  event.preventDefault();

  // Get the form values
  const author = document.getElementById('reviewAuthor').value.trim();
  const content = document.getElementById('reviewContent').value.trim();

  // Get the selected rating radio button
  const selectedRating = document.querySelector('input[name="rating"]:checked');

  // --- Validation ---
  if (!author) {
    showToast('Please enter your name.');
    return;
  }

  if (!selectedRating) {
    showToast('Please select a rating.');
    return;
  }

  if (!content) {
    showToast('Please write your review.');
    return;
  }

  // Build the review data object to send to the API
  const reviewData = {
    movieId: parseInt(movieId),              // The movie's TMDB ID
    movieTitle: currentMovie?.title || '',   // The movie title (for reference)
    author: author,                          // Reviewer's name
    content: content,                        // Review text
    rating: selectedRating.value             // Cinetale Meter rating
  };

  try {
    // Send the review to our backend API
    const response = await fetch('/api/reviews', {
      method: 'POST',                       // POST = create new data
      headers: {
        'Content-Type': 'application/json'  // Tell the server we're sending JSON
      },
      body: JSON.stringify(reviewData)       // Convert the object to a JSON string
    });

    if (!response.ok) {
      throw new Error(`Failed to submit review. Status: ${response.status}`);
    }

    // Success! Clear the form
    reviewForm.reset();

    // Show a success message
    showToast('Review submitted successfully! 🎉');

    // Refresh the reviews list to include the new review
    fetchReviews();

  } catch (error) {
    console.error('Error submitting review:', error);
    showToast('Failed to submit review. Please try again.');
  }
});


/* --------------------------------------------------------------------------
   9. DELETE A REVIEW
   -------------------------------------------------------------------------- */

/**
 * deleteReview(reviewId)
 * Sends a DELETE request to remove a review, then refreshes the list.
 *
 * @param {string} reviewId - The ID of the review to delete
 */
async function deleteReview(reviewId) {
  // Confirm before deleting
  if (!confirm('Are you sure you want to delete this review?')) {
    return;
  }

  try {
    const response = await fetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE'   // DELETE = remove data
    });

    if (!response.ok) {
      throw new Error(`Failed to delete review. Status: ${response.status}`);
    }

    showToast('Review deleted.');

    // Refresh the reviews list
    fetchReviews();

  } catch (error) {
    console.error('Error deleting review:', error);
    showToast('Failed to delete review.');
  }
}


/* --------------------------------------------------------------------------
   10. WATCHLIST FUNCTIONALITY
   --------------------------------------------------------------------------
   Check if the movie is already in the watchlist, and toggle add/remove.
   -------------------------------------------------------------------------- */

/**
 * checkWatchlist()
 * Fetches the user's watchlist and checks if this movie is in it.
 * Updates the watchlist button appearance accordingly.
 */
async function checkWatchlist() {
  try {
    const response = await fetch('/api/watchlist');

    if (!response.ok) return;

    const watchlist = await response.json();

    // Check if our current movie is in the watchlist
    // We compare movieId (from URL) with each watchlist item's movieId
    isInWatchlist = watchlist.some(
      item => String(item.movieId) === String(movieId)
    );

    // Update the button to reflect the current state
    updateWatchlistButton();

  } catch (error) {
    console.error('Error checking watchlist:', error);
  }
}

/**
 * updateWatchlistButton()
 * Changes the watchlist button's text and style based on whether
 * the movie is in the watchlist or not.
 */
function updateWatchlistButton() {
  if (isInWatchlist) {
    // Movie IS in the watchlist — show "remove" style
    watchlistBtn.textContent = '✅ In Watchlist';
    watchlistBtn.classList.add('in-watchlist');
  } else {
    // Movie is NOT in the watchlist — show "add" style
    watchlistBtn.textContent = '📋 Add to Watchlist';
    watchlistBtn.classList.remove('in-watchlist');
  }
}

/**
 * toggleWatchlist()
 * Adds or removes the movie from the watchlist depending on current state.
 */
async function toggleWatchlist() {
  try {
    if (isInWatchlist) {
      // --- REMOVE from watchlist ---
      const response = await fetch(`/api/watchlist/${movieId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove from watchlist');
      }

      isInWatchlist = false;
      showToast('Removed from watchlist');

    } else {
      // --- ADD to watchlist ---
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieId: parseInt(movieId),
          movieTitle: currentMovie?.title || '',
          posterPath: currentMovie?.poster_path || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add to watchlist');
      }

      isInWatchlist = true;
      showToast('Added to watchlist! 📋');
    }

    // Update the button appearance
    updateWatchlistButton();

  } catch (error) {
    console.error('Error toggling watchlist:', error);
    showToast('Something went wrong. Please try again.');
  }
}

// Attach the toggle function to the watchlist button
watchlistBtn.addEventListener('click', toggleWatchlist);


/* --------------------------------------------------------------------------
   11. SEARCH REDIRECT
   --------------------------------------------------------------------------
   If the user types in the search bar on this page and presses Enter,
   redirect them to the home page with the search query.
   -------------------------------------------------------------------------- */
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      // Redirect to home page — the search will be handled there
      // We can pass the query as a URL parameter
      window.location.href = `/?search=${encodeURIComponent(query)}`;
    }
  }
});


/* --------------------------------------------------------------------------
   12. INITIALIZE THE PAGE
   --------------------------------------------------------------------------
   When the page loads, fetch all the data we need.
   We run multiple fetches in parallel since they're independent.
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Fetch movie details, reviews, and check watchlist status
  // These can all run at the same time (in parallel)
  fetchMovieDetails();
  fetchReviews();
  checkWatchlist();
});
