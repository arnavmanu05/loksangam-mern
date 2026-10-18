import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  date_joined: { type: Date, default: Date.now },
  following: [{ type: String }] // array of usernames
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
