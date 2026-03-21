const rateLimit = require('express-rate-limit');

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

// Chat rate limiter
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.CHAT_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Slow down.' },
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
});

module.exports = { authLimiter, chatLimiter };
