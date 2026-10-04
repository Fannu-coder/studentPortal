import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planName: { type: String, required: true, trim: true, maxlength: 80 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'active', 'expired'], required: true },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

subscriptionSchema.index({ student: 1, endDate: -1 });

export default mongoose.model('Subscription', subscriptionSchema);
