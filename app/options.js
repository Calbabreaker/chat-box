const random = require("crypto").randomBytes;

exports.getSession = (app) => {
  const options = {
    secret: random(32).toString("base64"),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7 * 4, // 4 weeks
    },
    name: "chatbox.sid",
    saveUninitialized: true,
    resave: false,
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    options.cookie.secure = true;
  }

  return options;
};
