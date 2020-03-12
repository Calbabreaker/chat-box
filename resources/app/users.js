const database = require(global.rootDir + "/database");

module.exports = async (request, response) => {
  const data = request.body;
  const typeOfRequest = request.params.type;
  const timestamp = Date.now();

  try {
    // when the user creates a new nickname
    if (typeOfRequest == "create") {
      if (!typeof data.nickname === "string") return response.status(400).send("ERROR: INVALID PROPERTY: NICKNAME NOT STRING");
      if (!data.nickname.replace(/\s/g, "").length) return response.status(400).send("ERROR: INVALID PROPERTY: NICKNAME ONLY SPACES");

      const result = await database.checkPropertyInDatabase(
        {
          nickname: data.nickname
        },
        database.usersDatabase
      );

      if (result.status == "Found") {
        return response.status(422).send("ERROR: NICKNAME TAKEN");
      } else {
        console.log("CREATED: " + data.nickname);
        const sessionId = await database.createUniqueSessionId();
        const userData = {
          nickname: data.nickname,
          sessionId: sessionId,
          created: timestamp
        };

        const count = await database.getDatabaseCount(database.messagesDatabase);
        const messageData = {
          type: "status",
          text: `${data.nickname} has joined the chat.`,
          timestamp: timestamp,
          count: count
        };

        database.messagesDatabase.insert(messageData);
        database.usersDatabase.insert(userData);
        return response.json(userData);
      }

      // when the user quits
    } else if (typeOfRequest == "quit") {
      if (!typeof data.sessionId === "string") return response.status(400).send("ERROR: INVALID SESSION ID ONLY STRING");
      if (!data.sessionId.replace(/\s/g, "").length) return response.status(400).send("ERROR: INVALID SESSION ID ONLY SPACES");

      const result = await database.checkPropertyInDatabase(
        {
          sessionId: data.sessionId
        },
        database.usersDatabase
      );

      const count = await database.getDatabaseCount(database.messagesDatabase);
      const messageData = {
        type: "status",
        text: `${result.doc.nickname} has left the chat.`,
        timestamp: timestamp,
        count: count
      };

      if (result.status == "Fail") {
        return response.status(401).send("ERROR: INVALID SESSION ID");
      } else {
        database.removeByPropertyInDatabase(
          {
            sessionId: data.sessionId
          },
          database.usersDatabase
        );

        database.messagesDatabase.insert(messageData);
        return response.json({ status: result.status });
      }
    } else {
      // prettier-ignore
      return response.status(404).sendFile(global.rootDir + "/static/404error.html");
    }
  } catch (err) {
    console.log(err);
    return response.status(400).send(err);
  }
};
