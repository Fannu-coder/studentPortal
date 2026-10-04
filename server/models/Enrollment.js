import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetType: { type: String, enum: ['project', 'competition'], required: true },
  target: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetTitle: { type: String, required: true, trim: true },
  contactEmail: { type: String, required: true, trim: true, lowercase: true },
  skills: { type: String, trim: true, default: '' },
  motivation: { type: String, required: true, trim: true, maxlength: 1200 },
  status: { type: String, enum: ['pending', 'selected', 'declined'], default: 'pending', index: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

enrollmentSchema.index({ student: 1, targetType: 1, target: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);
