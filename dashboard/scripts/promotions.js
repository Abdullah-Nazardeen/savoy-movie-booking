import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let promotions = [];
let isLoading = false;
let isToastAdded = false;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");

document.addEventListener("DOMContentLoaded", fetchPromotions);
searchInput.addEventListener("input", filterPromotions);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", savePromotion);
deleteBtn.addEventListener("click", deletePromotion);

function fetchPromotions() {
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
  fetch("http://localhost/savoy-movie-booking/api/promotion.php")
    .then((response) => response.json())
    .then((data) => {
      promotions = data.data || [];
      displayPromotions(promotions);
    })
    .catch((error) => console.error("Error fetching promotions:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
  } else if (promotions.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">No promotions available</td></tr>';
  }
}

function displayPromotions(promotions) {
  tableBody.innerHTML = "";
  promotions.forEach((promotion, index) => {
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${promotion.name}</td>
      <td>${promotion.discount}%</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${
          promotion.id
        }" data-name="${promotion.name}" data-discount="${promotion.discount}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterPromotions() {
  const query = searchInput.value.toLowerCase();
  const filteredPromotions = promotions.filter((promotion) =>
    promotion.name.toLowerCase().includes(query)
  );
  displayPromotions(filteredPromotions);
}

let activePopover = null;
function openMoreOptions(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const discount = event.target.dataset.discount;

  // Hide the currently active popover if it exists
  if (activePopover) {
    activePopover.hide();
    bootstrap.Popover.getInstance(activePopover._element).dispose();
    activePopover = null;
  }

  const popoverContent = document.createElement("div");
  popoverContent.classList.add = "popover-body";
  popoverContent.innerHTML = `
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-name="${name}" data-discount="${discount}">Edit</button>
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
  document.getElementById("editModalLabel").innerText = "Create Promotion";
  document.getElementById("promotion-name").value = "";
  document.getElementById("promotion-discount").value = "";
  document.getElementById("promotion-id").value = "";
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const discount = event.target.dataset.discount;
  document.getElementById("editModalLabel").innerText = "Edit Promotion";
  document.getElementById("promotion-name").value = name;
  document.getElementById("promotion-discount").value = discount;
  document.getElementById("promotion-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("promotion-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function savePromotion() {
  const name = document.getElementById("promotion-name").value;
  const discount = document.getElementById("promotion-discount").value;
  const id = document.getElementById("promotion-id").value;
  if (name) {
    if (discount) {
      const method = id ? "PUT" : "POST";
      const url = id
        ? `http://localhost/savoy-movie-booking/api/promotion.php?id=${id}`
        : "http://localhost/savoy-movie-booking/api/promotion.php";
      const payload = JSON.stringify({ id, name, discount });
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
          fetchPromotions();
        })
        .catch((error) => console.error("Error saving promotion:", error))
        .finally(() => {
          setLoadingState(saveBtn, false, "Save");
        });
    } else {
      showToast("Discount is required", "error");
    }
  } else {
    showToast("Name is required", "error");
  }
}

function deletePromotion() {
  const id = document.getElementById("promotion-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/promotion.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchPromotions();
    })
    .catch((error) => console.error("Error deleting promotion:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
