const express = require("express");
const Datastore = require(global.rootDir + "/app/middleware/database");

const roomsDatabase = (exports.roomsDatabase = new Datastore("databases/rooms"));
const messagesDatabases = (exports.messagesDatabases = {});

require("./io")(); // do all the io setup (diffrent folder for cleaniless)

const router = (exports.router = express.Router());

router.get("/room/:roomid", async (req, res) => {
  try {
    if (req.session.user == null) return res.redirect("/signup");
    const roomid = req.params.roomid;
    const room = await roomsDatabase.checkProperty({ id: roomid });
    if (room.found) {
      const messages = await messagesDatabases[roomid].getAll({ timestamp: 1 });
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
  messagesDatabases[id] = new Datastore("databases/messages/" + data.id);
}

async function startSetup() {
  // checks if hub in room database then if not then add
  const check = await roomsDatabase.checkProperty({ id: "hub" });
  if (!check.found) await createRoom("Hub", "hub");

  // loads all the messages database from all the rooms
  const allRooms = await roomsDatabase.getAll();
  allRooms.forEach((room) => {
    messagesDatabases[room.id] = new Datastore("databases/messages/" + room.id);
  });
}

startSetup().catch(console.error);
