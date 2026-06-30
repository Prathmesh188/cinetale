/* ==========================================================================
 CINETALE — Watchlist Page JavaScript (watchlist.js)
 ==========================================================================
 This file handles the watchlist page (watchlist.html):
 - Fetching the user's saved watchlist from the backend (auth-required)
 - Rendering movie/TV cards in a grid (with remove buttons)
 - Removing items from the watchlist
 - Showing an empty state or login prompt

 The watchlist is stored on the server per-user, so it persists
 between sessions and is private to each user.
 ========================================================================== */


/* --------------------------------------------------------------------------
 1. DOM ELEMENT REFERENCES
 -------------------------------------------------------------------------- */

const watchlistGrid = document.getElementById('watchlistGrid');
const watchlistSection = document.getElementById('watchlistSection');
const emptyState = document.getElementById('emptyState');
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');
const searchInput = document.getElementById('searchInput');


/* --------------------------------------------------------------------------
 2. CONSTANTS
 -------------------------------------------------------------------------- */

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';


/* --------------------------------------------------------------------------
 3. UTILITY FUNCTIONS
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


/* --------------------------------------------------------------------------
 4. FETCH THE WATCHLIST (AUTH-REQUIRED)
 -------------------------------------------------------------------------- */

async function fetchWatchlist() {
 // Check if user is logged in before fetching
 if (!isLoggedIn()) {
 showLoginPrompt();
 return;
 }

 showLoading();

 try {
 // Use authFetch to include the JWT token
 const response = await authFetch('/api/watchlist');

 if (!response.ok) {
 if (response.status === 401) {
 showLoginPrompt();
 return;
 }
 throw new Error(`Failed to fetch watchlist. Status: ${response.status}`);
 }

 const watchlist = await response.json();

 if (watchlist.length === 0) {
 showEmptyState();
 } else {
 hideEmptyState();
 renderWatchlist(watchlist);
 }

 } catch (error) {
 console.error('Error fetching watchlist:', error);
 showToast('Failed to load watchlist.');
 } finally {
 hideLoading();
 }
}


/* --------------------------------------------------------------------------
 4.5. LOGIN PROMPT
 --------------------------------------------------------------------------
 If the user is not logged in, show a friendly message asking
 them to log in to see their watchlist.
 -------------------------------------------------------------------------- */

function showLoginPrompt() {
 watchlistSection.style.display = 'none';
 emptyState.style.display = 'block';

 emptyState.innerHTML = `
 <div class="empty-icon"></div>
 <h3>Log in to see your watchlist</h3>
 <p>Create an account or log in to save movies and TV shows to your personal watchlist.</p>
 <a href="/login.html" class="btn btn-primary">Log In</a>
 `;
}


/* --------------------------------------------------------------------------
 5. RENDER THE WATCHLIST
 -------------------------------------------------------------------------- */

function renderWatchlist(watchlist) {
 watchlistGrid.innerHTML = '';

 watchlist.forEach(item => {
 const card = document.createElement('div');
 card.className = 'movie-card';
 card.dataset.movieId = item.movieId;

 // Determine media type (default to 'movie' for backward compatibility)
 const itemType = item.mediaType || 'movie';

 const posterHTML = item.posterPath
 ? `<img
 src="${POSTER_BASE}${item.posterPath}"
 alt="${escapeHTML(item.movieTitle)} poster"
 loading="lazy"
 >`
 : `<div class="poster-fallback"></div>`;

 // Type badge for TV shows
 const typeBadge = itemType === 'tv'
 ? '<div class="type-badge"> TV</div>'
 : '';

 card.innerHTML = `
 <button class="remove-btn" title="Remove from watchlist" aria-label="Remove ${escapeHTML(item.movieTitle)} from watchlist">✕</button>
 ${posterHTML}
 ${typeBadge}
 <div class="card-info">
 <div class="card-title">${escapeHTML(item.movieTitle)}</div>
 </div>
 `;

 // Click on card → go to detail page (with correct type)
 card.addEventListener('click', (event) => {
 if (event.target.closest('.remove-btn')) return;
 window.location.href = `/movie.html?id=${item.movieId}&type=${itemType}`;
 });

 // Remove button handler
 const removeBtn = card.querySelector('.remove-btn');
 removeBtn.addEventListener('click', (event) => {
 event.stopPropagation();
 removeFromWatchlist(item.movieId, itemType, card);
 });

 watchlistGrid.appendChild(card);
 });
}


/* --------------------------------------------------------------------------
 6. REMOVE FROM WATCHLIST (AUTH-REQUIRED)
 -------------------------------------------------------------------------- */

async function removeFromWatchlist(movieId, mediaType, cardElement) {
 try {
 // Use authFetch and include type parameter
 const response = await authFetch(
 `/api/watchlist/${movieId}?type=${mediaType}`,
 { method: 'DELETE' }
 );

 if (!response.ok) {
 throw new Error(`Failed to remove. Status: ${response.status}`);
 }

 // Animate the card out
 cardElement.classList.add('fade-out');

 setTimeout(() => {
 cardElement.remove();

 // Check if grid is now empty
 if (watchlistGrid.children.length === 0) {
 showEmptyState();
 }
 }, 300);

 showToast('Removed from watchlist');

 } catch (error) {
 console.error('Error removing from watchlist:', error);
 showToast('Failed to remove item. Please try again.');
 }
}


/* --------------------------------------------------------------------------
 7. EMPTY STATE MANAGEMENT
 -------------------------------------------------------------------------- */

function showEmptyState() {
 emptyState.style.display = 'block';
 watchlistSection.style.display = 'none';
}

function hideEmptyState() {
 emptyState.style.display = 'none';
 watchlistSection.style.display = 'block';
}


/* --------------------------------------------------------------------------
 8. SEARCH REDIRECT
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
 9. INITIALIZE THE PAGE
 -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
 fetchWatchlist();
});
