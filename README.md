# LokSangam

A full-stack geo-social platform built with the MERN stack (MongoDB, Express.js, React.js, Node.js) and Leaflet.js. LokSangam connects communities and campus students through interactive map coordinates, geo-tagged memories, and scheduled local events.

---

## Core Features

- **Interactive Dark Map Engine**: Vector tile map layer with dark-mode styling, live HTML5 GPS location tracking, and custom SVG needle markers.
- **Place Discovery and Hub**: Users can explore existing landmarks or click directly on the map to discover and pin new locations with instant coordinate indexing.
- **Dynamic Slide-out Drawer**: A responsive sliding panel that queries memories and upcoming events for any selected place via REST APIs.
- **Prioritized Engagement Feed**: Multi-image posts ranked by engagement (likes count) and recency, supporting threaded comments, follow mechanics, and optimistic client-side updates.
- **Campus Event Management**: Users can organize and schedule events tied to specific venues and inner locations, with time-based sorting and interactive RSVP likes.
- **Animated Map Flyovers**: Deep-linked navigation transitions from feed posts and event logs directly to map pins.
- **User Profiles**: Profile statistics (total likes built, followers count, published memories count), user timelines, and follow/unfollow mechanisms.
- **Media Handling and Lightbox**: Multi-image photo uploads and a fullscreen backdrop lightbox for media zoom.

---

## Architecture and Tech Stack

- **Frontend**: React 18, React Router DOM v6, Leaflet.js, MapLibre GL, Bootstrap 5, Vite
- **Backend**: Node.js, Express.js, Mongoose ODM, JWT Authentication, Multer
- **Database**: MongoDB with 2dsphere geospatial indexing for coordinate queries
- **Styling**: Responsive Gen-Z dark theme palette, CSS keyframe animations, glassmorphic blur effects

---

## Project Structure

```
loksangam-mern/
├── backend/
│   ├── models/            # Mongoose schemas (Place, Post, Event, User, Comment)
│   ├── routes/            # REST API route handlers
│   │   ├── auth.js        # Authentication endpoints (signup, login, me)
│   │   ├── places.js      # Place discovery and retrieval
│   │   ├── posts.js       # Memory feed, post creation, likes, comments
│   │   ├── events.js      # Event scheduling and likes
│   │   └── users.js       # User profile and follow mechanics
│   ├── middleware/        # JWT verification middleware
│   ├── uploads/           # Media storage for post and event photos
│   ├── seed_data.json     # Initial database records
│   ├── db.js              # Database connection and data store adapter
│   └── server.js          # Main Express server
└── frontend/
    ├── src/
    │   ├── components/    # MapSection, MemoryCard, Navbar, LightboxModal, BackToTop
    │   ├── context/       # AuthContext
    │   ├── pages/         # HomePage, EventsPage, MemoryDetailPage, PublicProfilePage, etc.
    │   ├── index.css      # Dark theme styling and Leaflet overrides
    │   └── App.jsx        # Route definitions
    ├── index.html         # Entry HTML
    └── vite.config.js     # Vite configuration with API proxy
```

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arnavmanu05/loksangam-mern.git
   cd loksangam-mern
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

---

## Running the Application

### Production / Unified Server
From the root directory, start the Express server (serves both API and compiled frontend):
```bash
npm start
```
The application will be live at `http://localhost:5000`.

### Development Mode (Hot-Reloading)
Run backend and frontend concurrently in separate terminals:

1. **Terminal 1 - Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   Backend runs on `http://localhost:5000`.

2. **Terminal 2 - Frontend Client**:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on `http://localhost:3000` with automated proxying to the backend.

---

## REST API Reference

### Authentication
- `POST /api/auth/signup` - Register a new account
- `POST /api/auth/login` - Authenticate user credentials and return JWT
- `GET /api/auth/me` - Retrieve current authenticated session

### Places
- `GET /api/places` - Retrieve all places with memory counts and ratings
- `POST /api/places/discover` - Pin and register a new location
- `GET /api/places/:id/memories` - Get all memories for a place
- `GET /api/places/:id/events` - Get scheduled events for a place

### Posts and Feed
- `GET /api/posts/feed` - Retrieve prioritized feed (followed posts and global discovery)
- `POST /api/posts` - Publish a new memory with photo uploads
- `GET /api/posts/:id` - Retrieve memory details and comments
- `POST /api/posts/:id/comments` - Add a comment to a memory
- `POST /api/posts/:id/like` - Toggle like on a memory

### Events
- `GET /api/events` - Retrieve all scheduled campus events
- `POST /api/events` - Schedule a new event with poster upload
- `POST /api/events/:id/like` - Toggle like on an event

### Users
- `GET /api/users/:username` - Get public profile, stats, and memory timeline
- `POST /api/users/:username/follow` - Toggle follow status on a user

---

## License

This project is licensed under the MIT License.
