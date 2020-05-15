const express = require("express");
const io = require(global.rootDir + "/index").io;
const datastore = require(global.rootDir + "/app/middleware/database");

const roomsDatabase = (exports.roomsDatabase = new datastore("roomsDatabase"));

const router = (exports.router = express.Router());

io.on("connection", (socket) => {
  if (socket.request.session.user == null) return socket.disconnect();
  socket.on("SendMessage", (msg) => {
    const user = socket.request.session.user;
    const messageData = { message: msg, timestamp: Date.now(), username: user.username, displayname: user.displayname, iconpath: user.iconpath };
    io.emit("RecieveMessage", messageData);
  });
});

router.get("/room/hub", (req, res) => {
  if (req.session.user == null) return res.redirect("/signup");
  res.render("room");
});
