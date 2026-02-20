const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer')
const Worker = require('../models/Worker');
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.signup = async (req, res) => {
  const { email, password, role, skills } = req.body;
  console.log(req.body)

  if (role === 'employer') {
    try {

      const exists = await Employer.findOne({ email });
      if (exists) return res.status(400).json({ message: 'User already exists' });

      const user = await Employer.create({ email, password, role, skills: skills || [] });
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        }
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
 if (role === 'worker') {
    try {

      const exists = await Worker.findOne({ email });
      if (exists) return res.status(400).json({ message: 'User already exists' });

      const user = await Worker.create({ email, password, role, skills: skills || [] });
      res.status(201).json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        }
      });

    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  console.log(req.body);

  try {
    let user;

    if (role === "employer") {
      user = await Employer.findOne({ email });
    } else if (role === "worker") {
      user = await Worker.findOne({ email });
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, rating: user.rating, wallet: user.wallet, skills: user.skills });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.skills = req.body.skills || user.skills;
    if (req.body.location) user.location.coordinates = req.body.location;

    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, skills: updated.skills });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
