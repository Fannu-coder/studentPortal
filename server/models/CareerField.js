import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  type: { type: String, enum: ['video', 'guide', 'project', 'code', 'other'], required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  url: { type: String, trim: true, default: '' },
  duration: { type: String, trim: true, default: '' },
}, { _id: true });

const phaseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  duration: { type: String, trim: true, default: '' },
  order: { type: Number, required: true },
  resources: { type: [resourceSchema], default: [] },
}, { _id: true });

const careerFieldSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  tag: { type: String, trim: true, default: 'LEARNING PATH' },
  icon: { type: String, trim: true, default: '✳' },
  color: { type: String, enum: ['lilac', 'peach', 'mint', 'blue'], default: 'lilac' },
  estimatedWeeks: { type: Number, min: 1, default: 6 },
  active: { type: Boolean, default: true },
  phases: { type: [phaseSchema], default: [] },
}, { timestamps: true });

careerFieldSchema.index({ active: 1, category: 1, name: 1 });

export default mongoose.model('CareerField', careerFieldSchema);
