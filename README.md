# LokSangam (MERN Stack Edition)

A 1-to-1 full-stack port of the **LokSangam** Geo-Social Campus Platform built with the **MERN** stack (MongoDB, Express.js, React.js, Node.js).

---

## 🌟 1-to-1 Parity with Django Architecture

| Feature | Django Version | MERN Version | Parity Status |
| :--- | :--- | :--- | :--- |
| **Map & Tiles** | Leaflet.js + OpenFreeMap Positron (Inverted Dark Theme) | Leaflet.js + MapLibre GL Positron (Inverted Dark Theme) | ✅ Exact Match |
| **Custom Markers** | Red Bulb Needle SVG Icon with Gradient (`#FF512F` to `#DD2476`) | Same Custom SVG DivIcon with Tooltip | ✅ Exact Match |
| **Live Geolocation** | `map.locate({watch: true})` + Pulsing Red Marker | HTML5 Geolocation API + Leaflet Auto-Fly | ✅ Exact Match |
| **Discovery Modal** | `#discoveryModal` on map click | React Modal with Instant State Update | ✅ Exact Match |
| **Place Sidebar** | Sliding drawer (`#memory-sidebar`) with Memories/Events tabs | Sliding drawer with dynamic React tab state | ✅ Exact Match |
| **Engagement Feed** | Prioritized by Likes & Recency (`-likes`, `-created_at`) | Mongo/Express sort by likes count & recency | ✅ Exact Match |
| **Events Carousel** | Glare animation card + Tinkling Star for #1 event | CSS glare sweep animation + star pulse | ✅ Exact Match |
| **Auth Background** | Full-screen Earth Leaflet background centered on India | Full-screen Earth Leaflet background centered on India | ✅ Exact Match |
| **Image Lightbox** | Click-to-zoom dark modal on all uploaded media | Global React Lightbox Context with zoom cursor | ✅ Exact Match |
| **Data & Media** | All 18 Manipal places, 31 memories, 10 events, 12 users | Fully preserved & loaded from seed database | ✅ Exact Match |

---

## 📁 Project Structure

```
loksangam-mern/
├── backend/
│   ├── models/           # Mongoose schemas (Place with 2dsphere GeoJSON, Post, Event, User)
│   ├── routes/           # REST APIs (/api/auth, /api/places, /api/posts, /api/events, /api/users)
│   ├── middleware/       # JWT Authentication & optional auth
│   ├── uploads/          # Static media uploads (/media/post_images, /media/event_images)
│   ├── seed_data.json    # Pre-exported seed data from original SQLite database
│   ├── db.js             # Dual-engine DB (Mongoose + embedded fallback persistence)
│   └── server.js         # Unified Express server
└── frontend/
    ├── src/
    │   ├── components/   # MapSection, MemoryCard, Navbar, LightboxModal, BackToTop
    │   ├── context/      # AuthContext
    │   ├── pages/        # HomePage, EventsPage, MemoryDetailPage, PublicProfilePage, CreatePostPage, CreateEventPage, LoginPage, SignupPage
    │   ├── index.css     # Gen-Z dark theme styles & animations
    │   └── App.jsx       # React Router setup
    ├── index.html        # Leaflet, MapLibre GL, and Bootstrap assets
    └── vite.config.js    # Vite configuration with proxy
```

---

## 🚀 Running the Project

### Option A: Unified Server (Frontend + Backend on Port 5000)
```bash
cd loksangam-mern
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

### Option B: Hot-Reloading Development Mode
1. **Start Backend**:
   ```bash
   cd loksangam-mern/backend
   node server.js
   ```
2. **Start Frontend (Vite on port 3000)**:
   ```bash
   cd loksangam-mern/frontend
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)**.
