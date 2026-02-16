const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now }
});

const jobSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Construction', 'Road Work', 'Delivery', 'Daily Work', 'Cleaning', 'Painting', 'Plumbing', 'Electrical', 'Other'],
    required: true
  },
  pay: { type: Number, required: true },
  payType: { type: String, enum: ['hourly', 'fixed', 'daily'], default: 'fixed' },
  duration: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  applications: [applicationSchema],
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  payment: {
    status: { type: String, enum: ['pending', 'paid', 'released'], default: 'pending' },
    method: { type: String, enum: ['upi', 'cash', 'wallet'], default: 'cash' },
    paidAt: Date
  },
  createdAt: { type: Date, default: Date.now }
});

jobSchema.index({ 'location': '2dsphere' });
jobSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Job', jobSchema);
