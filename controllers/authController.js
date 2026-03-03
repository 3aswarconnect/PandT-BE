const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Employer = require('../models/Employer')
const Worker = require('../models/Worker');
const crypto = require("crypto");
const EmailOTP = require('../models/EmailOTP');
const ses = require("../config/ses");
const { SendEmailCommand } = require("@aws-sdk/client-ses");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.signup = async (req, res) => {
  const { email, password, role, skills } = req.body;
  console.log(req.body)

  const otpRecord = await EmailOTP.findOne({
  email,
  verified: true,
});

if (!otpRecord) {
  return res.status(400).json({
    message: "Please verify your email first",
  });
}
  if (role === 'employer') {
    try {

      const exists = await Employer.findOne({ email });
      if (exists) return res.status(400).json({ message: 'User already exists' });

      const user = await Employer.create({ email, password, role, skills: skills || [] });
      await EmailOTP.deleteMany({ email });
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
      await EmailOTP.deleteMany({ email });
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

exports.profileStatus = async (req, res) => {
  try {
    console.log("status checing")
    const user = await Employer.findById(req.user._id);

    res.json({
      profileCompleted: user.profileCompleted
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.completeProfile = async (req, res) => {
  try {
    const { name, phone, age, address, lat, lng } = req.body;

    if (!name || !phone || !age || !address) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (age < 18) {
      return res.status(400).json({ message: "Must be 18 or above" });
    }

    const user = await Employer.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = name;
    user.phone = phone;
    user.age = age;
    // user.photo = photo;

    user.location = {
      type: "Point",
      coordinates: [lng, lat],
      address: address
    };

    user.profileCompleted = true;

    await user.save();

    res.json({ message: "Profile completed successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove old OTP if exists
    await EmailOTP.deleteMany({ email });

    // Save new OTP
    await EmailOTP.create({
      email,
      otp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    });

    const command = new SendEmailCommand({
      Source: process.env.SES_VERIFIED_EMAIL,
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: { Data: "Your Verification OTP" },
        Body: {
          Html: {
            Data: `
              <h2>Email Verification</h2>
              <p>Your OTP is:</p>
              <h1>${otp}</h1>
              <p>This OTP expires in 5 minutes.</p>
            `,
          },
        },
      },
    });

    await ses.send(command);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
}

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await EmailOTP.findOne({ email });

    if (!record) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    record.verified = true;
    await record.save();

    res.json({ message: "Email verified successfully" });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
}
