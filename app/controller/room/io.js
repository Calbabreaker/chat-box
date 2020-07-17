const io = require(global.rootDir + "/index").io;
const roomsDatabase = require("./main").roomsDatabase;
const messagesDatabases = require("./main").messagesDatabases;
const { vald } = require(global.rootDir + "/app/middleware/validator");

io.on("connection", async (socket) => {
  try {
    if (socket.request.session.user == null) throw "Not signed in"; // checks if signin in
    // gets the room from the id of the socket connect param
    const check = await roomsDatabase.checkProperty({ _id: socket.handshake.query.roomid });
    if (!check.found) throw "Invalid roomid";

    const connectedRoom = check.doc;
    socket.join(connectedRoom._id);
    socket.on("SendMessage", async (msg) => {
      try {
        // check if message is between 1 and 1000 characters and doesn't have only spaces then it cleans xss
        msg = vald.stripLow(msg);
        if (!vald.isLength(msg, { min: 1, max: 1000 }) || !/\S/.test(msg)) throw "Invalid message";
        const user = socket.request.session.user;
        msg = vald.escape(msg);

        const messageData = { message: msg, timestamp: Date.now(), username: user.username, displayname: user.displayname, userid: user._id };
        await messagesDatabases[connectedRoom._id].insert(messageData); // adds to the connect rooms message database
        io.to(connectedRoom._id).emit("RecieveMessage", messageData);
      } catch (err) {
        console.log(err);
        socket.disconnect();
      }
    });

    socket.on("GetMore", async (fromWhereString, getCallback) => {
      try {
        await vald.wait(2000);
        const fromWhere = vald.toInt(fromWhereString);
        if (isNaN(fromWhere)) throw "fromWhere not valid integer";

        // return the last 15 messages sorted by the timestamp to function parameter
        const messages = await messagesDatabases[connectedRoom._id].getAll({ timestamp: 1 });
        getCallback(messages.slice(fromWhere - 15 >= 0 ? fromWhere - 15 : 0, fromWhere));
      } catch (err) {
        console.log(err);
        socket.disconnect();
      }
    });
  } catch (err) {
    // disconnects the socket when theres error which also does when "throw"
    console.log(err);
    socket.disconnect();
  }
});
