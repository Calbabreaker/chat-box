const express = require("express");
const fs = require("fs");
const path = require("path");

const database = require("./database");
const limiters = require("./resources/limiters.js");

//init stuff
const app = express();
database.init();
app.run = {};

//setup vars
const PORT = process.env.PORT || 5000;
global.rootDir = path.resolve(__dirname);

//setup app folder that is neat
const normalizedPath = path.join(__dirname, "./resources/app/");
fs.readdirSync(normalizedPath).forEach(file => {
  app.run[file.split(".")[0]] = require("./resources/app/" + file);
});

app.listen(PORT, () => console.log("Server Running..."));
app.use(express.static("public"));
app.use(express.json({ limit: "1kb" }));

//setup limiters
app.use("/app/send", limiters.sendLimiter);
app.use("/app/users", limiters.userCreateLimiter);
app.use("/app/messages", limiters.messagesLimiter);

//get requests
app.get("/app/check_session_id/:session_id", app.run.checkSessionId);
app.get("/app/messages/:fromIndex", app.run.messages);

//post requests
app.post("/app/send", app.run.send);
app.post("/app/users/:type", app.run.users);

//not found error and send 404 html file
app.use((request, response, next) => {
  response.status(404).sendFile(__dirname + "/static/404error.html");
  console.log("NOTFOUND: " + request.url);
});
