# 🎬 Cinetale — Movie Discovery Platform

A beginner-friendly movie discovery and review platform built with **HTML, CSS, JavaScript, Node.js, Express, and MongoDB**.

Discover trending movies, search for your favorites, write reviews using the unique **Cinetale Meter** rating system, and manage your personal watchlist.

---

## ✨ Features

- 🏠 **Home Page** — Hero banner with trending movies grid
- 🔍 **Search** — Instant search with debounced input
- 🎬 **Movie Details** — Full info with poster, backdrop, genres, cast, and ratings
- 🎯 **Cinetale Meter** — Rate movies as: Skip 💀 | Time Pass 🍿 | Go For It 🎬 | Perfection 👑
- 📝 **Reviews** — Write, read, and delete movie reviews
- 📋 **Watchlist** — Save movies to watch later
- 🌙 **Premium Dark Theme** — Stunning dark UI with violet accents and glassmorphism

---

## 🛠️ Tech Stack

| Layer      | Technology             |
|------------|------------------------|
| Frontend   | HTML, CSS, JavaScript  |
| Backend    | Node.js + Express.js   |
| Database   | MongoDB (Mongoose)     |
| Movie Data | TMDB API               |

---

## 🚀 Getting Started

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

Then open **http://localhost:3000** in your browser! 🎉

### Development Mode

```bash
# Auto-restart on file changes using nodemon
npm run dev
```

---

## 📁 Project Structure

```
cinetale/
├── server.js              # Express server entry point
├── package.json           # Dependencies & scripts
├── .env.example           # Environment variables template
├── .gitignore             # Files excluded from git
│
├── models/
│   ├── Review.js          # Review schema (movieId, author, content, rating)
│   └── Watchlist.js       # Watchlist schema (movieId, movieTitle, posterPath)
│
├── routes/
│   ├── movies.js          # TMDB proxy routes (trending, search, details)
│   ├── reviews.js         # Review CRUD routes
│   └── watchlist.js       # Watchlist routes
│
└── public/                # Static frontend files
    ├── index.html         # Home page
    ├── movie.html         # Movie detail page
    ├── watchlist.html     # Watchlist page
    ├── css/
    │   └── style.css      # Complete dark theme styles
    └── js/
        ├── app.js         # Home page logic
        ├── movie.js       # Movie detail page logic
        └── watchlist.js   # Watchlist page logic
```

---

## 📡 API Endpoints

| Method   | Endpoint                    | Description                 |
|----------|-----------------------------|-----------------------------|
| `GET`    | `/api/movies/trending`      | Get trending movies         |
| `GET`    | `/api/movies/search?q=...`  | Search movies by title      |
| `GET`    | `/api/movies/:id`           | Get movie details + cast    |
| `GET`    | `/api/reviews/:movieId`     | Get reviews for a movie     |
| `POST`   | `/api/reviews`              | Create a new review         |
| `DELETE` | `/api/reviews/:id`          | Delete a review             |
| `GET`    | `/api/watchlist`            | Get all watchlist items     |
| `POST`   | `/api/watchlist`            | Add to watchlist            |
| `DELETE` | `/api/watchlist/:movieId`   | Remove from watchlist       |

---

## 🎯 Cinetale Meter

Instead of boring star ratings, Cinetale uses a fun 4-tier rating system:

| Rating       | Emoji | Meaning                        |
|--------------|-------|--------------------------------|
| **Skip**         | 💀    | Don't bother watching          |
| **Time Pass**    | 🍿    | Watch if you have nothing else |
| **Go For It**    | 🎬    | Worth watching, recommended!   |
| **Perfection**   | 👑    | A masterpiece, must watch!     |

---

## 🎨 Design

- **Dark theme** with violet (#8b5cf6) accent colors
- **Glassmorphism** effects with backdrop blur
- **Smooth animations** and hover effects
- **Responsive** layout for desktop, tablet, and mobile
- **Inter** font from Google Fonts

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Credits

- Movie data provided by [TMDB](https://www.themoviedb.org/)
- Inspired by [Moctale.in](https://www.moctale.in/)
