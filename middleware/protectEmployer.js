const Employer = require('../models/Employer');
const verifyToken = require('./verifyToken');

const protectEmployer = async (req, res, next) => {
  try {
    const decoded = verifyToken(req);

    if (!decoded)
      return res.status(401).json({ message: 'Not authorized, no token' });

    const employer = await Employer.findById(decoded.id).select('-password');

    if (!employer)
      return res.status(401).json({ message: "Employer not found" });

    req.user = employer;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token failed' });
  }
};

module.exports = {protectEmployer};