import mongoose from 'mongoose';

const paymentRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, uppercase: true, trim: true, match: /^[A-Z]{3}$/ },
  method: { type: String, required: true, trim: true, maxlength: 50 },
  reference: { type: String, trim: true, maxlength: 100, default: '' },
  paidAt: { type: Date, required: true },
  notes: { type: String, trim: true, maxlength: 500, default: '' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

paymentRecordSchema.index({ student: 1, paidAt: -1 });

export default mongoose.model('PaymentRecord', paymentRecordSchema);
