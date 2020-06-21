const io = require(global.rootDir + "/index").io;
const roomsDatabase = require("./main").roomsDatabase;
const messagesDatabases = require("./main").messagesDatabases;
const validator = require("validator");

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
        msg = validator.stripLow(msg);
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

        const messages = await messagesDatabases[connectedRoom.id].getAll({ timestamp: 1 });
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
