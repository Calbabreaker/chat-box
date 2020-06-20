const loadingIcon = document.getElementById("formLoadingIcon");
loadingIcon.style.visibility = "hidden";

async function fetchAndHandle(url, textBoxesId, redirect = "") {
  const formatedData = {};
  textBoxesId.forEach((id) => (formatedData[id] = document.getElementById(id).value));
  loadingIcon.style.visibility = "";

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatedData),
  };

  const response = await fetch(url, options);
  const data = await response.json();

  if (response.status === 422) {
    // loop through the errors and sets inputs iccordingly
    [...document.getElementsByClassName("textInput")].forEach((input) => {
      input.style.backgroundColor = "#96ff9e";
    });

    data.errors.forEach((error) => {
      const whichErrorElement = document.getElementById(error.param);
      whichErrorElement.style.backgroundColor = "#fc9090";

      const tooltip = document.createElement("div");
      tooltip.classList.add("tooltip");
      tooltip.textContent = error.msg;
      whichErrorElement.parentElement.appendChild(tooltip);
    });
  } else if (!data.success) {
    console.log(data.errors);
    alert("There was an unknown problem preventing signing in.");
  } else {
    location.href = redirect;
    return;
  }

  loadingIcon.style.visibility = "hidden";
}
