import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let categories = [];
let isLoading = false;
let isToastAdded = false;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const popoverBody = document.getElementsByClassName("popover-body");

document.addEventListener("DOMContentLoaded", fetchCategories);
searchInput.addEventListener("input", filterCategories);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveCategory);
deleteBtn.addEventListener("click", deleteCategory);

function fetchCategories() {
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
  fetch("http://localhost/savoy-movie-booking/api/category.php")
    .then((response) => response.json())
    .then((data) => {
      categories = data.data || [];
      displayCategories(categories);
    })
    .catch((error) => console.error("Error fetching categories:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
  } else if (categories.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">No categories available</td></tr>';
  }
}

function displayCategories(categories) {
  tableBody.innerHTML = "";
  categories.forEach((category, index) => {
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${category.name}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${
          category.id
        }" data-name="${category.name}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterCategories() {
  const query = searchInput.value.toLowerCase();
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(query)
  );
  displayCategories(filteredCategories);
}

let activePopover = null;
function openMoreOptions(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;

  // Hide the currently active popover if it exists
  if (activePopover) {
    activePopover.hide();
    bootstrap.Popover.getInstance(activePopover._element).dispose();
    activePopover = null;
  }

  const popoverContent = document.createElement("div");
  popoverContent.classList.add = "popover-body";
  popoverContent.innerHTML = `
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-name="${name}">Edit</button>
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
  document.getElementById("editModalLabel").innerText = "Create Category";
  document.getElementById("category-name").value = "";
  document.getElementById("category-id").value = "";
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  document.getElementById("editModalLabel").innerText = "Edit Category";
  document.getElementById("category-name").value = name;
  document.getElementById("category-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("category-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function saveCategory() {
  const name = document.getElementById("category-name").value;
  const id = document.getElementById("category-id").value;
  if (name) {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost/savoy-movie-booking/api/category.php?id=${id}`
      : "http://localhost/savoy-movie-booking/api/category.php";
    const payload = JSON.stringify({ id, name });
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
        showToast("Category has been updated successfully");
        modal.hide();
        fetchCategories();
      })
      .catch((error) => console.error("Error saving category:", error))
      .finally(() => {
        setLoadingState(saveBtn, false, "Save");
      });
  } else {
    showToast("Name is required", "error");
  }
}

function deleteCategory() {
  const id = document.getElementById("category-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/category.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchCategories();
    })
    .catch((error) => console.error("Error deleting category:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
