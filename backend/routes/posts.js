import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { localDB, isMongoConnected } from '../db.js';
import Post from '../models/Post.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Multer storage for multi-image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'post_images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'post-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Helper to calculate post view details
function formatPost(post, currentUsername) {
  const is_liked = currentUsername && (post.likes || []).includes(currentUsername);
  const place = localDB.data.places.find(
    p => String(p.id) === String(post.place_id) || p.name === post.place_name
  ) || { id: post.place_id, name: post.place_name, latitude: 13.3476, longitude: 74.7921 };

  return {
    id: post.id,
    author: post.author,
    title: post.title,
    rating: post.rating || 5,
    place: {
      id: place.id,
      name: place.name,
      latitude: parseFloat(place.latitude),
      longitude: parseFloat(place.longitude)
    },
    images: post.images || [],
    likes_count: (post.likes || []).length,
    comments_count: (post.comments || []).length,
    is_liked: !!is_liked,
    created_at: post.created_at
  };
}

// 1. GET FEED
router.get('/feed', optionalAuth, (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  const currentUsername = req.user?.username;

  let followed_posts = [];
  let discovery_posts = [];
  let discovery_users = [];
  let all_users = [];

  const allPosts = [...localDB.data.posts];

  // Helper sort by engagement: -like_count, -created_at
  const engagementSort = (a, b) => {
    const likesA = (a.likes || []).length;
    const likesB = (b.likes || []).length;
    if (likesB !== likesA) return likesB - likesA;
    return new Date(b.created_at) - new Date(a.created_at);
  };

  if (query) {
    // Filter posts by title or place name
    discovery_posts = allPosts
      .filter(p => (
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.place_name && p.place_name.toLowerCase().includes(query))
      ))
      .sort(engagementSort)
      .map(p => formatPost(p, currentUsername));

    // Filter matching users
    discovery_users = localDB.data.users
      .filter(u => u.username.toLowerCase().includes(query))
      .map(u => ({ id: u.id, username: u.username }));

  } else if (currentUsername) {
    const currentUser = localDB.data.users.find(u => u.username === currentUsername);
    const followingList = currentUser?.following || [];

    // Followed posts: author in following or is current user
    followed_posts = allPosts
      .filter(p => followingList.includes(p.author) || p.author === currentUsername)
      .sort(engagementSort)
      .map(p => formatPost(p, currentUsername));

    // Discovery posts: everyone else
    discovery_posts = allPosts
      .filter(p => !followingList.includes(p.author) && p.author !== currentUsername)
      .sort(engagementSort)
      .map(p => formatPost(p, currentUsername));

    all_users = localDB.data.users
      .filter(u => u.username !== currentUsername)
      .map(u => ({ id: u.id, username: u.username }));
  } else {
    // Unauthenticated feed
    discovery_posts = allPosts
      .sort(engagementSort)
      .map(p => formatPost(p, null));
  }

  // Top 3 events by like count
  const top_events = [...localDB.data.events]
    .sort((a, b) => ((b.likes || []).length) - ((a.likes || []).length))
    .slice(0, 3)
    .map(e => {
      const place = localDB.data.places.find(
        p => String(p.id) === String(e.place_id) || p.name === e.place_name
      ) || { name: e.place_name };
      return {
        id: e.id,
        title: e.title,
        place: { name: place.name },
        event_datetime: e.event_datetime,
        image: e.image,
        num_likes: (e.likes || []).length
      };
    });

  return res.json({
    followed_posts,
    discovery_posts,
    discovery_users,
    all_users,
    top_events,
    query
  });
});

// 2. CREATE POST
router.post('/', authRequired, upload.array('images', 10), async (req, res) => {
  const { place_id, title } = req.body;
  if (!place_id || !title) {
    return res.status(400).json({ error: 'Place and title are required' });
  }

  const place = localDB.data.places.find(p => String(p.id) === String(place_id));
  if (!place) {
    return res.status(404).json({ error: 'Selected place does not exist' });
  }

  const uploadedImageUrls = (req.files || []).map(
    f => `/media/post_images/${f.filename}`
  );

  const newPost = {
    id: Date.now(),
    author: req.user.username,
    place_id: place.id,
    place_name: place.name,
    title: title.trim(),
    rating: 5,
    images: uploadedImageUrls,
    likes: [],
    comments: [],
    created_at: new Date().toISOString()
  };

  localDB.data.posts.unshift(newPost);
  localDB.save();

  if (isMongoConnected) {
    try {
      await Post.create(newPost);
    } catch (e) {
      console.warn('Mongo post save warning:', e.message);
    }
  }

  return res.status(201).json(formatPost(newPost, req.user.username));
});

// 3. GET SINGLE POST DETAIL
router.get('/:id', optionalAuth, (req, res) => {
  const post = localDB.data.posts.find(p => String(p.id) === String(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const formatted = formatPost(post, req.user?.username);
  const comments = (post.comments || []).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return res.json({
    post: formatted,
    comments
  });
});

// 4. ADD COMMENT (Equivalent to comment in /memory/<id>/)
router.post('/:id/comments', authRequired, (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  const post = localDB.data.posts.find(p => String(p.id) === String(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const newComment = {
    id: Date.now(),
    author: req.user.username,
    content: content.trim(),
    created_at: new Date().toISOString()
  };

  if (!post.comments) post.comments = [];
  post.comments.unshift(newComment);
  localDB.save();

  return res.status(201).json(newComment);
});

// 5. LIKE / UNLIKE POST
router.post('/:id/like', authRequired, (req, res) => {
  const post = localDB.data.posts.find(p => String(p.id) === String(req.params.id));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (!post.likes) post.likes = [];
  const username = req.user.username;
  const index = post.likes.indexOf(username);

  let liked = false;
  if (index > -1) {
    post.likes.splice(index, 1);
    liked = false;
  } else {
    post.likes.push(username);
    liked = true;
  }

  localDB.save();
  return res.json({ liked, count: post.likes.length });
});

export default router;
