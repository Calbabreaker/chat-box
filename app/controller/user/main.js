const { validationResult } = require("express-validator");
const argon2 = require("argon2");
const express = require("express");
const Datastore = require(global.rootDir + "/app/middleware/database");

const usersDatabase = (exports.usersDatabase = new Datastore("databases/users"));
const router = (exports.router = express.Router());

const validate = require("./validate");

// GET REQUESTS / VIEWS
router.get("/signin", (req, res) => res.render("user/signin"));
router.get("/signup", (req, res) => res.render("user/signup"));

router.get("/signout", async (req, res) => {
  if (req.session.user != null) req.session.destroy();
  res.redirect("/");
});

// POST REQUESTS
// signup creates user with hased password and all the stuff
router.post("/signup", validate.signup(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const data = req.body;
    const user = {
      displayname: data.displayname,
      username: data.username,
      password: await argon2.hash(data.password, { type: argon2.argon2d }),
      iconpath: "default.webp",
    };

    await usersDatabase.insert(user);
    req.session.user = user;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errors: "Failed inserting into database." });
  }
});

// signin checks password hash with hash in database (uses argon2)
router.post("/signin", validate.signin(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const data = req.body;
    const user = (await usersDatabase.checkProperty({ username: data.username })).doc;
    req.session.user = user;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errors: "Failed getting from database" });
  }
});
