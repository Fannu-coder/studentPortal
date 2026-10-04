import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  topic: { type: String, enum: ['general', 'learning', 'opportunity', 'technical', 'other'], default: 'general' },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
}, { timestamps: true });

contactMessageSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('ContactMessage', contactMessageSchema);
