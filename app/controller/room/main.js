const express = require("express");
const io = require(global.rootDir + "/index").io;
const datastore = require(global.rootDir + "/app/middleware/database");
const validator = require("validator");

const roomsDatabase = (exports.roomsDatabase = new datastore("roomsDatabase"));

const router = (exports.router = express.Router());

io.on("connection", async (socket) => {
  try {
    if (socket.request.session.user == null) return socket.disconnect(new Error("Not Signed in"));
    const check = await roomsDatabase.checkProperty({ id: socket.handshake.query.roomid });
    if (!check.found) return socket.disconnect(new Error("Invalid roomid"));

    const connectedRoom = check.doc;
    socket.join(connectedRoom.id);

    socket.on("SendMessage", (msg) => {
      try {
        // check if message is between 1 and 500 characters and doesn't have only spaces then it cleans xss
        if (!validator.isLength(msg, { min: 1, max: 500 }) || !/\S/.test(msg)) return;
        const user = socket.request.session.user;
        const messageData = { message: validator.escape(msg), timestamp: Date.now(), username: user.username, displayname: user.displayname, iconpath: user.iconpath };
        roomsDatabase.update({ id: connectedRoom.id }, { $push: { messages: messageData } });
        io.to(connectedRoom.id).emit("RecieveMessage", messageData);
      } catch (err) {
        console.error(err);
        socket.disconnect(new Error(err));
      }
    });

    socket.on("GetMore", async (fromWhereString, getCallback) => {
      try {
        const fromWhere = validator.toInt(fromWhereString);
        if (isNaN(fromWhere)) return;

        if (connectedRoom.messages.length < 16) {
          const check = await roomsDatabase.checkProperty({ id: socket.handshake.query.roomid });
          if (!check.found) return socket.disconnect(new Error("Invalid roomid"));
          connectedRoom = check.doc;
        }

        if (getCallback instanceof Function) {
          getCallback(connectedRoom.messages.slice(fromWhere - 15 >= 0 ? fromWhere - 15 : 0, fromWhere));
        }
      } catch (err) {
        console.error(err);
        socket.disconnect(new Error(err));
      }
    });
  } catch (err) {
    console.error(err);
    socket.disconnect(new Error(err));
  }
});

router.get("/room/:roomid", async (req, res) => {
  try {
    if (req.session.user == null) return res.redirect("/signup");
    const roomid = req.params.roomid;
    const room = await roomsDatabase.checkProperty({ id: roomid });
    if (room.found) {
      res.render("room", { room: room.doc });
    } else res.status(404).render("404");
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errors: "Failed getting from database" });
  }
});

async function createRoom(name, id) {
  const data = {
    name: name,
    id: id,
    messages: [],
  };

  await roomsDatabase.insert(data);
}

// checks if hub in room database then if not then add
(async () => {
  const check = await roomsDatabase.checkProperty({ id: "hub" });
  if (!check.found) await createRoom("Hub", "hub");
})().catch(console.error);
