import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  content: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  author: { type: String, required: true },
  place_id: { type: mongoose.Schema.Types.Mixed, required: true },
  place_name: { type: String, required: true },
  title: { type: String, required: true },
  rating: { type: Number, default: 5 },
  images: [{ type: String }],
  likes: [{ type: String }], // array of usernames who liked
  comments: [CommentSchema],
  created_at: { type: Date, default: Date.now }
});

PostSchema.index({ created_at: -1 });

export default mongoose.models.Post || mongoose.model('Post', PostSchema);
