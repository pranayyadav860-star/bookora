// server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      msg: 'No token, authorization denied' 
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    console.log('Decoded token:', JSON.stringify(decoded, null, 2));
    
    // IMPORTANT: Set user object with id property
    req.user = {
      id: decoded.id || decoded.userId || decoded._id,
      userId: decoded.id || decoded.userId || decoded._id,
      email: decoded.email,
      role: decoded.role || 'user'
    };
    
    console.log('User authenticated - ID:', req.user.id, 'Role:', req.user.role);
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ 
      success: false,
      msg: 'Token is not valid' 
    });
  }
};