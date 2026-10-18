import express from 'express';
import { localDB } from '../db.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. PUBLIC PROFILE (Matches profile_public in Django)
router.get('/:username', optionalAuth, (req, res) => {
  const targetUsername = req.params.username;
  const targetUser = localDB.data.users.find(
    u => u.username.toLowerCase() === targetUsername.toLowerCase()
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // User posts sorted by -likes.length, -created_at
  const userPosts = localDB.data.posts
    .filter(p => p.author.toLowerCase() === targetUser.username.toLowerCase())
    .sort((a, b) => {
      const likesA = (a.likes || []).length;
      const likesB = (b.likes || []).length;
      if (likesB !== likesA) return likesB - likesA;
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .map(p => {
      const place = localDB.data.places.find(
        pl => String(pl.id) === String(p.place_id) || pl.name === p.place_name
      ) || { name: p.place_name, latitude: 13.3476, longitude: 74.7921 };

      const is_liked = req.user && (p.likes || []).includes(req.user.username);

      return {
        id: p.id,
        author: p.author,
        title: p.title,
        created_at: p.created_at,
        place: {
          id: place.id,
          name: place.name,
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude)
        },
        images: p.images || [],
        likes_count: (p.likes || []).length,
        comments_count: (p.comments || []).length,
        is_liked: !!is_liked
      };
    });

  const total_memories = userPosts.length;

  // Calculate total followers (how many users have targetUser.username in their following array)
  const total_followers = localDB.data.users.filter(
    u => (u.following || []).includes(targetUser.username)
  ).length;

  // Calculate total likes built across all user posts
  const total_likes = userPosts.reduce((acc, p) => acc + p.likes_count, 0);

  // Check if current user is following targetUser
  let is_following = false;
  if (req.user) {
    const currentUser = localDB.data.users.find(u => u.username === req.user.username);
    is_following = !!(currentUser?.following || []).includes(targetUser.username);
  }

  return res.json({
    target_user: {
      id: targetUser.id,
      username: targetUser.username,
      date_joined: targetUser.date_joined
    },
    user_posts: userPosts,
    total_memories,
    total_followers,
    total_likes,
    is_following
  });
});

// 2. FOLLOW / UNFOLLOW (Matches follow_user in Django)
router.post('/:username/follow', authRequired, (req, res) => {
  const targetUsername = req.params.username;
  const currentUsername = req.user.username;

  if (targetUsername.toLowerCase() === currentUsername.toLowerCase()) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  const currentUser = localDB.data.users.find(u => u.username === currentUsername);
  const targetUser = localDB.data.users.find(
    u => u.username.toLowerCase() === targetUsername.toLowerCase()
  );

  if (!currentUser || !targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!currentUser.following) currentUser.following = [];

  const index = currentUser.following.indexOf(targetUser.username);
  let is_following = false;

  if (index > -1) {
    currentUser.following.splice(index, 1);
    is_following = false;
  } else {
    currentUser.following.push(targetUser.username);
    is_following = true;
  }

  localDB.save();

  const total_followers = localDB.data.users.filter(
    u => (u.following || []).includes(targetUser.username)
  ).length;

  return res.json({
    is_following,
    total_followers
  });
});

export default router;
