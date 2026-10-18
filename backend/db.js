import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data store file for persistent embedded fallback
const DATA_FILE = path.join(__dirname, 'loksangam_db.json');
const SEED_FILE = path.join(__dirname, 'seed_data.json');

class LocalDB {
  constructor() {
    this.data = {
      users: [],
      places: [],
      posts: [],
      events: []
    };
    this.init();
  }

  init() {
    if (fs.existsSync(DATA_FILE)) {
      try {
        this.data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      } catch (err) {
        console.error('Error reading local db, reloading from seed:', err);
        this.loadSeed();
      }
    } else {
      this.loadSeed();
    }
  }

  loadSeed() {
    if (fs.existsSync(SEED_FILE)) {
      try {
        const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf-8'));
        this.data = seed;
        this.save();
        console.log(`[DB] Loaded seed data: ${this.data.places.length} places, ${this.data.posts.length} posts, ${this.data.events.length} events, ${this.data.users.length} users.`);
      } catch (err) {
        console.error('Failed to parse seed_data.json:', err);
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist local db:', err);
    }
  }
}

export const localDB = new LocalDB();

export let isMongoConnected = false;

export async function connectDB() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/loksangam';
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Connected to ${conn.connection.host}`);
  } catch (err) {
    isMongoConnected = false;
    console.log(`[MongoDB] MongoDB server not detected (${err.message}). Using seamless Local JSON Store engine.`);
  }
}
