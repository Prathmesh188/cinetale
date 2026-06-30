# Cinetale — Movie Discovery Platform

A beginner-friendly movie discovery and review platform built with **HTML, CSS, JavaScript, Node.js, Express, and MongoDB**.

Discover trending movies, search for your favorites, write reviews using the unique **Cinetale Meter** rating system, and manage your personal watchlist.

---

## Features

- **User Authentication** — Secure login/register with JWT and bcrypt
- **Home Page** — Hero banner with trending movies and TV shows grid
- **Multi-Search** — Instant search across both movies and TV shows
- **Detailed Info** — Full info with poster, backdrop, genres, cast, and ratings for movies and TV
- **Star Ratings** — Rate content from 1 to 5 stars
- **Reviews** — Write, read, and delete your reviews (auth required)
- **Personal Watchlist** — Save movies and TV shows to watch later
- ️**Favorites** — Keep track of your favorite content
- **User Profile** — View your stats and update your display name
- **Premium Dark Theme** — Stunning dark UI with violet accents and glassmorphism

---

## ️ Tech Stack

| Layer | Technology |
|------------|------------------------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Data | TMDB API |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster)
- A free [TMDB API Key](https://www.themoviedb.org/settings/api)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/cinetale.git
cd cinetale

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env

# 4. Add your TMDB API key to .env
# Open .env and replace "your_tmdb_api_key_here" with your actual key

# 5. Start MongoDB (if running locally)
# Make sure mongod is running

# 6. Start the server
npm start
```

Then open **http://localhost:3000** in your browser! 

### Development Mode

```bash
# Auto-restart on file changes using nodemon
npm run dev
```

---

## Project Structure

```
cinetale/
├── server.js # Express server entry point
├── package.json # Dependencies & scripts
├── .env.example # Environment variables template
├── .gitignore # Files excluded from git
│
├── models/
│ ├── User.js # User schema (name, email, password)
│ ├── Review.js # Review schema linked to user
│ ├── Watchlist.js # Watchlist schema linked to user
│ └── Favorite.js # Favorites schema linked to user
│
├── middleware/
│ └── auth.js # JWT verification middleware
│
├── routes/
│ ├── auth.js # User registration, login, profile
│ ├── movies.js # TMDB proxy routes for movies
│ ├── tv.js # TMDB proxy routes for TV shows
│ ├── reviews.js # Review CRUD routes
│ ├── watchlist.js # Watchlist routes
│ └── favorites.js # Favorites routes
│
└── public/ # Static frontend files
 ├── index.html # Home page
 ├── movie.html # Movie/TV detail page
 ├── watchlist.html # Watchlist page
 ├── profile.html # User profile page
 ├── login.html # Login page
 ├── register.html # Registration page
 ├── 404.html # 404 Error page
 ├── css/
 │ └── style.css # Complete dark theme styles
 └── js/
 ├── auth.js # Shared auth utilities
 ├── app.js # Home page logic
 ├── movie.js # Movie/TV detail page logic
 ├── watchlist.js # Watchlist page logic
 └── profile.js # Profile page logic
```

---

## API Endpoints

| Method | Endpoint | Description |
|----------|-----------------------------|-----------------------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login user |
| `GET` | `/api/auth/me` | Get current user profile |
| `PUT` | `/api/auth/me` | Update user name |
| `GET` | `/api/movies/trending` | Get trending movies |
| `GET` | `/api/movies/search?q=...` | Search movies by title |
| `GET` | `/api/movies/:id` | Get movie details + cast |
| `GET` | `/api/tv/trending` | Get trending TV shows |
| `GET` | `/api/tv/search?q=...` | Search TV shows by title |
| `GET` | `/api/tv/:id` | Get TV details + cast |
| `GET` | `/api/reviews/:movieId` | Get reviews for a media |
| `POST` | `/api/reviews` | Create a new review (Auth) |
| `DELETE` | `/api/reviews/:id` | Delete a review (Auth) |
| `GET` | `/api/watchlist` | Get user's watchlist (Auth) |
| `POST` | `/api/watchlist` | Add to watchlist (Auth) |
| `DELETE` | `/api/watchlist/:movieId` | Remove from watchlist (Auth)|
| `GET` | `/api/favorites` | Get user's favorites (Auth) |
| `POST` | `/api/favorites` | Add to favorites (Auth) |
| `DELETE` | `/api/favorites/:mediaId` | Remove from favorites (Auth)|

---

## Rating System

Cinetale uses a simple 1–5 star rating system:

| Stars | Meaning |
|-------|--------------------------------|
| ★☆☆☆☆ | Bad — don't bother |
| ★★☆☆☆ | Below average |
| ★★★☆☆ | Average — decent watch |
| ★★★★☆ | Great — recommended! |
| ★★★★★ | Masterpiece — must watch! |

---

## Design

- **Dark theme** with violet (#8b5cf6) accent colors
- **Glassmorphism** effects with backdrop blur
- **Smooth animations** and hover effects
- **Responsive** layout for desktop, tablet, and mobile
- **Inter** font from Google Fonts

---


## Credits

- Movie data provided by [TMDB](https://www.themoviedb.org/)
