const random = require("crypto").randomBytes;
const session = require("express-session");

exports.session = session({
  secret: random(32).toString("base64"),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 * 4, // 4 weeks
  },
  name: "chatbox.sid",
  saveUninitialized: true,
  resave: false,
});
