import mongoose from 'mongoose';

const rateLimitCounterSchema = new mongoose.Schema({
  key: { type: String, required: true },
  windowId: { type: Number, required: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
}, { versionKey: false });

rateLimitCounterSchema.index({ key: 1, windowId: 1 }, { unique: true });
rateLimitCounterSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RateLimitCounter', rateLimitCounterSchema);
