const express = require("express");
const io = require(global.rootDir + "/index").io;
const datastore = require(global.rootDir + "/app/middleware/database");
const validator = require("validator");

const roomsDatabase = (exports.roomsDatabase = new datastore("databases/rooms"));
const messagesDatabases = (exports.messagesDatabases = {});

const router = (exports.router = express.Router());

io.on("connection", async (socket) => {
  try {
    if (socket.request.session.user == null) throw new Error("Not signed in"); // checks if signin in
    // gets the room from the id of the socket connect param
    const check = await roomsDatabase.checkProperty({ id: socket.handshake.query.roomid });
    if (!check.found) throw new Error("Invalid roomid");

    const connectedRoom = check.doc;
    socket.join(connectedRoom.id);
    socket.on("SendMessage", async (msg) => {
      try {
        // check if message is between 1 and 500 characters and doesn't have only spaces then it cleans xss
        if (!validator.isLength(msg, { min: 1, max: 500 }) || !/\S/.test(msg)) throw new Error("Invalid message");
        const user = socket.request.session.user;
        const messageData = { message: validator.escape(msg), timestamp: Date.now(), username: user.username, displayname: user.displayname, iconpath: user.iconpath };
        io.to(connectedRoom.id).emit("RecieveMessage", messageData);
        await messagesDatabases[connectedRoom.id].insert(messageData); // adds to the connect rooms message database
      } catch (err) {
        console.error(err);
        socket.disconnect();
      }
    });

    socket.on("GetMore", async (fromWhereString, getCallback) => {
      try {
        const fromWhere = validator.toInt(fromWhereString);
        if (isNaN(fromWhere)) throw new Error("fromWhere not valid integer");

        const messages = await messagesDatabases[connectedRoom.id].getAll();
        getCallback(messages.slice(fromWhere - 15 >= 0 ? fromWhere - 15 : 0, fromWhere));
      } catch (err) {
        console.error(err);
        socket.disconnect();
      }
    });
  } catch (err) {
    // disconnects the socket when theres error
    console.error(err);
    socket.disconnect();
  }
});

router.get("/room/:roomid", async (req, res) => {
  try {
    if (req.session.user == null) return res.redirect("/signup");
    const roomid = req.params.roomid;
    const room = await roomsDatabase.checkProperty({ id: roomid });
    if (room.found) {
      const messages = await messagesDatabases[roomid].getAll();
      res.render("room", { room: room.doc, messages: messages });
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
  };

  await roomsDatabase.insert(data);
  messagesDatabases[id] = new datastore("databases/messages/" + data.id);
}

async function addMessage(id, messageData) {
  await messagesDatabases[id].insert(messageData);
}

async function startSetup() {
  // checks if hub in room database then if not then add
  const check = await roomsDatabase.checkProperty({ id: "hub" });
  if (!check.found) await createRoom("Hub", "hub");

  // loads all the messages database from all the rooms
  const allRooms = await roomsDatabase.getAll();
  allRooms.forEach((room) => {
    messagesDatabases[room.id] = new datastore("databases/messages/" + room.id);
  });
}

startSetup().catch(console.error);
