async function fetchAndHandle(url, textBoxesId, loadingIcon, redirect, method = "POST") {
  const formatedData = {};
  textBoxesId.forEach((id) => (formatedData[id] = document.getElementById(id).value));

  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatedData),
  };

  if (loadingIcon) loadingIcon.style.visibility = "visible";
  const response = await fetch(url, options);
  const succeeded = await handleErrors(response, textBoxesId);

  if (succeeded && redirect != null) location.href = redirect;
  if (loadingIcon) loadingIcon.style.visibility = "hidden";
  return succeeded;
}

async function handleErrors(response, textBoxesId) {
  const data = await response.json();
  if (response.status === 422) {
    // loop through the errors and sets inputs accordingly
    textBoxesId.forEach((id) => {
      const input = document.getElementById(id);
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

function setCaretPos(element, caretPos) {
  if (element.selectionStart != null) {
    element.focus();
    element.setSelectionRange(caretPos, caretPos);
  } else element.focus();
}
