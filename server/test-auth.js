// server/test-jwt.js
// Run with: node test-jwt.js

const jwt = require('jsonwebtoken');

// Use the exact secret from your .env
const JWT_SECRET = 'bookora_super_secret_key';

console.log('Testing JWT with secret:', JWT_SECRET);

// Create a test token
const testToken = jwt.sign(
  { 
    id: 'test123', 
    role: 'admin', 
    email: 'test@example.com' 
  },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('Generated Token:', testToken);
console.log('Token length:', testToken.length);

// Verify the token
try {
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('✅ Token verified successfully!');
  console.log('Decoded:', decoded);
} catch (error) {
  console.error('❌ Verification failed:', error.message);
}