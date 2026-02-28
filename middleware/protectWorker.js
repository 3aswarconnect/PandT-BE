const Worker = require('../models/Worker');
const verifyToken = require('./verifyToken');

const protectWorker = async (req, res, next) => {
  try {
    const decoded = verifyToken(req);

    if (!decoded)
      return res.status(401).json({ message: 'Not authorized, no token' });

    if (decoded.role !== "worker")
      return res.status(403).json({ message: "Access denied. Workers only." });

    const worker = await Worker.findById(decoded.id).select('-password');

    if (!worker)
      return res.status(401).json({ message: "Worker not found" });

    req.user = worker;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token failed' });
  }
};

module.exports = {protectWorker};