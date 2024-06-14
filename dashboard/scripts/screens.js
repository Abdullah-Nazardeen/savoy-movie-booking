import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let screens = [];
let isLoading = false;
let isToastAdded = false;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");

document.addEventListener("DOMContentLoaded", fetchScreens);
searchInput.addEventListener("input", filterScreens);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveScreen);
deleteBtn.addEventListener("click", deleteScreen);

function fetchScreens() {
  if (!isToastAdded) {
    loadHTML(
      "toast-placeholder",
      "http://localhost/savoy-movie-booking/common/toast.html"
    );
    isToastAdded = true;
  }
  if (isLoading) return;
  isLoading = true;
  setLoadingUI(true);
  fetch("http://localhost/savoy-movie-booking/api/screen.php")
    .then((response) => response.json())
    .then((data) => {
      screens = data.data || [];
      displayScreens(screens);
    })
    .catch((error) => console.error("Error fetching screens:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
  } else if (screens.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center">No screens available</td></tr>';
  }
}

function displayScreens(screens) {
  tableBody.innerHTML = "";
  screens.forEach((screen, index) => {
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${screen.name}</td>
      <td>${screen.seating_capacity}</td>
      <td>${screen.seating_code}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${
          screen.id
        }" data-name="${screen.name}" data-capacity="${
      screen.seating_capacity
    }" data-code="${screen.seating_code}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterScreens() {
  const query = searchInput.value.toLowerCase();
  const filteredScreens = screens.filter((screen) =>
    screen.name.toLowerCase().includes(query)
  );
  displayScreens(filteredScreens);
}

let activePopover = null;
function openMoreOptions(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const capacity = event.target.dataset.capacity;
  const code = event.target.dataset.code;
  // Hide the currently active popover if it exists
  if (activePopover) {
    activePopover.hide();
    bootstrap.Popover.getInstance(activePopover._element).dispose();
    activePopover = null;
  }

  const popoverContent = document.createElement("div");
  popoverContent.classList.add = "popover-body";
  popoverContent.innerHTML = `
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-name="${name}" data-capacity="${capacity}" data-code="${code}">Edit</button>
      <button class="dropdown-item delete-btn text-destruction" data-id="${id}">Delete</button>
    `;

  const popover = new bootstrap.Popover(event.target, {
    content: popoverContent,
    html: true,
    placement: "left",
  });

  popover.show();
  activePopover = popover;

  // Add event listeners for edit and delete buttons within the popover
  popoverContent.querySelector(".edit-btn").addEventListener("click", (e) => {
    openEditModal(e);
    popover.hide();
    bootstrap.Popover.getInstance(event.target).dispose();
    activePopover = null;
  });

  popoverContent.querySelector(".delete-btn").addEventListener("click", (e) => {
    openDeleteModal(e);
    popover.hide();
    bootstrap.Popover.getInstance(event.target).dispose();
    activePopover = null;
  });

  // Event listener to close popover when clicking outside
  document.addEventListener("click", (e) => {
    console.log(
      "CLICKED BACKGROUND",
      !event.target.contains(e.target),
      !popoverContent.contains(e.target)
    );
    if (
      !event.target.contains(e.target) &&
      !popoverContent.contains(e.target)
    ) {
      popover.hide();
      bootstrap.Popover.getInstance(event.target).dispose();
      activePopover = null;
    }
  });
}

function openCreateModal() {
  document.getElementById("editModalLabel").innerText = "Create Screen";
  document.getElementById("screen-name").value = "";
  document.getElementById("screen-capacity").value = "";
  document.getElementById("screen-code").value = "";
  document.getElementById("screen-id").value = "";
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const capacity = event.target.dataset.capacity;
  const code = event.target.dataset.code;
  document.getElementById("editModalLabel").innerText = "Edit Screen";
  document.getElementById("screen-name").value = name;
  document.getElementById("screen-capacity").value = capacity;
  document.getElementById("screen-code").value = code;
  document.getElementById("screen-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("screen-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function saveScreen() {
  const name = document.getElementById("screen-name").value;
  const capacity = document.getElementById("screen-capacity").value;
  const code = document.getElementById("screen-code").value;
  const id = document.getElementById("screen-id").value;
  if (name) {
    if (capacity) {
      if (code) {
        const method = id ? "PUT" : "POST";
        const url = id
          ? `http://localhost/savoy-movie-booking/api/screen.php?id=${id}`
          : "http://localhost/savoy-movie-booking/api/screen.php";
        const payload = JSON.stringify({
          id,
          name,
          seating_capacity: capacity,
          seating_code: code,
        });
        setLoadingState(saveBtn, true, "Saving...");
        fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: payload,
        })
          .then((response) => response.json())
          .then((data) => {
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("editModal")
            );
            modal.hide();
            fetchScreens();
          })
          .catch((error) => console.error("Error saving screen:", error))
          .finally(() => {
            setLoadingState(saveBtn, false, "Save");
          });
      } else {
        showToast("Code is required", "error");
      }
    } else {
      showToast("Capacity is required", "error");
    }
  } else {
    showToast("Name is required", "error");
  }
}

function deleteScreen() {
  const id = document.getElementById("screen-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/screen.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchScreens();
    })
    .catch((error) => console.error("Error deleting screen:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
