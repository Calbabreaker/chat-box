const { body: check, validationResult } = require("express-validator");
const datastore = require(global.rootDir + "/app/middleware/database");
const argon2 = require("argon2");
const express = require("express");

const usersDatabase = new datastore("usersDatabase");
exports.usersDatabase = usersDatabase;
const router = (module.exports.router = express.Router());

// GET REQUESTS / VIEWS
router.get("/signin", (req, res) => res.render("user/signin"));
router.get("/signup", (req, res) => res.render("user/signup"));

router.get("signout", async (req, res) => {
  if (req.session.user != null) req.session.destroy();
  res.redirect("/");
});

router.get("user/:username", async (req, res) => {
  req.ess;
});

// POST REQUESTS
// signup creates user with hased password and all the stuff
router.post("/signup", async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const data = req.body;

    const user = {
      displayname: data.displayname,
      username: data.username,
      password: await argon2.hash(data.password, { type: argon2.argon2d }),
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
router.post("/signin", async (req, res) => {
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

// down here contains all the validation with express-validator
// it kind of looks messy but i dont know how to do it differently
const validate = {};
validate.signup = () => {
  return [
    check("displayname").isLength({ min: 3, max: 32 }).withMessage("Must be between 3 and 32 characters"),
    check("username")
      .customSanitizer(toLowerCase)
      .trim()
      .isLength({ min: 3, max: 32 })
      .withMessage("Must be between 3 and 32 characters")
      .isAlphanumeric()
      .withMessage("Must contain valid alpha numeric character")
      .custom(async (value) => {
        const check = await usersDatabase.checkProperty({ username: value });
        if (check.found) throw new Error("Username Already taken");
        else true;
      }),

    check("password").isLength({ min: 8, max: 250 }).withMessage("Must be between 8 and 250 characters"),

    check("confirmPassword").custom(async (value, { req }) => {
      if (value !== req.body.password) throw new Error("Password confirmation does not match password");
      else true;
    }),
  ];
};

validate.signin = () => {
  return [
    check("username")
      .customSanitizer(toLowerCase)
      .custom(async (value) => {
        const check = await usersDatabase.checkProperty({ username: value });
        if (!check.found) throw new Error("Username not found");
        else true;
      }),

    check("password").custom(async (value, { req }) => {
      const check = await usersDatabase.checkProperty({ username: req.body.username });
      if (!check.found) throw new Error("Invalid username");
      if (!argon2.verify(check.doc.password, value)) throw new Error("Wrong password");
      else true;
    }),
  ];
};

toLowerCase = (value) => value.toLowerCase();
