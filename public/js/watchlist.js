/* ==========================================================================
   CINETALE — Watchlist Page JavaScript (watchlist.js)
   ==========================================================================
   This file handles the watchlist page (watchlist.html):
   - Fetching the user's saved watchlist from the backend
   - Rendering movie cards in a grid (with remove buttons)
   - Removing movies from the watchlist
   - Showing an empty state when the watchlist is empty
   
   The watchlist is stored on the server, so it persists between sessions.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. DOM ELEMENT REFERENCES
   --------------------------------------------------------------------------
   Grab all the HTML elements we'll need to interact with.
   -------------------------------------------------------------------------- */

// The grid container where movie cards are displayed
const watchlistGrid = document.getElementById('watchlistGrid');

// The section containing the grid
const watchlistSection = document.getElementById('watchlistSection');

// The empty state message (shown when no movies are saved)
const emptyState = document.getElementById('emptyState');

// Loading spinner and toast notification
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');

// Search input (for redirect to home page)
const searchInput = document.getElementById('searchInput');


/* --------------------------------------------------------------------------
   2. CONSTANTS
   -------------------------------------------------------------------------- */

// TMDB poster image base URL
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';


/* --------------------------------------------------------------------------
   3. UTILITY FUNCTIONS
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
 * Displays a temporary notification at the bottom of the screen.
 *
 * @param {string} message - The notification text
 */
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}


/* --------------------------------------------------------------------------
   4. FETCH THE WATCHLIST
   --------------------------------------------------------------------------
   Gets the list of saved movies from our backend API and displays them.
   -------------------------------------------------------------------------- */

/**
 * fetchWatchlist()
 * Fetches the user's watchlist and renders it.
 * If the watchlist is empty, shows the empty state message instead.
 */
async function fetchWatchlist() {
  showLoading();

  try {
    // Fetch the watchlist from our backend
    const response = await fetch('/api/watchlist');

    if (!response.ok) {
      throw new Error(`Failed to fetch watchlist. Status: ${response.status}`);
    }

    // The API returns an array of watchlist items
    // Each item has: movieId, movieTitle, posterPath, and possibly _id
    const watchlist = await response.json();

    // Decide whether to show the grid or the empty state
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
   5. RENDER THE WATCHLIST
   --------------------------------------------------------------------------
   Creates a movie card for each item in the watchlist.
   Each card includes a remove button (×) that appears on hover.
   -------------------------------------------------------------------------- */

/**
 * renderWatchlist(watchlist)
 * Clears the grid and creates a card for each watchlist item.
 *
 * @param {Array} watchlist - Array of watchlist items with:
 *   - movieId: TMDB movie ID
 *   - movieTitle: movie title
 *   - posterPath: path to the poster image
 */
function renderWatchlist(watchlist) {
  // Clear any existing cards
  watchlistGrid.innerHTML = '';

  watchlist.forEach(item => {
    // Create the card container
    const card = document.createElement('div');
    card.className = 'movie-card';
    // Store the movie ID on the element so we can reference it later
    card.dataset.movieId = item.movieId;

    // Build the poster image (or fallback if no poster)
    const posterHTML = item.posterPath
      ? `<img
           src="${POSTER_BASE}${item.posterPath}"
           alt="${item.movieTitle} poster"
           loading="lazy"
         >`
      : `<div class="poster-fallback">🎬</div>`;

    // Build the card HTML
    // Notice the remove button (×) — it appears on hover via CSS
    card.innerHTML = `
      <button class="remove-btn" title="Remove from watchlist" aria-label="Remove ${item.movieTitle} from watchlist">✕</button>
      ${posterHTML}
      <div class="card-info">
        <div class="card-title">${item.movieTitle}</div>
      </div>
    `;

    // --- Event Listeners ---

    // Click on the card (but NOT the remove button) → go to movie detail
    card.addEventListener('click', (event) => {
      // Check if the click was on the remove button
      // If so, don't navigate (the remove button has its own handler)
      if (event.target.closest('.remove-btn')) return;

      // Navigate to the movie detail page
      window.location.href = `/movie.html?id=${item.movieId}`;
    });

    // Click on the remove button → remove from watchlist
    const removeBtn = card.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (event) => {
      // Stop the click from bubbling up to the card's click handler
      event.stopPropagation();

      // Call the remove function
      removeFromWatchlist(item.movieId, card);
    });

    // Add the card to the grid
    watchlistGrid.appendChild(card);
  });
}


/* --------------------------------------------------------------------------
   6. REMOVE FROM WATCHLIST
   --------------------------------------------------------------------------
   Sends a DELETE request to remove a movie, then animates the card out.
   -------------------------------------------------------------------------- */

/**
 * removeFromWatchlist(movieId, cardElement)
 * Removes a movie from the watchlist and animates the card away.
 *
 * @param {number|string} movieId - The TMDB movie ID to remove
 * @param {HTMLElement} cardElement - The DOM element to animate and remove
 */
async function removeFromWatchlist(movieId, cardElement) {
  try {
    // Send a DELETE request to our backend
    const response = await fetch(`/api/watchlist/${movieId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to remove. Status: ${response.status}`);
    }

    // --- Animate the card out ---
    // Add the "fade-out" CSS class which triggers a CSS animation
    cardElement.classList.add('fade-out');

    // Wait for the animation to finish (300ms, matching our CSS),
    // then remove the element from the DOM
    setTimeout(() => {
      cardElement.remove();

      // Check if the grid is now empty
      if (watchlistGrid.children.length === 0) {
        showEmptyState();
      }
    }, 300);

    // Show a success notification
    showToast('Removed from watchlist');

  } catch (error) {
    console.error('Error removing from watchlist:', error);
    showToast('Failed to remove movie. Please try again.');
  }
}


/* --------------------------------------------------------------------------
   7. EMPTY STATE MANAGEMENT
   --------------------------------------------------------------------------
   Functions to show/hide the empty state message.
   -------------------------------------------------------------------------- */

/**
 * showEmptyState()
 * Shows the "Your watchlist is empty" message and hides the grid.
 */
function showEmptyState() {
  emptyState.style.display = 'block';
  watchlistSection.style.display = 'none';
}

/**
 * hideEmptyState()
 * Hides the empty state message and shows the grid.
 */
function hideEmptyState() {
  emptyState.style.display = 'none';
  watchlistSection.style.display = 'block';
}


/* --------------------------------------------------------------------------
   8. SEARCH REDIRECT
   --------------------------------------------------------------------------
   If the user types in the search bar and presses Enter, redirect them
   to the home page where the search functionality lives.
   -------------------------------------------------------------------------- */
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    const query = searchInput.value.trim();
    if (query) {
      // Redirect to home page with the search query
      window.location.href = `/?search=${encodeURIComponent(query)}`;
    }
  }
});


/* --------------------------------------------------------------------------
   9. INITIALIZE THE PAGE
   --------------------------------------------------------------------------
   When the DOM is ready, fetch and display the watchlist.
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  fetchWatchlist();
});
