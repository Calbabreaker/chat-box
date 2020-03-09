const uuid = require("uuid");

let usersDatabase;

module.exports.checkUsersExpire = () => {
  const currentTimestamp = Date.now();
  console.log("Check and deleting...");
  //remove users that are more than 10 days old
  usersDatabase.remove(
    { created: { $lt: currentTimestamp - 10 * 24 * 60 * 60 * 1000 } },
    { multi: true },
    (err, doc) => {
      if (err) {
        return response.status(400).send(err);
      }
    }
  );
};

module.exports.createUniqueSessionId = () => {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 100; i++) {
      const sessionId = uuid.v4();
      const result = await module.exports
        .checkPropertyInDatabase(
          {
            sessionId: sessionId
          },
          usersDatabase
        )
        .catch(reject);

      if (result.status == "NotFound") {
        return resolve(sessionId);
      }
    }

    reject("ERROR: FAILED TO GENERATE SESSION ID AFTER 100 TRIES");
  });
};

module.exports.checkPropertyInDatabase = (property, database) => {
  return new Promise((resolve, reject) => {
    database.findOne(property, (err, doc) => {
      if (err) {
        reject(err);
      } else if (doc != null) {
        resolve({ status: "Found", doc: doc });
      } else {
        resolve({ status: "NotFound", doc: doc });
      }
    });
  });
};

module.exports.removeByPropertyInDatabase = (property, database) => {
  return new Promise((resolve, reject) => {
    database.remove(property, { multi: true }, (err, doc) => {
      if (err) {
        reject(err);
      } else if (doc != null) {
        resolve({ status: "Sucess" });
      } else {
        resolve({ status: "Fail" });
      }
    });
  });
};

module.exports.nonExpressSetup = usersDatabaseRef => {
  usersDatabase = usersDatabaseRef;
  module.exports.checkUsersExpire();
  setInterval(module.exports.checkUsersExpire, 60 * 60 * 1000);
};
