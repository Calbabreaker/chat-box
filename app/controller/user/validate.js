const { body: check } = require("express-validator");
const argon2 = require("argon2");
const usersDatabase = require("./main").usersDatabase;

// in here contains all the validation with express-validator
// it kind of looks messy but i dont know how to do it differently
exports.signup = () => {
  return [
    check("displayname").isLength({ min: 3, max: 32 }).withMessage("Must be between 3 and 32 characters"),
    check("username")
      .customSanitizer(toLowerCase)
      .trim()
      .isLength({ min: 3, max: 32 })
      .withMessage("Must be between 3 and 32 characters")
      .isAlphanumeric()
      .withMessage("Must contain valid alpha numeric characters")
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

exports.signin = () => {
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
      if (!(await argon2.verify(check.doc.password, value))) throw new Error("Wrong password");
      else true;
    }),
  ];
};

toLowerCase = (value) => value.toLowerCase();
