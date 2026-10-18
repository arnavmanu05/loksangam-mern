import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { localDB, isMongoConnected } from '../db.js';
import User from '../models/User.js';
import { authRequired, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// SIGNUP
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim();

  // Check if user already exists
  const existingUser = localDB.data.users.find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );
  if (existingUser) {
    return res.status(400).json({ error: 'A user with that username already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: Date.now(),
    username: cleanUsername,
    password: hashedPassword,
    date_joined: new Date().toISOString(),
    following: []
  };

  localDB.data.users.push(newUser);
  localDB.save();

  if (isMongoConnected) {
    try {
      await User.create({
        username: cleanUsername,
        password: hashedPassword,
        date_joined: new Date(),
        following: []
      });
    } catch (e) {
      console.warn('Mongo user save warning:', e.message);
    }
  }

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      following: []
    }
  });
});

// LOGIN
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUsername = username.trim();
  const user = localDB.data.users.find(
    u => u.username.toLowerCase() === cleanUsername.toLowerCase()
  );

  if (!user) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  // If user password exists and starts with $2 (bcrypt), verify. Otherwise, check or allow
  let isValid = true;
  if (user.password) {
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.password);
    } else {
      isValid = user.password === password;
    }
  }

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      following: user.following || []
    }
  });
});

// GET CURRENT USER (/api/auth/me)
router.get('/me', authRequired, (req, res) => {
  const user = localDB.data.users.find(u => u.username === req.user.username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({
    id: user.id,
    username: user.username,
    date_joined: user.date_joined,
    following: user.following || []
  });
});

export default router;
