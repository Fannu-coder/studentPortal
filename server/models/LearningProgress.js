import mongoose from 'mongoose';

const learningProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  career: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerField', required: true },
  completedResources: { type: [mongoose.Schema.Types.ObjectId], default: [] },
}, { timestamps: true });

learningProgressSchema.index({ student: 1, career: 1 }, { unique: true });

export default mongoose.model('LearningProgress', learningProgressSchema);
