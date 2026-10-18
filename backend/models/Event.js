import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  place_id: { type: mongoose.Schema.Types.Mixed, required: true },
  place_name: { type: String, required: true },
  creator: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  event_datetime: { type: Date, required: true },
  inner_location: { type: String, default: null },
  image: { type: String, default: null },
  likes: [{ type: String }],
  created_at: { type: Date, default: Date.now }
});

EventSchema.index({ event_datetime: 1 });

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
