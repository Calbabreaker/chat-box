const express = require("express");
const Datastore = require(global.rootDir + "/app/middleware/database");

const roomsDatabase = (exports.roomsDatabase = new Datastore("databases/rooms"));
const messagesDatabases = (exports.messagesDatabases = {});

require("./io"); // do all the io setup (diffrent folder for cleaniless)

const router = (exports.router = express.Router());

router.get("/room/:roomid", async (req, res) => {
  try {
    if (req.session.user == null) return res.redirect("/signup");
    const roomid = req.params.roomid;
    const room = await roomsDatabase.checkProperty({ _id: roomid });
    if (room.found) {
      const count = await messagesDatabases[roomid].getCount();
      res.render("room", { room: room.doc, messagesCount: count });
    } else res.status(404).render("404");
  } catch (err) {
    console.error(err);
    return res.status(400).json({ errors: "Failed getting from database" });
  }
});

async function createRoom(name, id) {
  const data = {
    name: name,
    _id: id,
  };

  await roomsDatabase.insert(data);
  messagesDatabases[id] = new Datastore("databases/messages/" + id);
}

async function startSetup() {
  // checks if hub in room database then if not then add
  const check = await roomsDatabase.checkProperty({ _id: "hub" });
  if (!check.found) await createRoom("Hub", "hub");

  // loads all the messages database from all the rooms
  const allRooms = await roomsDatabase.getAll();
  allRooms.forEach((room) => {
    messagesDatabases[room._id] = new Datastore("databases/messages/" + room._id);
  });
}

startSetup().catch(console.error);
