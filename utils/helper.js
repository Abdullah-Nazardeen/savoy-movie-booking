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

export function formatDate(dateString, timeString = "", options = { includeYear: false, includeTime: false }) {
  const months = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
  ];

  const [year, month, day] = dateString.split('-');

  // Remove leading zeros from day
  const dayNumber = parseInt(day, 10);

  // Get the appropriate suffix for the day
  let daySuffix;
  if (dayNumber % 10 === 1 && dayNumber !== 11) {
      daySuffix = "st";
  } else if (dayNumber % 10 === 2 && dayNumber !== 12) {
      daySuffix = "nd";
  } else if (dayNumber % 10 === 3 && dayNumber !== 13) {
      daySuffix = "rd";
  } else {
      daySuffix = "th";
  }

  const formattedDate = `${dayNumber}${daySuffix} ${months[month - 1]}`;

  if (options.includeYear) {
      return `${formattedDate} ${year}`;
  } else if (options.includeTime) {
    return `${formattedDate} ${timeString}`;
  } else if (options.includeTime && options.includeYear) {
    return `${formattedDate} ${year} ${timeString}`;
  } else {
      return formattedDate;
  }
}

export function capitalizeFirstLetter(str) {
  if (str.length === 0) {
      return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}