import { setLoadingState, showToast, loadHTML} from "../../utils/helper";

let language = [];
let isLoading = false;
let isToastAdded = false;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const popoverBody = document.getElementsByClassName("popover-body");

document.addEventListener("DOMContentLoaded", fetchLanguage);
searchInput.addEventListener("input", filterLanguage);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveLanguage);
deleteBtn.addEventListener("click", deleteLanguage);

function fetchLanguage() {
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
  fetch("http://localhost/savoy-movie-booking/api/language.php")
    .then((response) => response.json())
    .then((data) => {
      language = data.data || [];
      displayLanguage(language);
    })
    .catch((error) => console.error("Error fetching language:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
  } else if (language.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">No language available</td></tr>';
  }
}

function displayLanguage(language) {
  tableBody.innerHTML = "";
  language.forEach((language, index) => {
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${language.name}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${
          language.id
        }" data-name="${language.name}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterLanguage() {
  const query = searchInput.value.toLowerCase();
  const filteredLanguage = language.filter((language) =>
    language.name.toLowerCase().includes(query)
  );
  displayLanguage(filteredLanguage);
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
  document.getElementById("editModalLabel").innerText = "Create Language";
  document.getElementById("language-name").value = "";
  document.getElementById("language-id").value = "";
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  document.getElementById("editModalLabel").innerText = "Edit Language";
  document.getElementById("language-name").value = name;
  document.getElementById("language-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("language-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function saveLanguage() {
  const name = document.getElementById("language-name").value;
  const id = document.getElementById("language-id").value;
  if (name) {
    const method = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost/savoy-movie-booking/api/language.php?id=${id}`
      : "http://localhost/savoy-movie-booking/api/language.php";
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
        modal.hide();
        fetchLanguage();
      })
      .catch((error) => console.error("Error saving language:", error))
      .finally(() => {
        setLoadingState(saveBtn, false, "Save");
      });
  } else {
    showToast("Name is required", "error");
  }
}

function deleteLanguage() {
  const id = document.getElementById("language-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/language.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      showToast("Language has been deleted");
      modal.hide();
      fetchLanguage();
    })
    .catch((error) => console.error("Error deleting language:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
