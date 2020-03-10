const express = require("express");
const datastore = require("nedb");
const rateLimit = require("express-rate-limit");
const functions = require("./functions");

const app = express();
const messagesDatabase = new datastore("messages.dat");
const usersDatabase = new datastore("users.dat");
messagesDatabase.loadDatabase();
usersDatabase.loadDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log("Server Running..."));
app.use(express.static("public"));
app.use("/static", express.static("static"));
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
      const result = await functions.checkPropertyInDatabase(
        {
          sessionId: data
        },
        usersDatabase
      );
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
      const result = await functions.checkPropertyInDatabase(
        {
          sessionId: data
        },
        usersDatabase
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
  }

  return response.status(400).send("ERROR: INVALID PROPERTY: SESSION ID");
});

app.post("/app/send", async (request, response) => {
  const data = request.body;
  const timestamp = Date.now();
  if (typeof data.text === "string") {
    try {
      const result = await functions.checkPropertyInDatabase(
        {
          sessionId: data.sessionId
        },
        usersDatabase
      );

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
        const result = await functions.checkPropertyInDatabase(
          {
            nickname: data.nickname
          },
          usersDatabase
        );

        if (result.status == "Found") {
          return response.status(422).send("ERROR: NICKNAME TAKEN");
        } else {
          const sessionId = await functions.createUniqueSessionId();
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
      const result = await functions.removeByPropertyInDatabase(
        {
          sessionId: data.sessionId
        },
        usersDatabase
      );

      if (result.status == "Fail") {
        return response.status(422).send("ERROR: INVALID SESSION ID");
      } else {
        return response.json({ status: result.status });
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
  console.log("NOTFOUND: " + request.url);
});

functions.nonExpressSetup(usersDatabase);
