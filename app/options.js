const random = require("crypto").randomBytes;
const session = require("express-session");
const redis = require("redis");

const app = require(global.rootDir + "/index").app;
const redisClient = redis.createClient();
const RedisStore = require("connect-redis")(session);

const isProduction = process.env.NODE_ENV === "production";

// uses redis store to store the session data
const sessionOption = {
  secret: random(32).toString("base64"),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 * 2, // 2 weeks
    sameSite: true,
    httpOnly: true,
    secure: isProduction,
  },
  name: "chatbox.sid",
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ host: "localhost", port: 6379, client: redisClient, ttl: 86400 }),
};

// trust proxy if production
if (isProduction) {
  app.set("trust proxy", 1);
}

exports.session = session(sessionOption);
