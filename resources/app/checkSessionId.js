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

    return response.json({
      dataSent: data,
      valid: result.status === "Found" ? true : false,
      userData: result.doc
    });
  } catch (err) {
    console.log(err);
    return response.status(400).send(err);
  }
};
