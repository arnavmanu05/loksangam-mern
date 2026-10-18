import mongoose from 'mongoose';

const PlaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  created_by: { type: String, default: null },
  created_at: { type: Date, default: Date.now }
});

PlaceSchema.pre('save', function (next) {
  if (this.latitude && this.longitude) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude]
    };
  }
  next();
});

PlaceSchema.index({ location: '2dsphere' });

export default mongoose.models.Place || mongoose.model('Place', PlaceSchema);
