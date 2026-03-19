const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected','queued'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
   proposedAmount: {
    type: Number,
  },
});

const jobSchema = new mongoose.Schema({
  employer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employer', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Construction', 'Road Work', 'Delivery', 'Daily Work', 'Cleaning', 'Painting', 'Plumbing', 'Electrical', 'Other'],
    required: true
  },
  amount: { type: Number, required: true },
duration: {
  value: { type: Number, required: true },
  unit: { 
    type: String, 
    enum: ['hours', 'days','minutes'], 
    required: true 
  }
}, location: {
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    default: [0, 0]
  },
  address: String
},
  status: { type: String, enum: ['open', 'in_progress', 'completed', 'cancelled'], default: 'open' },
  applications: [applicationSchema],
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', default: null },
  payment: {
    status: { type: String, enum: ['pending', 'paid', 'released'], default: 'pending' },
    method: { type: String, enum: ['upi', 'cash', 'wallet'], default: 'cash' },
    paidAt: Date
  },
  createdAt: { type: Date, default: Date.now },
  otp: {
  code: String,
  expiresAt: Date,
  verified: { type: Boolean, default: false }
},
queue: [
  { type: mongoose.Schema.Types.ObjectId, ref: "Worker" }
],
jobStartedAt: Date,
jobCompletedAt: Date
});

jobSchema.index({ 'location': '2dsphere' });
jobSchema.index({ status: 1, category: 1 });

module.exports = mongoose.model('Job', jobSchema);
