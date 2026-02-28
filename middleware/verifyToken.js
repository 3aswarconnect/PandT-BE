const jwt = require('jsonwebtoken');

const verifyToken = (req) => {
  if (!req.headers.authorization?.startsWith('Bearer')) {
    return null;
  }

  const token = req.headers.authorization.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = verifyToken;