import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let parkings = [];
let isLoading = false;
let isToastAdded = false;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");

document.addEventListener("DOMContentLoaded", fetchParkings);
searchInput.addEventListener("input", filterParkings);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveParking);
deleteBtn.addEventListener("click", deleteParking);

function fetchParkings() {
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
  fetch("http://localhost/savoy-movie-booking/api/parking.php")
    .then((response) => response.json())
    .then((data) => {
      parkings = data.data || [];
      displayParkings(parkings);
    })
    .catch((error) => console.error("Error fetching parkings:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
  } else if (parkings.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center">No parkings available</td></tr>';
  }
}

function displayParkings(parkings) {
  tableBody.innerHTML = "";
  parkings.forEach((parking, index) => {
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${parking.name}</td>
      <td>${parking.parking_capacity}</td>
      <td>${parking.code}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${
          parking.id
        }" data-name="${parking.name}" data-capacity="${
      parking.parking_capacity
    }" data-code="${parking.code}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterParkings() {
  const query = searchInput.value.toLowerCase();
  const filteredParkings = parkings.filter((parking) =>
    parking.name.toLowerCase().includes(query)
  );
  displayParkings(filteredParkings);
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
  document.getElementById("editModalLabel").innerText = "Create Parking";
  document.getElementById("parking-name").value = "";
  document.getElementById("parking-capacity").value = "";
  document.getElementById("parking-code").value = "";
  document.getElementById("parking-id").value = "";
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const capacity = event.target.dataset.capacity;
  const code = event.target.dataset.code;
  document.getElementById("editModalLabel").innerText = "Edit Parking";
  document.getElementById("parking-name").value = name;
  document.getElementById("parking-capacity").value = capacity;
  document.getElementById("parking-code").value = code;
  document.getElementById("parking-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("parking-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function saveParking() {
  const name = document.getElementById("parking-name").value;
  const capacity = document.getElementById("parking-capacity").value;
  const code = document.getElementById("parking-code").value;
  const id = document.getElementById("parking-id").value;
  if (name) {
    if (capacity) {
      if (code) {
        const method = id ? "PUT" : "POST";
        const url = id
          ? `http://localhost/savoy-movie-booking/api/parking.php?id=${id}`
          : "http://localhost/savoy-movie-booking/api/parking.php";
        const payload = JSON.stringify({
          id,
          name,
          parking_capacity: capacity,
          code,
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
            fetchParkings();
          })
          .catch((error) => console.error("Error saving parking:", error))
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

function deleteParking() {
  const id = document.getElementById("parking-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/parking.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchParkings();
    })
    .catch((error) => console.error("Error deleting parking:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
