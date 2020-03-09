const nicknameInput = document.getElementById("nicknameInput");
let errorMessageTimeout;

async function trySend(options) {
  return new Promise(async (resolve, reject) => {
    const response = await fetch("/app/user/create", options);
    if (response.status.toString()[0] == "4") {
      //too many requests
      if (response.status === 422) {
        setErrorMessage(
          "Nickname currently being used by another user! Please choose another one."
        );
        reject("TAKEN ERROR 422");
      } else {
        setErrorMessage(
          `There was a problem joining! (${response.status} error)`
        );
        reject(`${response.status} ERROR`);
      }
    } else {
      resolve(response);
    }
  });
}

async function join() {
  if (nicknameInput.value.replace(/\s/g, "").length) {
    const data = {
      nickname: nicknameInput.value
    };

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };

    const response = await trySend(options);
    const dataSentBack = await response.json();
    localStorage.setItem("sessionId", dataSentBack.sessionId);
    location.href = "/hub";
  }
}

function setErrorMessage(message) {
  const errorMessageText = document.getElementById("errorMessage");
  errorMessageText.textContent = message;
  clearTimeout(errorMessageTimeout);
  errorMessageTimeout = setTimeout(() => {
    errorMessageText.textContent = "";
  }, 10000);
}

async function redirectIfValidSessionId() {
  const sessionId = localStorage.getItem("sessionId");
  const response = await fetch("/app/check_session_id/" + sessionId);
  const data = await response.json();
  if (data.valid) {
    location.href = "/hub";
  }
}

nicknameInput.addEventListener("keydown", event => {
  if (event.key == "Enter") {
    join();
  }
});

redirectIfValidSessionId();
