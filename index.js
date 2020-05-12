const express = require("express");
const session = require("express-session");
const compression = require("compression");

const PORT = process.env.PORT || 5000;
global.rootDir = __dirname;

const options = require("./app/options");
const usersController = require("./app/controller/user");

const app = express();
app.set("view engine", "ejs");
app.use(express.json());
app.use(compression());
app.use(session(options.getSession(app)));

app.use("/assets", express.static(__dirname + "/public/"));

// FOR SESSION
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use(usersController.router);

app.get("/", (req, res) => res.render("home"));

// NOT FOUND
app.use((req, res) => {
  res.status(404).render("404");
});

app.listen(PORT, () => console.log("Server starting..."));
