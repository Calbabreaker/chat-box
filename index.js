const express = require("express");
const datastore = require("nedb");
const rateLimit = require("express-rate-limit");
const uuid = require("uuid");

const app = express();
const messagesDatabase = new datastore("messages.dat");
const usersDatabase = new datastore("users.dat");
messagesDatabase.loadDatabase();
usersDatabase.loadDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("Server Running..."));
app.use(express.static("public"));
app.use("/static", express.static("public/static"));
app.use(express.json({ limit: "1kb" }));

const sendLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20
});

const userCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5
});

const messagesLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000
});

app.use("/app/send", sendLimiter);
app.use("/app/users", userCreateLimiter);
app.use("/app/messages", messagesLimiter);

app.get("/app/messages/:session_id", async (request, response) => {
  const data = request.params.session_id;

  if (typeof data === "string") {
    try {
      const result = await checkPropertyInUsers({
        sessionId: data
      });
      if (result.status === "Found") {
        messagesDatabase
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
  }
});

app.get("/app/check_session_id/:session_id", async (request, response) => {
  const data = request.params.session_id;
  if (typeof data === "string") {
    try {
      const result = await checkPropertyInUsers({
        sessionId: data
      });

      return response.json({
        dataSent: data,
        valid: result.status === "Found" ? true : false,
        userData: result.doc
      });
    } catch (err) {
      console.log(err);
      return response.status(400).send(err);
    }
  }

  return response.status(400).send("ERROR: INVALID PROPERTY: SESSION ID");
});

app.post("/app/send", async (request, response) => {
  const data = request.body;
  const timestamp = Date.now();
  if (typeof data.text === "string") {
    try {
      const result = await checkPropertyInUsers({
        sessionId: data.sessionId
      });

      if (result.status == "NotFound") {
        return response.status(401).send("ERROR: INVALID SESSION ID");
      }

      const doc = result.doc;
      const dataToInsert = {
        nickname: doc.nickname, //find username with session id then insert to database
        text: data.text,
        timestamp: timestamp
      };

      if (dataToInsert.text.replace(/\s/g, "").length) {
        messagesDatabase.insert(dataToInsert);
        return response.json(dataToInsert);
      }
    } catch (err) {
      console.log(err);
      return response.status(400).send(err);
    }
  }

  return response.status(400).send("ERROR: INVALID PROPERTY: TEXT");
});

app.post("/app/user/:type", async (request, response) => {
  const data = request.body;
  const typeOfRequest = request.params.type;
  const timestamp = Date.now();
  try {
    // when the user creates a new nickname
    if (typeOfRequest == "create") {
      if (typeof data.nickname === "string") {
        console.log(data.nickname);
        const result = await checkPropertyInUsers({
          nickname: data.nickname
        });

        if (result.status == "Found") {
          return response.status(422).send("ERROR: NICKNAME TAKEN");
        } else {
          const sessionId = await createUniqueSessionId();
          const userData = {
            nickname: data.nickname,
            sessionId: sessionId,
            created: timestamp
          };

          if (userData.nickname.replace(/\s/g, "").length) {
            usersDatabase.insert(userData);
            return response.json(userData);
          }
        }
      }

      // when the user quits
    } else if (typeOfRequest == "quit") {
      const result = await removeByPropertyInUsers({
        sessionId: data.sessionId
      });

      if (result.status == "Fail") {
        return response.status(422).send("ERROR: INVALID SESSION ID");
      } else {
        return response.json({ status: status });
      }
    } else {
      // prettier-ignore
      return response.status(404).sendFile(__dirname + "/public/static/404error.html");
    }
  } catch (err) {
    console.log(err);
    return response.status(400).send(err);
  }

  return response.status(400).send("ERROR: INVALID PROPERTY: NICKNAME");
});

app.use((request, response, next) => {
  response.status(404).sendFile(__dirname + "/public/static/404error.html");
  console.log(request.url);
});

function checkUsersExpire() {
  const currentTimestamp = Date.now();
  //remove users that are more than 10 days old
  usersDatabase.remove(
    { created: { $gt: currentTimestamp + 10 * 24 * 60 * 60 * 1000 } },
    (err, doc) => {
      if (err) {
        return response.status(400).send(err);
      }
    }
  );
}

function createUniqueSessionId() {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 100; i++) {
      const sessionId = uuid.v4();
      const result = await checkPropertyInUsers({
        sessionId: sessionId
      }).catch(reject);

      if (result.status == "NotFound") {
        return resolve(sessionId);
      }
    }

    reject("ERROR: FAILED TO GENERATE SESSION ID AFTER 100 TRIES");
  });
}

function checkPropertyInUsers(property) {
  return new Promise((resolve, reject) => {
    usersDatabase.findOne(property, (err, doc) => {
      if (err) {
        reject(err);
      } else if (doc != null) {
        resolve({ status: "Found", doc: doc });
      } else {
        resolve({ status: "NotFound", doc: doc });
      }
    });
  });
}

function removeByPropertyInUsers(property) {
  return new Promise((resolve, reject) => {
    usersDatabase.remove(property, (err, doc) => {
      if (err) {
        reject(err);
      } else if (doc != null) {
        resolve({ status: "Sucess" });
      } else {
        resolve({ status: "Fail" });
      }
    });
  });
}

checkUsersExpire();
setInterval(checkUsersExpire, 60 * 60 * 1000);
