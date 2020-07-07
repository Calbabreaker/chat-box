const { vald, validateChain } = require(global.rootDir + "/app/middleware/validator");
const Datastore = require(global.rootDir + "/app/middleware/database");
const argon2 = require("argon2");
const express = require("express");
const sharp = require("sharp");
const fs = require("fs-extra");

const usersDatabase = (exports.usersDatabase = new Datastore("databases/users"));
const router = (exports.router = express.Router());

// GET REQUESTS / VIEWS
router.get("/signin", (req, res) => res.render("user/signin"));
router.get("/signup", (req, res) => res.render("user/signup"));

router.get("/signout", async (req, res) => {
  if (req.session.user != null) req.session.destroy();
  res.redirect(global.PROXY_URL + "/");
});

router.get("/settings", (req, res) => {
  if (req.session.user == null) return res.redirect(global.PROXY_URL + "/signup");
  res.render("user/settings");
});

// POST REQUESTS
// signup creates user with hased password and all the stuff
router.post("/signup", async (req, res) => {
  try {
    const data = req.body;
    data.username = vald.toLowerCase(data.username);
    const check = await usersDatabase.checkProperty({ username: data.username });

    const result = await validateChain(data)
      .check("username")
      .sanitize(vald.stripLow)
      .validate((v) => vald.isLength(v, { min: 1 }), "Empty field")
      .validate((v) => vald.isLength(v, { max: 40 }), "Must be less than 40 characters")
      .validate(vald.isAlphanumeric, "Must contain valid alpha numeric characters")
      .validate(() => !check.found, "Username already taken")

      .check("displayname")
      .sanitize(vald.stripLow)
      .validate((v) => vald.isLength(v, { min: 1 }), "Empty field")
      .validate((v) => vald.isLength(v, { max: 60 }), "Must be less than 60 characters")
      .sanitize(vald.escape)

      .check("password")
      .validate((v) => vald.isLength(v, { min: 8 }), "Must be greater than 8 characters")
      .validate((v) => vald.isLength(v, { max: 500 }), "Must be less than 500 characters")

      .check("confirmPassword")
      .validate((v) => v === data.password, "Password confirmation does not match password")

      .pack();

    const errors = result.getErrors();
    if (errors.length > 0) return res.status(422).json({ errors, success: false });

    const user = {
      displayname: data.displayname,
      username: data.username,
      password: await argon2.hash(data.password, { type: argon2.argon2d }),
    };

    const userDoc = await usersDatabase.insert(user);
    const fileDir = `${global.rootDir}/public/usercontent`;
    await fs.copy(`${fileDir}/default/`, `${fileDir}/${userDoc._id}/`);

    req.session.user = userDoc;
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errors: "Unknown error", success: false });
  }
});

// signin checks password hash with hash in database (uses argon2)
router.post("/signin", async (req, res) => {
  try {
    const data = req.body;
    data.username = vald.toLowerCase(data.username);
    const check = await usersDatabase.checkProperty({ username: data.username });

    const result = await validateChain(data)
      .check("username")
      .validate(() => check.found, "Username not found")

      .check("password")
      .validate(() => check.found, "Invalid username")
      .validate(async (v) => {
        return await argon2.verify(check.doc.password, v);
      }, "Wrong password")

      .pack();

    const errors = result.getErrors();
    if (errors.length > 0) return res.status(422).json({ errors, success: false });

    const user = check.doc;
    req.session.user = user;
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errors: "Unknown error", success: false });
  }
});

router.put("/upload/usericon", async (req, res) => {
  try {
    if (req.files == null) req.files = {};
    const result = await validateChain(req.files)
      .check("usericon")
      .validate((v) => v != null, "No files were uploaded")
      .validate((v) => v.mimetype == "image/png" || v.mimetype == "image/gif" || v.mimetype == "image/jpg" || v.mimetype == "image/jpeg", "Invalid image type")

      .pack();

    const errors = result.getErrors();
    if (errors.length > 0) return res.status(422).json({ errors, success: false });

    const photoDir = `${global.rootDir}/public/usercontent/${req.session.user._id}/photo.png`;
    await sharp(req.files.usericon.data).resize({ width: 250, height: 250 }).png({ quality: 80 }).toFile(photoDir);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ errors: "Unknown error", success: false });
  }
});
