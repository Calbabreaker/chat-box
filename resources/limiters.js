const rateLimit = require("express-rate-limit");

module.exports.sendLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20
});

module.exports.userCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10
});

module.exports.messagesLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000
});
