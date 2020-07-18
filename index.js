const compression = require("compression");
const express = require("express");
require("dotenv").config();

const PORT = process.env.CUSTOM_PORT || process.env.PORT;

global.rootDir = __dirname;

if (process.env.PROXY_URL != null) global.PROXY_URL = process.env.PROXY_URL;
else global.PROXY_URL = "";

// INITIALISE EVERYTHING
const app = (module.exports.app = express());
const server = require("http").createServer(app);
const io = (module.exports.io = require("socket.io")(server));
const options = require("./app/options");
const usersController = require("./app/controller/user/main");
const roomController = require("./app/controller/room/main");

// EXPRESS MIDDLEWARES
app.set("view engine", "ejs");
app.use(express.json());
app.use(compression());
app.use(options.session);
app.use(options.fileupload);

// set up session with io
io.use((socket, next) => {
  options.session(socket.request, socket.request.res || {}, next);
});

app.use("/assets", express.static(__dirname + "/public/"));

// FOR SESSION WITH EJS
app.use((req, res, next) => {
  if (req.session == null) return next(new Error("Connection Invalid"));
  res.locals.PROXY_URL = global.PROXY_URL;

  res.locals.user = req.session.user;
  next();
});

// ROUTERS
app.use(usersController.router);
app.use(roomController.router);

// MAIN ENDPOINTS
app.get("/", (req, res) => res.render("home"));

// NOT FOUND
app.use((req, res) => {
  res.status(404);
  if (req.path.startsWith("/assets")) return res.send(`Asset not found. Go back to <a href='/${global.PROXY_URL}'>homepage</a>`);
  if (req.path.startsWith("/api")) return res.send("-1");
  res.render("404");
});

server.listen(PORT, () => console.log("Server running..."));
