import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';

import authRoutes from './routes/auth.js';
import placeRoutes from './routes/places.js';
import postRoutes from './routes/posts.js';
import eventRoutes from './routes/events.js';
import userRoutes from './routes/users.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'post_images'),
  path.join(__dirname, 'uploads', 'event_images')
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Serve uploaded media files at /media/... (1-to-1 match with Django's MEDIA_URL)
app.use('/media', express.static(path.join(__dirname, 'uploads')));
// Also fallback serve from root media folder if needed
const rootMedia = path.join(__dirname, '..', '..', 'media');
if (fs.existsSync(rootMedia)) {
  app.use('/media', express.static(rootMedia));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/places', placeRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'LokSangam MERN',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend dist if built
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Start Server
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[LokSangam Server] Running on http://localhost:${PORT}`);
  });
}

startServer();

