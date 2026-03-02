const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, default: "" },

  email: { type: String, required: true, unique: true, lowercase: true },

  phone: { type: String },

  password: { type: String, required: true },

  age: { type: Number },   // ✅ ADD

  photo: { type: String }, // ✅ ADD (S3 URL later)

  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String }   // ✅ ADD
  },

  profileCompleted: {      // ✅ ADD
    type: Boolean,
    default: false
  },

  skills: [String],
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  wallet: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, required: true },

  fcmToken: { type: String }
});

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});


userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Employer', userSchema);
