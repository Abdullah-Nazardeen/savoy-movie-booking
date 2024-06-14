export function loadHTML(elementId, url) {
  fetch(url)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(elementId).innerHTML = data;
    })
    .catch((error) => console.error("Error loading HTML:", error));
}

export function setLoadingState(button, isLoading, text) {
  if (isLoading) {
    button.classList.add("btn-loading");
    button.innerHTML = text;
    button.disabled = true;
  } else {
    button.classList.remove("btn-loading");
    button.innerHTML = text;
    button.disabled = false;
  }
}

export function showToast(message, type = "success") {
  const toastElement = document.getElementById("toast");
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastElement);

  toastElement.querySelector(".toast-body").textContent = message;

  const toastIcon = toastElement.querySelector(".toast-icon");
  if (type === "success") {
      toastElement.className = "toast align-items-center border-0";
      toastIcon.innerHTML = '<i class="bi bi-check-circle-fill text-success fs-5"></i>';
  } else if (type === "error") {
      toastElement.className = "toast align-items-center border-0";
      toastIcon.innerHTML = '<i class="bi bi-x-circle-fill text-danger fs-5"></i>';
  }

  toastBootstrap.show();
}