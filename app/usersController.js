const { body: check, validationResult } = require("express-validator");
const datastore = require(global.rootDir + "/app/database");
const argon2 = require("argon2");

const usersDatabase = new datastore("usersDatabase");
exports.usersDatabase = usersDatabase;

exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const data = req.body;

    const user = {
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
};

exports.signin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const data = req.body;
    const user = (await usersDatabase.checkProperty({ username: data.username })).doc;
    req.session.user = user;
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errors: "Failed getting from database" });
  }
};

exports.signout = async (req, res) => {
  if (req.session.user != null) req.session.destroy();
  res.redirect("/");
};

// looks messy but it is not
exports.validate = (method) => {
  switch (method) {
    case "signup":
      return [
        check("username")
          .isLength({ min: 3, max: 24 })
          .withMessage("Must be between 3 and 24 characters")
          .custom(async (value) => {
            const check = await usersDatabase.checkProperty({ username: value });
            if (check.status === "Found") {
              throw new Error("Username already taken");
            } else true;
          })
          .trim()
          .escape(),

        check("password").isLength({ min: 8, max: 250 }).withMessage("Must be between 8 and 250 characters"),

        check("confirmPassword").custom(async (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error("Password confirmation does not match password");
          } else true;
        }),
      ];

    case "signin":
      return [
        check("username").custom(async (value) => {
          const check = await usersDatabase.checkProperty({ username: value });
          if (check.status === "NotFound") {
            throw new Error("Name not found");
          } else true;
        }),

        check("password").custom(async (value, { req }) => {
          const check = await usersDatabase.checkProperty({ username: req.body.username });
          if (check.status === "NotFound") throw new Error("Invalid name");
          if (!argon2.verify(check.doc.password, value)) {
            throw new Error("Wrong password");
          } else true;
        }),
      ];
  }
};
