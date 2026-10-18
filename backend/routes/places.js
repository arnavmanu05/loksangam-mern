import express from 'express';
import { localDB, isMongoConnected } from '../db.js';
import Place from '../models/Place.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. GET ALL PLACES (With memory count and avg rating)
router.get('/', (req, res) => {
  const places = localDB.data.places.map(p => {
    const placePosts = localDB.data.posts.filter(
      post => String(post.place_id) === String(p.id) || post.place_name === p.name
    );
    const num_memories = placePosts.length;
    const avg_rating = num_memories > 0
      ? placePosts.reduce((acc, curr) => acc + (curr.rating || 5), 0) / num_memories
      : 0;

    return {
      id: p.id,
      name: p.name,
      address: p.address || '',
      latitude: parseFloat(p.latitude),
      longitude: parseFloat(p.longitude),
      num_memories,
      avg_rating: parseFloat(avg_rating.toFixed(1))
    };
  });

  return res.json(places);
});

// 2. DISCOVER NEW PLACE
router.post('/discover', authRequired, async (req, res) => {
  const { name, latitude, longitude } = req.body;
  if (!name || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ status: 'error', message: 'Name, latitude and longitude are required' });
  }

  const newPlace = {
    id: Date.now(),
    name: name.trim(),
    address: '',
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    created_by: req.user.username,
    created_at: new Date().toISOString()
  };

  localDB.data.places.push(newPlace);
  localDB.save();

  if (isMongoConnected) {
    try {
      await Place.create({
        name: newPlace.name,
        latitude: newPlace.latitude,
        longitude: newPlace.longitude,
        location: {
          type: 'Point',
          coordinates: [newPlace.longitude, newPlace.latitude]
        },
        created_by: req.user.username
      });
    } catch (e) {
      console.warn('Mongo place save warning:', e.message);
    }
  }

  return res.json({
    status: 'success',
    id: newPlace.id,
    name: newPlace.name
  });
});

// 3. GET PLACE MEMORIES
router.get('/:id/memories', optionalAuth, (req, res) => {
  const placeId = req.params.id;
  const place = localDB.data.places.find(p => String(p.id) === String(placeId));
  if (!place) {
    return res.status(404).json({ error: 'Place not found' });
  }

  const memories = localDB.data.posts
    .filter(m => String(m.place_id) === String(placeId) || m.place_name === place.name)
    .sort((a, b) => {
      const likesA = (a.likes || []).length;
      const likesB = (b.likes || []).length;
      if (likesB !== likesA) return likesB - likesA;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // Cover photo: highest likes, tie-break by date
  let place_display_photo = null;
  if (memories.length > 0) {
    const topMemory = memories[0];
    if (topMemory.images && topMemory.images.length > 0) {
      place_display_photo = topMemory.images[0];
    }
  }

  const memory_list = memories.map(m => {
    const is_liked = req.user && (m.likes || []).includes(req.user.username);
    const dateFormatted = new Date(m.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });

    return {
      id: m.id,
      author: m.author,
      title: m.title,
      image_url: (m.images && m.images.length > 0) ? m.images[0] : null,
      images: m.images || [],
      date: dateFormatted,
      likes: (m.likes || []).length,
      is_liked: !!is_liked
    };
  });

  return res.json({
    name: place.name,
    id: place.id,
    cover_photo: place_display_photo,
    memories: memory_list
  });
});

// 4. GET PLACE EVENTS
router.get('/:id/events', optionalAuth, (req, res) => {
  const placeId = req.params.id;
  const place = localDB.data.places.find(p => String(p.id) === String(placeId));
  if (!place) {
    return res.status(404).json({ error: 'Place not found' });
  }

  const events = localDB.data.events
    .filter(e => String(e.place_id) === String(placeId) || e.place_name === place.name)
    .sort((a, b) => new Date(a.event_datetime) - new Date(b.event_datetime));

  const event_list = events.map(e => {
    const is_liked = req.user && (e.likes || []).includes(req.user.username);
    const dateObj = new Date(e.event_datetime);
    const dateFormatted = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      date: dateFormatted,
      event_datetime: e.event_datetime,
      inner_location: e.inner_location,
      image_url: e.image || null,
      likes: (e.likes || []).length,
      is_liked: !!is_liked,
      creator: e.creator
    };
  });

  return res.json({
    name: place.name,
    id: place.id,
    events: event_list
  });
});

export default router;
