const { validationResult } = require("express-validator");
const argon2 = require("argon2");
const express = require("express");
const sharp = require("sharp");
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

router.get("/settings", (req, res) => {
  if (req.session.user == null) return res.redirect(global.PROXY_URL + "/signup");
  res.render("user/settings");
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
    console.log(err);
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
    console.log(err);
    return res.status(400).json({ errors: "Failed getting from database" });
  }
});

router.put("/upload/usericon", (req, res) => {
  try {
    if (!req.files || req.files.usericon == null) {
      throw new Error("No files were uploaded");
    }

    console.log(req.files.usericon);

    const icon = req.files.usericon;
    if (icon.mimetype != "image/png" && icon.mimetype != "image/gif") {
      throw new Error("Unsupported image type.");
    }

    const filePath = `${global.rootDir}/public/usercontent/usericons/${req.session.user.username}.jpg`;

    sharp(icon.data)
      .resize(250, 250)
      .toFile(filePath, (err) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ errors: "Error with sharp" });
        }

        res.send("OK");
      });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errors: err });
  }
});
