async function fetchAndHandle(url, textBoxesId, redirect = "") {
  const formatedData = {};
  textBoxesId.forEach((id) => (formatedData[id] = document.getElementById(id).value));

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
    [...document.getElementsByClassName("textInput")].forEach((input) => ((input.style.backgroundColor = "#96ff9e"), input.removeAttribute("title")));
    data.errors.forEach((error) => {
      const whichErrorElement = document.getElementById(error.param);
      whichErrorElement.style.backgroundColor = "#fc9090";
      whichErrorElement.setAttribute("title", error.msg);
    });
  } else if (!data.success) {
    console.log(data.errors);
    alert("There was an unknown problem preventing signing in.");
  } else {
    location.href = redirect;
  }
}
