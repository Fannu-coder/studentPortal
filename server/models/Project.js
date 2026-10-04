import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  skills: { type: [String], default: [] },
  opportunities: { type: String, trim: true, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

projectSchema.index({ active: 1, category: 1, title: 1 });

export default mongoose.model('Project', projectSchema);
