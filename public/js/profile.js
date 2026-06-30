/* ==========================================================================
 CINETALE — Profile Page JavaScript (profile.js)
 ==========================================================================
 This file handles the profile page (profile.html):
 - Checking that the user is logged in (redirect if not)
 - Fetching and displaying user data (name, email, join date)
 - Fetching and displaying stats (watchlist count, favorites count)
 - Allowing the user to update their display name

 This is a PROTECTED page — only accessible to logged-in users.
 If no valid token is found, we redirect to the login page.
 ========================================================================== */


/* --------------------------------------------------------------------------
 1. DOM ELEMENT REFERENCES
 --------------------------------------------------------------------------
 Grab all the HTML elements we'll need to update with user data.
 -------------------------------------------------------------------------- */

// Profile display elements
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileDate = document.getElementById('profileDate');

// Edit name elements
const editNameInput = document.getElementById('editNameInput');
const saveNameBtn = document.getElementById('saveNameBtn');

// Stats display elements
const statMovies = document.getElementById('statMovies');
const statTvShows = document.getElementById('statTvShows');
const statFavorites = document.getElementById('statFavorites');

// Reviews list element
const myReviewsList = document.getElementById('myReviewsList');

// Loading and toast
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');

// Search input (for redirect to home)
const searchInput = document.getElementById('searchInput');


/* --------------------------------------------------------------------------
 2. UTILITY FUNCTIONS
 -------------------------------------------------------------------------- */

/** Show the loading spinner overlay */
function showLoading() {
 loadingEl.classList.remove('hidden');
}

/** Hide the loading spinner */
function hideLoading() {
 loadingEl.classList.add('hidden');
}

/**
 * showToast(message)
 * Displays a brief notification at the bottom-right of the screen.
 *
 * @param {string} message - The text to display
 */
function showToast(message) {
 toastEl.textContent = message;
 toastEl.classList.add('show');
 setTimeout(() => {
 toastEl.classList.remove('show');
 }, 3000);
}

/**
 * getInitials(name)
 * Gets the first letter(s) of a name for the avatar circle.
 * E.g., "John Doe" → "JD", "Alice" → "A"
 *
 * @param {string} name - The person's name
 * @returns {string} - The initials (1-2 characters)
 */
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
 3. FETCH USER PROFILE DATA
 --------------------------------------------------------------------------
 Calls GET /api/auth/me with the auth token to get the current user's
 profile data (name, email, creation date).
 -------------------------------------------------------------------------- */

/**
 * fetchProfile()
 * Fetches the logged-in user's profile data and renders it on the page.
 */
async function fetchProfile() {
 showLoading();

 try {
 // Use authFetch (from auth.js) so the Authorization header is included
 const response = await authFetch('/api/auth/me');

 if (!response.ok) {
 throw new Error(`Failed to fetch profile. Status: ${response.status}`);
 }

 const user = await response.json();

 // --- Render profile info ---
 profileAvatar.textContent = getInitials(user.name);
 profileName.textContent = user.name || 'User';
 profileEmail.textContent = user.email || '';

 // Format the join date nicely
 if (user.createdAt) {
 const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 });
 profileDate.textContent = `Member since ${joinDate}`;
 }

 // Pre-fill the edit name input with the current name
 editNameInput.value = user.name || '';

 } catch (error) {
 console.error('Error fetching profile:', error);
 showToast('Failed to load profile data.');
 } finally {
 hideLoading();
 }
}


/* --------------------------------------------------------------------------
 4. FETCH STATS
 --------------------------------------------------------------------------
 Fetches watchlist and favorites counts from the backend and displays
 them in the stat cards.
 -------------------------------------------------------------------------- */

/**
 * fetchStats()
 * Fetches the user's watchlist count and favorites count in parallel
 * and updates the stat card displays.
 */
async function fetchStats() {
 try {
 // Fetch both counts in parallel using Promise.allSettled
 // allSettled won't reject if one fails — it returns status for each
 const [watchlistRes, favoritesRes] = await Promise.allSettled([
 authFetch('/api/watchlist/count'),
 authFetch('/api/favorites/count')
 ]);

 // --- Watchlist count ---
 if (watchlistRes.status === 'fulfilled' && watchlistRes.value.ok) {
 const watchlistData = await watchlistRes.value.json();
 // The API might return { movies: 5, tvShows: 3 } or { count: 8 }
 if (typeof watchlistData.movies === 'number') {
 statMovies.textContent = watchlistData.movies;
 statTvShows.textContent = watchlistData.tvShows || 0;
 } else {
 statMovies.textContent = watchlistData.count || 0;
 statTvShows.textContent = 0;
 }
 }

 // --- Favorites count ---
 if (favoritesRes.status === 'fulfilled' && favoritesRes.value.ok) {
 const favoritesData = await favoritesRes.value.json();
 statFavorites.textContent = favoritesData.total || 0;
 }

 } catch (error) {
 console.error('Error fetching stats:', error);
 }
}


/* --------------------------------------------------------------------------
 5. SAVE NAME — Update Display Name
 --------------------------------------------------------------------------
 Sends a PUT request to /api/auth/me with the new name.
 -------------------------------------------------------------------------- */

/**
 * saveName()
 * Updates the user's display name by sending a PUT request to the backend.
 */
async function saveName() {
 const newName = editNameInput.value.trim();

 if (!newName) {
 showToast('Name cannot be empty');
 return;
 }

 if (newName.length > 50) {
 showToast('Name must be 50 characters or less');
 return;
 }

 try {
 const response = await authFetch('/api/auth/me', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ name: newName })
 });

 if (!response.ok) {
 throw new Error('Failed to update name');
 }

 // Update the display
 profileName.textContent = newName;
 profileAvatar.textContent = getInitials(newName);

 showToast('Name updated! ');

 } catch (error) {
 console.error('Error saving name:', error);
 showToast('Failed to update name. Please try again.');
 }
}

/**
 * getRatingClass(rating)
 * Returns a CSS class for color-coding the numeric rating badge.
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
 * Converts a numeric rating (1-5) to stars.
 */
function renderStars(rating) {
  const num = Math.round(Number(rating));
  return '★'.repeat(num) + '☆'.repeat(5 - num);
}

/**
 * fetchMyReviews()
 * Fetches reviews written by the current user.
 */
async function fetchMyReviews() {
  try {
    const response = await authFetch('/api/reviews/user/me');
    if (!response.ok) {
      throw new Error(`Failed to fetch user reviews. Status: ${response.status}`);
    }
    const reviews = await response.json();
    renderMyReviews(reviews);
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    myReviewsList.innerHTML = '<p class="text-muted">Failed to load reviews.</p>';
  }
}

/**
 * renderMyReviews(reviews)
 * Renders the user's reviews list.
 */
function renderMyReviews(reviews) {
  myReviewsList.innerHTML = '';

  if (!reviews || reviews.length === 0) {
    myReviewsList.innerHTML = '<p class="text-muted">You haven\'t written any reviews yet.</p>';
    return;
  }

  reviews.forEach(review => {
    const card = document.createElement('div');
    card.className = 'review-card';

    const reviewId = review._id || review.id;
    const mediaType = review.mediaType || 'movie';

    const date = review.createdAt
      ? new Date(review.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : '';

    const ratingClass = getRatingClass(review.rating);

    card.innerHTML = `
      <div class="review-header">
        <div class="review-author">
          <div>
            <div class="review-author-name" style="display: flex; align-items: center; flex-wrap: wrap;">
              <a href="/movie.html?id=${review.movieId}&type=${mediaType}" class="review-movie-link">
                ${escapeHTML(review.movieTitle)}
              </a>
              <span class="media-type-badge">${mediaType === 'tv' ? 'TV Show' : 'Movie'}</span>
            </div>
            <div class="review-date">${date}</div>
          </div>
        </div>
        <span class="review-rating ${ratingClass}">${renderStars(review.rating)}</span>
      </div>
      <div class="review-content">${escapeHTML(review.content)}</div>
      <button class="review-delete-btn" data-id="${reviewId}">🗑️ Delete</button>
    `;

    const deleteBtn = card.querySelector('.review-delete-btn');
    deleteBtn.addEventListener('click', () => deleteMyReview(reviewId, card));

    myReviewsList.appendChild(card);
  });
}

/**
 * deleteMyReview(reviewId, cardElement)
 * Deletes a review from the database and updates the UI.
 */
async function deleteMyReview(reviewId, cardElement) {
  if (!confirm('Are you sure you want to delete this review?')) {
    return;
  }

  try {
    const response = await authFetch(`/api/reviews/${reviewId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete review');
    }

    // Animate removal
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'translateY(10px)';
    cardElement.style.transition = 'all 0.3s ease';

    setTimeout(() => {
      cardElement.remove();
      if (myReviewsList.children.length === 0) {
        myReviewsList.innerHTML = '<p class="text-muted">You haven\'t written any reviews yet.</p>';
      }
    }, 300);

    showToast('Review deleted successfully! 🗑️');
    
    // Refresh stats (watchlist counts and favorite counts)
    fetchStats();

  } catch (error) {
    console.error('Error deleting review:', error);
    showToast('Failed to delete review. Please try again.');
  }
}


/* --------------------------------------------------------------------------
 6. EVENT LISTENERS
 -------------------------------------------------------------------------- */

// Save name button click
saveNameBtn.addEventListener('click', saveName);

// Search redirect — send user to home page with search query
searchInput.addEventListener('keydown', (event) => {
 if (event.key === 'Enter') {
 const query = searchInput.value.trim();
 if (query) {
 window.location.href = `/?search=${encodeURIComponent(query)}`;
 }
 }
});


/* --------------------------------------------------------------------------
 7. INITIALIZE THE PAGE
 --------------------------------------------------------------------------
 When the DOM is ready, check if the user is logged in.
 If not, redirect to the login page. If yes, fetch their profile and stats.
 -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
 // This is a protected page — require login
 if (!isLoggedIn()) {
 window.location.href = '/login.html';
 return;
 }

  // Fetch profile data, stats, and reviews
  fetchProfile();
  fetchStats();
  fetchMyReviews();
});
