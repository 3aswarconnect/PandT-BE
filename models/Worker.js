const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, default:"" },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  password: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  },
  skills: [String],
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  wallet: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  role:{type:String,required :true},
    jobs: [
    {
      job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
      status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected', 'completed'], 
        default: 'pending' 
      },
      appliedAt: { type: Date, default: Date.now }
    }
  ],
});

userSchema.index({ location: '2dsphere' });


userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});


userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('Worker', userSchema);
