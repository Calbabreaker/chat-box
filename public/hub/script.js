const messagesHolder = document.getElementById("messagesHolder");
const textToSendArea = document.getElementById("textToSend");
const loadingText = document.getElementById("loadingText");

let errorMessageTimeout;
let nickname;
let messages = [];

class Message {
  constructor(user, text, timestamp, count, top) {
    this.user = user;
    this.text = text;
    this.timestamp = timestamp;
    this.count = count;

    const rootElement = document.createElement("div");
    const userElement = document.createElement("h1");
    const textElement = document.createElement("div");

    rootElement.className = "rootElement";
    rootElement.style.textAlign = nickname === user ? "left" : "right";
    userElement.textContent = user;
    userElement.className = "userElement";
    textElement.textContent = text;
    textElement.className = "textElement";
    this.rootElement = rootElement;

    rootElement.append(userElement, textElement);
    if (!top) {
      messagesHolder.append(rootElement);
    } else {
      messagesHolder.insertBefore(rootElement, messages[0].rootElement);
    }
  }
}

class Status {
  constructor(text, timestamp, count, top) {
    this.text = text;
    this.timestamp = timestamp;
    this.count = count;

    const rootElement = document.createElement("div");
    const textElement = document.createElement("div");

    rootElement.className = "rootElement";
    textElement.textContent = text;
    textElement.className = "textElement";

    rootElement.append(textElement);
    messagesHolder.append(rootElement);
    if (!top) {
      messagesHolder.append(rootElement);
    } else {
      messagesHolder.insertBefore(rootElement, messages[0].rootElement);
    }
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

    textToSendArea.value = "";
    await trySend(options).catch(console.error);
    await loadMessages(getParamToPut());
    messagesHolder.scrollTop = messagesHolder.scrollHeight;
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

async function loadMessages(parameter) {
  const response = await fetch("/app/messages/" + parameter);
  const data = await response.json();

  let shouldScrollToBottom = messagesHolder.scrollTop + messagesHolder.offsetHeight >= messagesHolder.scrollHeight;
  data.forEach(item => {
    if (item.type == "message") {
      messages.push(new Message(item.nickname, item.text, item.timestamp, item.count, false));
    } else if (item.type == "status") {
      messages.push(new Status(item.text, item.timestamp, item.count, false));
    }
  });

  if (shouldScrollToBottom) {
    messagesHolder.scrollTop = messagesHolder.scrollHeight;
  }
}

async function loadPrevMessages() {
  const response = await fetch(`/app/messages/${messages[0].count}-<`);
  const data = await response.json();

  if (messagesHolder.scrollTop <= loadingText.offsetHeight && data.length > 0) {
    const messagesIndex = messages.length;
    data.forEach(item => {
      if (item.type == "message") {
        messages.unshift(new Message(item.nickname, item.text, item.timestamp, item.count, true));
      } else if (item.type == "status") {
        messages.unshift(new Status(item.text, item.timestamp, item.count, true));
      }
    });

    messagesHolder.scrollTop = messagesHolder.scrollHeight - messages[messagesIndex].rootElement.offsetTop - messagesHolder.offsetTop;
  }

  if (data.length == 0) {
    loadingText.textContent = "You reached the beggining of the chat.";
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
  loadMessages(":").then(() => (messagesHolder.scrollTop = messagesHolder.scrollHeight));
  let loadMessagesInterval = setInterval(() => {
    loadMessages(getParamToPut()).catch(err => {
      console.error(err), clearInterval(loadMessagesInterval);
    });
  }, 1000);

  textToSendArea.addEventListener("keydown", event => {
    if (event.key == "Enter") {
      event.preventDefault();
      sendToServer();
    }
  });

  messagesHolder.onscroll = event => {
    if (messagesHolder.scrollTop <= loadingText.offsetHeight) {
      loadPrevMessages();
    }
  };
}

function getParamToPut() {
  if (messages.length > 0) {
    return (messages[messages.length - 1].count + 1).toString() + "->";
  } else {
    return ":";
  }
}

redirectIfInvalidSessionId().then(startEverything);
