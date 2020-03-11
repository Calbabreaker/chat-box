const messagesHolder = document.getElementById("messagesHolder");
const textToSendArea = document.getElementById("textToSend");

let errorMessageTimeout;
let nickname;

class Message {
  constructor(user, text, timestamp) {
    this.user = user;
    this.text = text;
    this.timestamp = timestamp;

    const rootElement = document.createElement("div");
    const userElement = document.createElement("h1");
    const textElement = document.createElement("div");

    rootElement.className = "rootElement";
    rootElement.style.textAlign = nickname === user ? "left" : "right";
    userElement.textContent = user;
    userElement.className = "userElement";
    textElement.textContent = text;
    textElement.className = "textElement";

    rootElement.append(userElement, textElement);
    messagesHolder.append(rootElement);
  }
}

class Status {
  constructor(text, timestamp) {
    this.text = text;
    this.timestamp = timestamp;

    const rootElement = document.createElement("div");
    const textElement = document.createElement("div");

    rootElement.className = "rootElement";
    textElement.textContent = text;
    textElement.className = "textElement";

    rootElement.append(textElement);
    messagesHolder.append(rootElement);
  }
}

async function trySend(options) {
  return new Promise(async (resolve, reject) => {
    const response = await fetch("/app/send", options);
    const text = await response.text();
    if (response.status.toString()[0] == "4") {
      //too many requests
      if (response.status === 429) {
        setErrorMessage("Your sending messages to fast! (blocked sending messages for a short amount of time)");
        reject("TOO MANY REQUESTS ERROR 429");
      } else {
        setErrorMessage(`There was a promblem sending your message! (${response.status} error)`);
        reject(`${response.status} ERROR, ${text}`);
      }
    } else {
      resolve(response);
    }
  });
}

async function sendToServer() {
  if (textToSendArea.value.replace(/\s/g, "").length) {
    const data = {
      sessionId: localStorage.getItem("sessionId"),
      text: textToSendArea.value
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

    await Promise.all([trySend(options), loadMessages()]).catch(console.error);
    messagesHolder.scrollTop = messagesHolder.scrollHeight;
    textToSendArea.value = "";
  }
}

async function quit() {
  const canQuit = confirm(`This WILL delete your nickname '${nickname}' and let others use it for maxium 10 days.`);

  if (canQuit) {
    const data = {
      sessionId: localStorage.getItem("sessionId")
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

    await fetch("/app/users/quit", options).catch(console.error);
    localStorage.setItem("sessionId", null);
    location.href = "/";
  }
}

async function loadMessages() {
  const sessionId = localStorage.getItem("sessionId");
  const response = await fetch("/app/messages/" + sessionId);
  const data = await response.json();

  let shouldScrollToBottom = messagesHolder.scrollTop >= messagesHolder.scrollHeight - 400;
  messagesHolder.textContent = "";
  data.forEach(item => {
    if (item.type == "message") {
      new Message(item.nickname, item.text, item.timestamp);
    } else if (item.type == "status") {
      new Status(item.text, item.timestamp);
    }
  });

  if (shouldScrollToBottom) {
    messagesHolder.scrollTop = messagesHolder.scrollHeight;
  }
}

function setErrorMessage(message) {
  const errorMessageText = document.getElementById("errorMessage");
  errorMessageText.textContent = message;
  clearTimeout(errorMessageTimeout);
  errorMessageTimeout = setTimeout(() => {
    errorMessageText.textContent = "";
  }, 2000);
}

async function redirectIfInvalidSessionId() {
  const sessionId = localStorage.getItem("sessionId");
  const response = await fetch("/app/check_session_id/" + sessionId);
  const data = await response.json();
  if (!data.valid) {
    location.href = "/";
  } else {
    const welcomeTextbox = document.getElementById("welcomeText");
    nickname = data.userData.nickname;
    welcomeTextbox.textContent = `Welcome ${nickname}! start typing in chat.`;
  }
}

function startEverything() {
  loadMessages().then(() => (messagesHolder.scrollTop = messagesHolder.scrollHeight));
  let loadMessagesInterval = setInterval(() => {
    loadMessages().catch(err => {
      console.error(err), clearInterval(loadMessagesInterval);
    });
  }, 1000);

  textToSendArea.addEventListener("keydown", event => {
    if (event.key == "Enter") {
      event.preventDefault();
      sendToServer();
    }
  });
}

redirectIfInvalidSessionId().then(startEverything);
