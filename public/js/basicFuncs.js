async function fetchAndHandle(url, textBoxesId, loadingIcon, redirect = "") {
  const formatedData = {};
  textBoxesId.forEach((id) => (formatedData[id] = document.getElementById(id).value));

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatedData),
  };

  if (loadingIcon) loadingIcon.style.visibility = "";
  const response = await fetch(url, options);
  const succeed = await handleErrors(response);

  if (succeed) {
    location.href = redirect;
    return;
  }

  if (loadingIcon) loadingIcon.style.visibility = "hidden";
}

async function handleErrors(response) {
  const data = await response.json();
  if (response.status === 422) {
    // loop through the errors and sets inputs iccordingly
    [...document.getElementsByClassName("textInput")].forEach((input) => {
      input.style.backgroundColor = "#96ff9e";
      const div = input.parentElement;
      const tooltip = input.parentElement.getElementsByClassName("tooltip")[0];
      if (tooltip != null) {
        div.removeChild(tooltip);
      }
    });

    data.errors.forEach((error) => {
      const whichErrorElement = document.getElementById(error.param);
      whichErrorElement.style.backgroundColor = "#fc9090";

      const tooltip = document.createElement("div");
      tooltip.classList.add("tooltip");
      tooltip.textContent = error.msg;
      whichErrorElement.parentElement.appendChild(tooltip);
    });

    return false;
  } else if (!data.success) {
    console.log(data.errors);
    alert("There was an unknown problem preventing from doing your action.");
    return false;
  } else return true;
}
