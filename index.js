const compression = require("compression");
const express = require("express");

const PORT = process.env.PORT || 5000;
global.rootDir = __dirname;

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

// some set up stuff with io and express
io.use((socket, next) => {
  options.session(socket.request, socket.request.res || {}, next);
});

app.use("/assets", express.static(__dirname + "/public/"));

// FOR SESSION
app.use((req, res, next) => {
  if (req.session == null) return next(new Error("Connection Invalid"));
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
  if (req.path.startsWith("/assets")) return res.send("Asset not found. Go back to <a href='/'>homepage</a>");
  if (req.path.startsWith("/api")) return res.send("-1");
  res.render("404");
});

server.listen(PORT, () => console.log("Server running..."));
