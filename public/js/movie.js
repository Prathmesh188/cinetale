/* ==========================================================================
 CINETALE — Movie/TV Detail Page JavaScript (movie.js)
 ==========================================================================
 This file handles the detail page (movie.html):
 - Fetching and displaying full movie OR TV show details
 - Rendering the cast section
 - Fetching and displaying user reviews (auth-aware)
 - The Cinetale Meter (community rating aggregation)
 - Review form submission (requires login)
 - Watchlist add/remove toggle (requires login)
 - Favorite toggle (requires login)

 The item ID comes from the URL query parameter: movie.html?id=12345&type=movie
 ========================================================================== */


/* --------------------------------------------------------------------------
 1. GET THE ITEM ID AND TYPE FROM THE URL
 -------------------------------------------------------------------------- */

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');

// Determine if this is a movie or TV show
// Default to 'movie' if no type parameter is present
const mediaType = urlParams.get('type') || 'movie';

// If there's no ID in the URL, redirect back to the home page
if (!movieId) {
 window.location.href = '/';
}


/* --------------------------------------------------------------------------
 2. DOM ELEMENT REFERENCES
 -------------------------------------------------------------------------- */

// Movie/TV header elements
const movieBackdrop = document.getElementById('movieBackdrop');
const moviePoster = document.getElementById('moviePoster');
const movieTitle = document.getElementById('movieTitle');
const movieMeta = document.getElementById('movieMeta');
const movieGenres = document.getElementById('movieGenres');
const movieOverview = document.getElementById('movieOverview');

// Watchlist and Favorite buttons
const watchlistBtn = document.getElementById('watchlistBtn');
const favoriteBtn = document.getElementById('favoriteBtn');

// Community Rating elements
const avgStars = document.getElementById('avgStars');
const avgRatingValue = document.getElementById('avgRatingValue');
const verdictValue = document.getElementById('verdictValue');

// Review form and list
const reviewForm = document.getElementById('reviewForm');
const reviewsList = document.getElementById('reviewsList');
const authMessage = document.getElementById('authMessage');
const reviewFields = document.getElementById('reviewFields');

// Cast section
const castGrid = document.getElementById('castGrid');

// Loading and toast
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');

// Search input (for redirect to home on search)
const searchInput = document.getElementById('searchInput');


/* --------------------------------------------------------------------------
 3. CONSTANTS AND STATE
 -------------------------------------------------------------------------- */

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

// Track watchlist and favorite state
let isInWatchlist = false;
let isFavorited = false;

// Store the current item data
let currentMovie = null;


/* --------------------------------------------------------------------------
 4. UTILITY FUNCTIONS
 -------------------------------------------------------------------------- */

function showLoading() {
 loadingEl.classList.remove('hidden');
}

function hideLoading() {
 loadingEl.classList.add('hidden');
}

function showToast(message) {
 toastEl.textContent = message;
 toastEl.classList.add('show');
 setTimeout(() => {
 toastEl.classList.remove('show');
 }, 3000);
}

function getYear(dateString) {
 if (!dateString) return '';
 return dateString.substring(0, 4);
}

function formatRuntime(minutes) {
 if (!minutes) return '';
 const hours = Math.floor(minutes / 60);
 const mins = minutes % 60;
 return `${hours}h ${mins}m`;
}

/**
 * getRatingClass(rating)
 * Returns a CSS class for color-coding the numeric rating badge.
 * 1-2 = low (red), 3 = mid (yellow), 4-5 = high (green/gold)
 */
function getRatingClass(rating) {
 const num = Number(rating);
 if (num <= 2) return 'rating-low';
 if (num === 3) return 'rating-mid';
 if (num >= 4) return 'rating-high';
 return '';
}

/**
 * renderStars(rating)
 * Converts a numeric rating (1-5) to filled/empty star characters.
 * E.g., 3 → "★★★☆☆"
 */
function renderStars(rating) {
 const num = Math.round(Number(rating));
 return '★'.repeat(num) + '☆'.repeat(5 - num);
}

function getInitials(name) {
 if (!name) return '?';
 return name
 .split(' ')
 .map(word => word[0])
 .join('')
 .toUpperCase()
 .substring(0, 2);
}


/* --------------------------------------------------------------------------
 5. FETCH & RENDER MOVIE/TV DETAILS
 --------------------------------------------------------------------------
 Works for both movies and TV shows by switching the API URL
 and handling different field names.
 -------------------------------------------------------------------------- */

async function fetchMovieDetails() {
 showLoading();

 try {
 // Choose the correct API endpoint based on media type
 const apiUrl = mediaType === 'tv'
 ? `/api/tv/${movieId}`
 : `/api/movies/${movieId}`;

 const response = await fetch(apiUrl);

 if (!response.ok) {
 throw new Error(`Failed to fetch details. Status: ${response.status}`);
 }

 const movie = await response.json();
 currentMovie = movie;

 // TMDB uses different field names for movies vs TV shows:
 // Movies: title, release_date, runtime
 // TV: name, first_air_date, number_of_seasons
 const title = movie.title || movie.name;
 const date = movie.release_date || movie.first_air_date;

 // Update the browser tab title
 document.title = `${title} — Cinetale`;

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
 alt="${escapeHTML(title)} poster"
 >
 `;
 } else {
 moviePoster.innerHTML = `<div class="poster-fallback"></div>`;
 }

 // --- Render the title ---
 movieTitle.textContent = title;

 // --- Render meta info ---
 const year = getYear(date);
 const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

 // For TV shows, show number of seasons instead of runtime
 let durationInfo = '';
 if (mediaType === 'tv') {
 const seasons = movie.number_of_seasons;
 if (seasons) {
 durationInfo = ` ${seasons} Season${seasons !== 1 ? 's' : ''}`;
 }
 } else {
 const runtime = formatRuntime(movie.runtime);
 if (runtime) {
 durationInfo = `⏱️ ${runtime}`;
 }
 }

 movieMeta.innerHTML = `
 <span> ${year}</span>
 ${durationInfo ? '<span class="dot"></span>' : ''}
 ${durationInfo ? `<span>${durationInfo}</span>` : ''}
 <span class="dot"></span>
 <span class="vote-badge"> ${rating}</span>
 `;

 // --- Render genre pills ---
 if (movie.genres && movie.genres.length > 0) {
 movieGenres.innerHTML = movie.genres
 .map(genre => `<span class="genre-pill">${escapeHTML(genre.name)}</span>`)
 .join('');
 }

 // --- Render overview ---
 movieOverview.textContent = movie.overview || 'No overview available.';

 // --- Render cast section ---
 if (movie.credits && movie.credits.cast) {
 renderCast(movie.credits.cast);
 }

 } catch (error) {
 console.error('Error fetching details:', error);
 showToast('Failed to load details.');
 } finally {
 hideLoading();
 }
}


/* --------------------------------------------------------------------------
 6. CAST SECTION
 -------------------------------------------------------------------------- */

function renderCast(castArray) {
 castGrid.innerHTML = '';
 const displayCast = castArray.slice(0, 20);

 if (displayCast.length === 0) {
 castGrid.innerHTML = '<p class="text-muted">No cast information available.</p>';
 return;
 }

 displayCast.forEach(member => {
 const card = document.createElement('div');
 card.className = 'cast-card';

 const photoHTML = member.profile_path
 ? `<div class="cast-photo">
 <img src="${PROFILE_BASE}${member.profile_path}" alt="${escapeHTML(member.name)}" loading="lazy">
 </div>`
 : `<div class="cast-photo">
 <div class="cast-photo-fallback"></div>
 </div>`;

 card.innerHTML = `
 ${photoHTML}
 <div class="cast-name">${escapeHTML(member.name)}</div>
 <div class="cast-character">${escapeHTML(member.character || '')}</div>
 `;

 castGrid.appendChild(card);
 });
}


/* --------------------------------------------------------------------------
 7. REVIEWS (AUTH-AWARE)
 --------------------------------------------------------------------------
 Reviews can be READ by anyone, but WRITING and DELETING
 requires authentication.
 -------------------------------------------------------------------------- */

/**
 * setupReviewForm()
 * Shows the review form if logged in, or a login prompt if not.
 */
function setupReviewForm() {
 if (isLoggedIn()) {
 // User is logged in — show the review form
 if (authMessage) authMessage.style.display = 'none';
 if (reviewFields) reviewFields.style.display = 'block';
 } else {
 // User is NOT logged in — show login prompt, hide form
 if (authMessage) authMessage.style.display = 'block';
 if (reviewFields) reviewFields.style.display = 'none';
 }
}

async function fetchReviews() {
 try {
 const response = await fetch(`/api/reviews/${movieId}`);

 if (!response.ok) {
 throw new Error(`Failed to fetch reviews. Status: ${response.status}`);
 }

 const reviews = await response.json();
 renderReviews(reviews);
 updateMeter(reviews);

 } catch (error) {
 console.error('Error fetching reviews:', error);
 }
}

function renderReviews(reviews) {
 reviewsList.innerHTML = '';

 if (!reviews || reviews.length === 0) {
 reviewsList.innerHTML = `
 <div class="no-reviews">
 <p>No reviews yet. Be the first to share your thoughts! ️</p>
 </div>
 `;
 return;
 }

 // Get the current user to check review ownership
 const currentUser = getUser();

 reviews.forEach(review => {
 const card = document.createElement('div');
 card.className = 'review-card';

 const reviewId = review._id || review.id;

 const date = review.createdAt
 ? new Date(review.createdAt).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })
 : '';

 const ratingClass = getRatingClass(review.rating);
 const initials = getInitials(review.author);

 // Only show delete button if this review belongs to the current user
 const isOwnReview = currentUser && review.userId === currentUser.id;
 const deleteHTML = isOwnReview
 ? `<button class="review-delete-btn" data-id="${reviewId}">️ Delete</button>`
 : '';

 // Use escapeHTML for user-generated content (XSS prevention)
 card.innerHTML = `
 <div class="review-header">
 <div class="review-author">
 <div class="review-avatar">${escapeHTML(initials)}</div>
 <div>
 <div class="review-author-name">${escapeHTML(review.author)}</div>
 <div class="review-date">${date}</div>
 </div>
 </div>
 <span class="review-rating ${ratingClass}">${renderStars(review.rating)}</span>
 </div>
 <div class="review-content">${escapeHTML(review.content)}</div>
 ${deleteHTML}
 `;

 // Add click handler for the delete button (if it exists)
 const deleteBtn = card.querySelector('.review-delete-btn');
 if (deleteBtn) {
 deleteBtn.addEventListener('click', () => deleteReview(reviewId));
 }

 reviewsList.appendChild(card);
 });
}

function updateMeter(reviews) {
 const totalVotes = reviews ? reviews.length : 0;

 if (totalVotes === 0) {
 avgStars.textContent = '☆☆☆☆☆';
 avgRatingValue.textContent = '0.0';
 verdictValue.textContent = 'No ratings yet';
 verdictValue.style.color = 'var(--text-muted)';
 return;
 }

 // Calculate the average rating
 const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
 const avg = sum / totalVotes;

 // Display the average as stars and a number
 avgStars.textContent = renderStars(avg);
 avgRatingValue.textContent = avg.toFixed(1);

 // Show vote count
 verdictValue.textContent = `${totalVotes} review${totalVotes !== 1 ? 's' : ''}`;
 verdictValue.style.color = 'var(--text-secondary)';
}


/* --------------------------------------------------------------------------
 8. REVIEW FORM SUBMISSION (AUTH-REQUIRED)
 -------------------------------------------------------------------------- */

reviewForm.addEventListener('submit', async (event) => {
 event.preventDefault();

 // Check if user is logged in
 if (!isLoggedIn()) {
 showToast('Please log in to write a review.');
 return;
 }

 const content = document.getElementById('reviewContent').value.trim();
 const selectedRating = document.querySelector('input[name="rating"]:checked');

 if (!selectedRating) {
 showToast('Please select a rating.');
 return;
 }

 if (!content) {
 showToast('Please write your review.');
 return;
 }

 // Get the title (works for both movies and TV shows)
 const title = currentMovie?.title || currentMovie?.name || '';

 const reviewData = {
 movieId: parseInt(movieId),
 movieTitle: title,
 content: content,
 rating: selectedRating.value,
 mediaType: mediaType
 // Note: author is set automatically by the server from the JWT token
 };

 try {
 // Use authFetch to include the JWT token
 const response = await authFetch('/api/reviews', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(reviewData)
 });

 if (!response.ok) {
 const data = await response.json();
 throw new Error(data.message || 'Failed to submit review');
 }

 reviewForm.reset();
 showToast('Review submitted successfully! ');
 fetchReviews();

 } catch (error) {
 console.error('Error submitting review:', error);
 showToast(error.message || 'Failed to submit review. Please try again.');
 }
});


/* --------------------------------------------------------------------------
 9. DELETE A REVIEW (AUTH-REQUIRED)
 -------------------------------------------------------------------------- */

async function deleteReview(reviewId) {
 if (!confirm('Are you sure you want to delete this review?')) {
 return;
 }

 try {
 // Use authFetch to include the JWT token
 const response = await authFetch(`/api/reviews/${reviewId}`, {
 method: 'DELETE'
 });

 if (!response.ok) {
 const data = await response.json();
 throw new Error(data.message || 'Failed to delete review');
 }

 showToast('Review deleted.');
 fetchReviews();

 } catch (error) {
 console.error('Error deleting review:', error);
 showToast(error.message || 'Failed to delete review.');
 }
}


/* --------------------------------------------------------------------------
 10. WATCHLIST FUNCTIONALITY (AUTH-REQUIRED)
 -------------------------------------------------------------------------- */

async function checkWatchlist() {
 // Watchlist requires login
 if (!isLoggedIn()) {
 updateWatchlistButton();
 return;
 }

 try {
 const response = await authFetch('/api/watchlist');
 if (!response.ok) return;

 const watchlist = await response.json();

 // Check if our current item is in the watchlist
 // Match by both movieId AND mediaType
 isInWatchlist = watchlist.some(
 item => String(item.movieId) === String(movieId) &&
 (item.mediaType || 'movie') === mediaType
 );

 updateWatchlistButton();

 } catch (error) {
 console.error('Error checking watchlist:', error);
 }
}

function updateWatchlistButton() {
 if (isInWatchlist) {
 watchlistBtn.textContent = ' In Watchlist';
 watchlistBtn.classList.add('in-watchlist');
 } else {
 watchlistBtn.textContent = ' Add to Watchlist';
 watchlistBtn.classList.remove('in-watchlist');
 }
}

async function toggleWatchlist() {
 // Require login for watchlist
 if (!isLoggedIn()) {
 showToast('Please log in to use your watchlist.');
 return;
 }

 try {
 if (isInWatchlist) {
 // REMOVE from watchlist — include type parameter
 const response = await authFetch(
 `/api/watchlist/${movieId}?type=${mediaType}`,
 { method: 'DELETE' }
 );

 if (!response.ok) throw new Error('Failed to remove from watchlist');

 isInWatchlist = false;
 showToast('Removed from watchlist');

 } else {
 // ADD to watchlist — include mediaType
 const title = currentMovie?.title || currentMovie?.name || '';

 const response = await authFetch('/api/watchlist', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 movieId: parseInt(movieId),
 movieTitle: title,
 posterPath: currentMovie?.poster_path || '',
 mediaType: mediaType
 })
 });

 if (!response.ok) throw new Error('Failed to add to watchlist');

 isInWatchlist = true;
 showToast('Added to watchlist! ');
 }

 updateWatchlistButton();

 } catch (error) {
 console.error('Error toggling watchlist:', error);
 showToast('Something went wrong. Please try again.');
 }
}

watchlistBtn.addEventListener('click', toggleWatchlist);


/* --------------------------------------------------------------------------
 11. FAVORITES FUNCTIONALITY (AUTH-REQUIRED)
 --------------------------------------------------------------------------
 The favorite button lets users mark movies/shows they loved.
 -------------------------------------------------------------------------- */

async function checkFavorite() {
 // Favorites require login
 if (!isLoggedIn()) {
 updateFavoriteButton();
 return;
 }

 try {
 const response = await authFetch(
 `/api/favorites/check/${movieId}?type=${mediaType}`
 );

 if (!response.ok) return;

 const data = await response.json();
 isFavorited = data.isFavorited;
 updateFavoriteButton();

 } catch (error) {
 console.error('Error checking favorite:', error);
 }
}

function updateFavoriteButton() {
 if (isFavorited) {
 favoriteBtn.textContent = ' Favorited';
 favoriteBtn.classList.add('is-favorited');
 } else {
 favoriteBtn.textContent = '️ Favorite';
 favoriteBtn.classList.remove('is-favorited');
 }
}

async function toggleFavorite() {
 if (!isLoggedIn()) {
 showToast('Please log in to favorite items.');
 return;
 }

 try {
 if (isFavorited) {
 // REMOVE from favorites
 const response = await authFetch(
 `/api/favorites/${movieId}?type=${mediaType}`,
 { method: 'DELETE' }
 );

 if (!response.ok) throw new Error('Failed to remove from favorites');

 isFavorited = false;
 showToast('Removed from favorites');

 } else {
 // ADD to favorites
 const title = currentMovie?.title || currentMovie?.name || '';

 const response = await authFetch('/api/favorites', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 mediaId: parseInt(movieId),
 mediaType: mediaType,
 title: title,
 posterPath: currentMovie?.poster_path || ''
 })
 });

 if (!response.ok) throw new Error('Failed to add to favorites');

 isFavorited = true;
 showToast('Added to favorites! ️');
 }

 updateFavoriteButton();

 } catch (error) {
 console.error('Error toggling favorite:', error);
 showToast('Something went wrong. Please try again.');
 }
}

favoriteBtn.addEventListener('click', toggleFavorite);


/* --------------------------------------------------------------------------
 12. SEARCH REDIRECT
 -------------------------------------------------------------------------- */
searchInput.addEventListener('keydown', (event) => {
 if (event.key === 'Enter') {
 const query = searchInput.value.trim();
 if (query) {
 window.location.href = `/?search=${encodeURIComponent(query)}`;
 }
 }
});


/* --------------------------------------------------------------------------
 13. STAR PICKER INTERACTIVITY
 --------------------------------------------------------------------------
 CSS alone can't highlight all stars up to the selected one (no
 "previous sibling" selector), so we use a tiny bit of JS to
 toggle a 'lit' class on the star labels.
 -------------------------------------------------------------------------- */

function setupStarPicker() {
 const picker = document.getElementById('starPicker');
 if (!picker) return;

 const labels = picker.querySelectorAll('.star-label');
 const radios = picker.querySelectorAll('input[type="radio"]');

 // When a radio changes, highlight all stars up to the selected value
 function highlightStars() {
 const checked = picker.querySelector('input[type="radio"]:checked');
 const selectedValue = checked ? Number(checked.value) : 0;

 labels.forEach((label, index) => {
 // index 0 = star 1, index 1 = star 2, etc.
 if (index < selectedValue) {
 label.style.color = 'var(--gold)';
 } else {
 label.style.color = 'var(--text-muted)';
 }
 });
 }

 radios.forEach(radio => {
 radio.addEventListener('change', highlightStars);
 });

 // Also handle hover preview
 labels.forEach((label, index) => {
 label.addEventListener('mouseenter', () => {
 labels.forEach((l, i) => {
 l.style.color = i <= index ? 'var(--gold)' : 'var(--text-muted)';
 });
 });
 });

 // On mouse leave, revert to the selected state
 picker.addEventListener('mouseleave', highlightStars);
}


/* --------------------------------------------------------------------------
 14. INITIALIZE THE PAGE
 -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
 if (!movieId) return; // Don't initialize if no ID

 // Set up the review form based on auth state
 setupReviewForm();

 // Set up the interactive star picker
 setupStarPicker();

 // Fetch all data in parallel
 fetchMovieDetails();
 fetchReviews();
 checkWatchlist();
 checkFavorite();
});
