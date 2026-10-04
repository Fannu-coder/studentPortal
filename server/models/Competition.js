import mongoose from 'mongoose';

const competitionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, required: true, trim: true },
  eligibility: { type: String, required: true, trim: true },
  registrationDetails: { type: String, trim: true, default: '' },
  deadline: { type: Date, default: null },
  active: { type: Boolean, default: true },
}, { timestamps: true });

competitionSchema.index({ active: 1, deadline: 1 });

export default mongoose.model('Competition', competitionSchema);
