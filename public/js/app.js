/* ==========================================================================
   CINETALE — Home Page JavaScript (app.js)
   ==========================================================================
   This file handles all the logic for the home page (index.html):
   - Fetching and displaying trending movies
   - Setting up the hero banner with the first trending movie
   - Search functionality with debounced input
   - Creating movie cards for the grid
   
   We use vanilla JavaScript (no frameworks!) with:
   - fetch() for API calls
   - querySelector/querySelectorAll for DOM manipulation
   - Template literals for building HTML strings
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. DOM ELEMENT REFERENCES
   --------------------------------------------------------------------------
   We grab references to all the HTML elements we'll need to manipulate.
   Using getElementById/querySelector is the standard way to "connect"
   JavaScript to HTML elements.
   -------------------------------------------------------------------------- */

// Hero section elements — the big banner at the top
const heroSection = document.getElementById('hero');
const heroBackdrop = document.getElementById('heroBackdrop');
const heroTitle = document.getElementById('heroTitle');
const heroOverview = document.getElementById('heroOverview');
const heroDetailsBtn = document.getElementById('heroDetailsBtn');

// Search elements
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchGrid = document.getElementById('searchGrid');

// Trending section elements
const trendingSection = document.getElementById('trendingSection');
const trendingGrid = document.getElementById('trendingGrid');

// Loading spinner and toast notification
const loadingEl = document.getElementById('loading');
const toastEl = document.getElementById('toast');


/* --------------------------------------------------------------------------
   2. CONSTANTS
   --------------------------------------------------------------------------
   TMDB provides movie images at different sizes. We define the base URLs
   here so we can easily build full image URLs later.
   -------------------------------------------------------------------------- */

// Base URL for poster images (w500 = 500px wide — good for cards)
const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

// Base URL for backdrop images (original = full resolution — good for hero)
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';


/* --------------------------------------------------------------------------
   3. UTILITY FUNCTIONS
   --------------------------------------------------------------------------
   These are small helper functions used throughout the app.
   -------------------------------------------------------------------------- */

/**
 * showLoading()
 * Shows the full-screen loading spinner overlay.
 * We remove the "hidden" class to make it visible.
 */
function showLoading() {
  loadingEl.classList.remove('hidden');
}

/**
 * hideLoading()
 * Hides the loading spinner by adding the "hidden" class.
 */
function hideLoading() {
  loadingEl.classList.add('hidden');
}

/**
 * showToast(message)
 * Displays a small notification at the bottom-right of the screen.
 * The toast automatically disappears after 3 seconds.
 *
 * @param {string} message - The text to display in the toast
 */
function showToast(message) {
  // Set the toast text
  toastEl.textContent = message;

  // Add the "show" class to make it slide in
  toastEl.classList.add('show');

  // After 3 seconds, remove the "show" class to slide it out
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 3000);
}

/**
 * debounce(func, delay)
 * A utility that prevents a function from being called too frequently.
 * This is essential for search — we don't want to make an API call for
 * every single keystroke. Instead, we wait until the user stops typing.
 *
 * How it works:
 * 1. Each time the function is called, it clears the previous timer
 * 2. It sets a new timer for `delay` milliseconds
 * 3. The actual function only runs when the timer completes (user stopped typing)
 *
 * @param {Function} func - The function to debounce
 * @param {number} delay - How long to wait (in ms) after the last call
 * @returns {Function} - The debounced version of the function
 */
function debounce(func, delay) {
  // This variable holds the timer ID so we can cancel it
  let timeoutId;

  // Return a new function that wraps the original
  return function (...args) {
    // Cancel any previous timer
    clearTimeout(timeoutId);

    // Start a new timer — the function will only run if this timer
    // isn't cancelled by another call within `delay` milliseconds
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * getYear(dateString)
 * Extracts the year from a date string like "2024-05-15".
 *
 * @param {string} dateString - A date in "YYYY-MM-DD" format
 * @returns {string} - Just the year, e.g., "2024"
 */
function getYear(dateString) {
  // Safety check: if there's no date, return an empty string
  if (!dateString) return '';
  // The year is the first 4 characters of the date string
  return dateString.substring(0, 4);
}


/* --------------------------------------------------------------------------
   4. MOVIE CARD CREATION
   --------------------------------------------------------------------------
   This function creates a single movie card element for the grid.
   Each card shows the poster, title, year, and TMDB rating.
   -------------------------------------------------------------------------- */

/**
 * createMovieCard(movie)
 * Builds and returns a DOM element representing a movie card.
 * The card is clickable and navigates to the movie detail page.
 *
 * @param {Object} movie - A movie object from TMDB with properties:
 *   - id: unique movie ID
 *   - title: movie title
 *   - poster_path: path to the poster image
 *   - release_date: release date string
 *   - vote_average: TMDB rating (0-10)
 * @returns {HTMLElement} - The movie card DOM element
 */
function createMovieCard(movie) {
  // Create the main card container
  const card = document.createElement('div');
  card.className = 'movie-card';

  // Make the entire card clickable — navigate to movie detail page
  card.addEventListener('click', () => {
    window.location.href = `/movie.html?id=${movie.id}`;
  });

  // Check if the movie has a poster image
  // Some movies don't have posters, so we show a fallback
  const posterHTML = movie.poster_path
    ? `<img
         src="${POSTER_BASE}${movie.poster_path}"
         alt="${movie.title} poster"
         loading="lazy"
       >`
    : `<div class="poster-fallback">🎬</div>`;

  // Format the rating to 1 decimal place (e.g., 7.853 → "7.9")
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

  // Extract just the year from the release date
  const year = getYear(movie.release_date);

  // Build the card's inner HTML using a template literal
  // Template literals (backtick strings) let us embed variables with ${...}
  card.innerHTML = `
    ${posterHTML}
    <div class="rating-badge">⭐ ${rating}</div>
    <div class="card-info">
      <div class="card-title">${movie.title}</div>
      <div class="card-year">${year}</div>
    </div>
  `;

  return card;
}


/* --------------------------------------------------------------------------
   5. RENDER MOVIES INTO A GRID
   --------------------------------------------------------------------------
   Takes an array of movies and a grid container element, then creates
   and appends a card for each movie.
   -------------------------------------------------------------------------- */

/**
 * renderMovies(movies, gridElement)
 * Clears the grid and fills it with movie cards.
 *
 * @param {Array} movies - Array of movie objects from the API
 * @param {HTMLElement} gridElement - The container to put cards into
 */
function renderMovies(movies, gridElement) {
  // Clear any existing cards in the grid
  gridElement.innerHTML = '';

  // If no movies found, show a message
  if (!movies || movies.length === 0) {
    gridElement.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3>No movies found</h3>
        <p>Try a different search term</p>
      </div>
    `;
    return;
  }

  // Loop through each movie and create a card
  movies.forEach(movie => {
    const card = createMovieCard(movie);
    gridElement.appendChild(card);
  });
}


/* --------------------------------------------------------------------------
   6. HERO SECTION SETUP
   --------------------------------------------------------------------------
   Sets up the hero banner using the first trending movie.
   -------------------------------------------------------------------------- */

/**
 * setupHero(movie)
 * Populates the hero section with a movie's backdrop, title, and overview.
 *
 * @param {Object} movie - The movie to feature in the hero section
 */
function setupHero(movie) {
  // Set the backdrop image
  if (movie.backdrop_path) {
    heroBackdrop.style.backgroundImage =
      `url(${BACKDROP_BASE}${movie.backdrop_path})`;
  }

  // Set the title text
  heroTitle.textContent = movie.title;

  // Set the overview text
  heroOverview.textContent = movie.overview;

  // When the "View Details" button is clicked, go to the movie page
  heroDetailsBtn.onclick = () => {
    window.location.href = `/movie.html?id=${movie.id}`;
  };
}


/* --------------------------------------------------------------------------
   7. FETCH TRENDING MOVIES
   --------------------------------------------------------------------------
   Calls our backend API to get the list of trending movies,
   then renders them on the page.
   -------------------------------------------------------------------------- */

/**
 * fetchTrendingMovies()
 * Fetches trending movies from the backend API and displays them.
 * This is the main function that runs when the page loads.
 */
async function fetchTrendingMovies() {
  // Show the loading spinner while we fetch data
  showLoading();

  try {
    // fetch() makes an HTTP GET request to our backend API
    // The "await" keyword pauses until the response comes back
    const response = await fetch('/api/movies/trending');

    // Check if the request was successful (status code 200-299)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse the JSON response body
    // The API returns: { results: [...array of movie objects...] }
    const data = await response.json();
    const movies = data.results;

    // Use the first movie for the hero section (if we have any)
    if (movies && movies.length > 0) {
      setupHero(movies[0]);
    }

    // Render all movies in the trending grid
    renderMovies(movies, trendingGrid);

  } catch (error) {
    // If something goes wrong (network error, server error, etc.)
    // Log the error to the console for debugging
    console.error('Error fetching trending movies:', error);

    // Show an error message to the user
    showToast('Failed to load trending movies. Please try again.');
  } finally {
    // "finally" runs whether the request succeeded or failed
    // Always hide the loading spinner when we're done
    hideLoading();
  }
}


/* --------------------------------------------------------------------------
   8. SEARCH FUNCTIONALITY
   --------------------------------------------------------------------------
   Handles the search input: when the user types, we search for movies
   matching their query and display the results.
   -------------------------------------------------------------------------- */

/**
 * searchMovies(query)
 * Fetches movies matching the search query and displays them.
 *
 * @param {string} query - The search term entered by the user
 */
async function searchMovies(query) {
  try {
    // Make a GET request with the search query as a URL parameter
    // encodeURIComponent handles special characters in the query
    const response = await fetch(
      `/api/movies/search?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Search failed! Status: ${response.status}`);
    }

    const data = await response.json();

    // Render the search results in the search grid
    renderMovies(data.results, searchGrid);

  } catch (error) {
    console.error('Error searching movies:', error);
    showToast('Search failed. Please try again.');
  }
}

/**
 * handleSearchInput(event)
 * Called when the user types in the search bar.
 * Shows/hides sections based on whether there's a search query.
 *
 * @param {Event} event - The input event from the search field
 */
function handleSearchInput(event) {
  // Get the search query and remove leading/trailing whitespace
  const query = event.target.value.trim();

  if (query.length === 0) {
    // If the search bar is empty, show trending and hide search results
    searchResults.style.display = 'none';
    trendingSection.style.display = 'block';
    heroSection.style.display = 'flex';
  } else {
    // If there's a query, show search results and hide trending/hero
    searchResults.style.display = 'block';
    trendingSection.style.display = 'none';
    heroSection.style.display = 'none';

    // Actually search for the movies
    searchMovies(query);
  }
}

// Create a debounced version of the search handler
// This waits 300ms after the user stops typing before searching
const debouncedSearch = debounce(handleSearchInput, 300);

// Attach the debounced handler to the search input's "input" event
// The "input" event fires every time the text changes
searchInput.addEventListener('input', debouncedSearch);


/* --------------------------------------------------------------------------
   9. SEARCH BAR NAVIGATION FROM MOVIE/WATCHLIST PAGES
   --------------------------------------------------------------------------
   If a user types a search query on the movie or watchlist page and
   presses Enter, redirect them to the home page with the search query.
   (This only applies when the search input is on those pages.)
   -------------------------------------------------------------------------- */

// We also handle the Enter key on the search input for better UX
searchInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent form submission
    const query = searchInput.value.trim();
    if (query.length > 0) {
      // Immediately trigger search without waiting for debounce
      handleSearchInput({ target: searchInput });
    }
  }
});


/* --------------------------------------------------------------------------
   10. INITIALIZE THE PAGE
   --------------------------------------------------------------------------
   When the page first loads, we fetch the trending movies.
   Everything starts here!
   -------------------------------------------------------------------------- */

// DOMContentLoaded fires when the HTML is fully parsed
// This ensures our JavaScript runs after all HTML elements exist
document.addEventListener('DOMContentLoaded', () => {
  // Fetch and display trending movies
  fetchTrendingMovies();
});
