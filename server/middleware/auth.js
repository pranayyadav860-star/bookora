// server/middleware/auth.js
// FIXED: No fallback secret, proper error messages

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // FIXED: No fallback secret — if JWT_SECRET is missing, startup should fail (see server.js)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired, please login again' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based middleware factories
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireOwner = (req, res, next) => {
  if (req.user?.role !== 'owner' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
};

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireOwner = requireOwner;
