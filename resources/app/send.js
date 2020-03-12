const database = require(global.rootDir + "/database");

let count = 0;

module.exports = async (request, response) => {
  const data = request.body;
  const timestamp = Date.now();

  if (!typeof data.text === "string") return response.status(400).send("ERROR: INVALID PROPERTY: TEXT NOT STRING");
  if (!data.text.replace(/\s/g, "").length) return response.status(400).send("ERROR: INVALID PROPERTY: TEXT ONLY SPACES");

  try {
    const result = await database.checkPropertyInDatabase(
      {
        sessionId: data.sessionId
      },
      database.usersDatabase
    );

    if (result.status == "NotFound") return response.status(401).send("ERROR: INVALID SESSION ID");

    const doc = result.doc;
    const count = await database.getDatabaseCount(database.messagesDatabase);
    const dataToInsert = {
      type: "message",
      nickname: doc.nickname, //find username with session id then insert to database
      text: data.text,
      timestamp: timestamp,
      count: count
    };

    database.messagesDatabase.insert(dataToInsert);
    return response.json(dataToInsert);
  } catch (err) {
    console.log(err);
    return response.status(400).send(err);
  }
};
