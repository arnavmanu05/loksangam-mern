import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { localDB, isMongoConnected } from '../db.js';
import Event from '../models/Event.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer storage for event poster uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'event_images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'event-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// 1. GET ALL EVENTS
router.get('/', optionalAuth, (req, res) => {
  const currentUsername = req.user?.username;

  const events = [...localDB.data.events]
    .sort((a, b) => {
      const likesA = (a.likes || []).length;
      const likesB = (b.likes || []).length;
      if (likesB !== likesA) return likesB - likesA;
      return new Date(a.event_datetime) - new Date(b.event_datetime);
    })
    .map(e => {
      const place = localDB.data.places.find(
        p => String(p.id) === String(e.place_id) || p.name === e.place_name
      ) || { id: e.place_id, name: e.place_name, latitude: 13.3476, longitude: 74.7921 };

      const is_liked = currentUsername && (e.likes || []).includes(currentUsername);

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        event_datetime: e.event_datetime,
        inner_location: e.inner_location,
        image: e.image,
        creator: e.creator,
        likes_count: (e.likes || []).length,
        is_liked: !!is_liked,
        place: {
          id: place.id,
          name: place.name,
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude)
        }
      };
    });

  return res.json(events);
});

// 2. CREATE EVENT
router.post('/', authRequired, upload.single('image'), async (req, res) => {
  const { place_id, title, description, event_datetime, inner_location } = req.body;
  if (!place_id || !title || !description || !event_datetime) {
    return res.status(400).json({ error: 'Place, title, description and datetime are required' });
  }

  const place = localDB.data.places.find(p => String(p.id) === String(place_id));
  if (!place) {
    return res.status(404).json({ error: 'Selected place does not exist' });
  }

  const imageUrl = req.file ? `/media/event_images/${req.file.filename}` : null;

  const newEvent = {
    id: Date.now(),
    place_id: place.id,
    place_name: place.name,
    creator: req.user.username,
    title: title.trim(),
    description: description.trim(),
    event_datetime: new Date(event_datetime).toISOString(),
    inner_location: inner_location ? inner_location.trim() : null,
    image: imageUrl,
    likes: [],
    created_at: new Date().toISOString()
  };

  localDB.data.events.unshift(newEvent);
  localDB.save();

  if (isMongoConnected) {
    try {
      await Event.create(newEvent);
    } catch (e) {
      console.warn('Mongo event save warning:', e.message);
    }
  }

  return res.status(201).json(newEvent);
});

// 3. LIKE EVENT
router.post('/:id/like', authRequired, (req, res) => {
  const event = localDB.data.events.find(e => String(e.id) === String(req.params.id));
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (!event.likes) event.likes = [];
  const username = req.user.username;
  const index = event.likes.indexOf(username);

  let liked = false;
  if (index > -1) {
    event.likes.splice(index, 1);
    liked = false;
  } else {
    event.likes.push(username);
    liked = true;
  }

  localDB.save();
  return res.json({ liked, count: event.likes.length });
});

export default router;
