const database = require(global.rootDir + "/database");

module.exports = async (request, response) => {
  const data = request.params.session_id;

  try {
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
  } catch (err) {
    console.log(err);
    return response.status(400).send(err);
  }
};
