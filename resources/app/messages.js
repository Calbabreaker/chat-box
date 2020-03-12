const database = require(global.rootDir + "/database");

module.exports = async (request, response) => {
  const fromIndex = request.params.fromIndex;
  const params = fromIndex.split("-");

  try {
    database.messagesDatabase
      .find({})
      .sort({ timestamp: 1 })
      .exec((err, data) => {
        if (err) {
          return response.status(400).send(err);
        } else {
          if (stringIsNum(params[0]) && params[1] === ">") {
            data = data.slice(parseInt(params[0]));
          } else if (stringIsNum(params[0]) && params[1] === "<") {
            data = data.slice(parseInt(params[0]) - 10, parseInt(params[0])).reverse();
          } else {
            data = data.slice(data.length - 10);
          }

          return response.json(data);
        }
      });
  } catch (err) {
    console.log(err);
    return response.status(400).send(err);
  }
};

function stringIsNum(string) {
  return /^\d+$/.test(string);
}
