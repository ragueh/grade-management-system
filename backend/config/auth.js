const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRATION || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Bcrypt configuration
const bcryptConfig = {
  rounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
};

// Security configuration
const securityConfig = {
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  lockTime: process.env.LOCK_TIME || '15m', // 15 minutes
  sessionTimeout: process.env.SESSION_TIMEOUT || '24h',
};

module.exports = {
  jwtConfig,
  generateToken,
  generateRefreshToken,
  verifyToken,
  bcryptConfig,
  securityConfig,
};
