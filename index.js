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
    const result = await checkPropertyInUsers({
      sessionId: data
    }).catch(err => response.status(400).send(err));
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
  }
});

app.get("/app/check_session_id/:session_id", async (request, response) => {
  const data = request.params.session_id;
  if (typeof data === "string") {
    const result = await checkPropertyInUsers({
      sessionId: data
    }).catch(err => response.status(400).send(err));

    return response.json({
      data: data,
      valid: result.status === "Found" ? true : false
    });
  }

  return response.status(400).send("ERROR: INVALID PROPERTY: SESSION ID");
});

app.post("/app/send", async (request, response) => {
  const data = request.body;
  const timestamp = Date.now();
  if (typeof data.text === "string") {
    const result = await checkPropertyInUsers({
      sessionId: data.sessionId
    }).catch(err => response.status(400).send(err));

    if (result.status == "NotFound") {
      return response.status(401).send("ERROR: INVALID SESSION ID");
    }

    console.log(result);
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
  }

  return response.status(400).send("ERROR: INVALID PROPERTY: TEXT");
});

app.post("/app/users", async (request, response) => {
  const data = request.body;
  const timestamp = Date.now();
  if (typeof data.nickname === "string") {
    console.log(data.nickname);
    const result = await checkPropertyInUsers({
      nickname: data.nickname
    }).catch(err => response.status(400).send(err));

    if (result.status == "Found") {
      return response.status(422).send("ERROR: NICKNAME TAKEN");
    } else {
      const userData = {
        nickname: data.nickname,
        sessionId: uuid.v4(),
        created: timestamp
      };

      if (userData.nickname.replace(/\s/g, "").length) {
        usersDatabase.insert(userData);
        return response.json(userData);
      }
    }
  }

  return response.status(400).send("ERROR: INVALID PROPERTY: NICKNAME");
});

app.use((request, response, next) => {
  response.status(404).sendFile(__dirname + "/public/static/404error.html");
  console.log(request.url);
});

function checkPropertyInUsers(property) {
  return new Promise((resolve, reject) => {
    usersDatabase.findOne(property, (err, doc) => {
      if (err) {
        reject(err);
        console.log(err);
      } else if (doc != null) {
        resolve({ status: "Found", doc: doc });
      } else {
        resolve({ status: "NotFound", doc: doc });
      }
    });
  });
}
