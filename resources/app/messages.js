const database = require(global.rootDir + "/database");

module.exports = async (request, response) => {
  const data = request.params.session_id;

  try {
    const result = await database.checkPropertyInDatabase(
      {
        sessionId: data
      },
      database.usersDatabase
    );
    if (result.status === "Found") {
      database.messagesDatabase
        .find({})
        .sort({ timestamp: 1 })
        .exec((err, data) => {
          if (err) {
            return response.status(400).send(err);
          } else {
            return response.json(data);
          }
        });
    } else {
      return response.status(401).send("ERROR: INVALID SESSION ID");
    }
  } catch (err) {
    console.log(err);
    return response.status(400).send(err);
  }
};
