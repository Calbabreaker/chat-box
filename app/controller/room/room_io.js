const io = require(global.rootDir + "/index").io;
const roomsDatabase = require("./room").roomsDatabase;
const messagesDatabases = require("./room").messagesDatabases;
const usersDatabase = require("../user/user").usersDatabase;
const { vald } = require(global.rootDir + "/app/middleware/validator");

io.on("connection", async (socket) => {
    try {
        if (socket.request.session.user == null) throw "Not signed in"; // checks if signin in
        // gets the room from the id of the socket connect param
        const check = await roomsDatabase.checkProperty({
            _id: socket.handshake.query.roomid,
        });
        if (!check.found) throw "Invalid roomid";

        const connectedRoom = check.doc;
        socket.join(connectedRoom._id);
        socket.on("SendMessage", async (msg) => {
            try {
                // check if message is between 1 and 1000 characters and doesn't have only spaces then it cleans xss
                msg = vald.stripLow(msg);
                // removes all the whitespace at the start and end of message
                msg = msg.replace(/(^( |&nbsp;|<br>)+)|(( |&nbsp;)+$)/g, "");
                if (!vald.isLength(msg, { min: 1, max: 1000 }) || !/\S/.test(msg))
                    throw "Invalid message";
                const user = socket.request.session.user;
                msg = vald.escape(msg);
                msg = vald.unescapeSpecialFormatting(msg);

                const messageData = {
                    message: msg,
                    timestamp: Date.now(),
                    userid: user._id,
                };
                // adds to the connected rooms message database
                await messagesDatabases[connectedRoom._id].insert(messageData);

                messageData.username = user.username;
                messageData.displayname = user.displayname;
                io.to(connectedRoom._id).emit("RecieveMessage", messageData);
            } catch (err) {
                console.log(err);
                socket.disconnect();
            }
        });

        socket.on("GetMore", async (fromWhereString, getCallback) => {
            try {
                // await vald.wait(2000);
                const fromWhere = vald.toInt(fromWhereString);
                if (isNaN(fromWhere)) throw "fromWhere not valid integer";

                const noOfMsgSend = 30;
                // return the last 15 messages sorted by the timestamp to function parameter
                let messages = (
                    await messagesDatabases[connectedRoom._id].getAll({
                        timestamp: 1,
                    })
                ).slice(fromWhere - noOfMsgSend >= 0 ? fromWhere - noOfMsgSend : 0, fromWhere);

                for (let i = 0; i < messages.length; i++) {
                    const user = (await usersDatabase.checkProperty({ _id: messages[i].userid }))
                        .doc;
                    messages[i].displayname = user?.displayname ?? "Deleted user";
                    messages[i].username = user?.username ?? "Deleted user";
                }

                getCallback(messages);
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
