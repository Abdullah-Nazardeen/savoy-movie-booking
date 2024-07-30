import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let staffs = [];
let isLoading = false;
let isToastAdded = false;
let activePopover = null;

const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const staffImageInput = document.getElementById("staff-image");

document.addEventListener("DOMContentLoaded", fetchStaffs);
searchInput.addEventListener("input", filterStaffs);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveStaff);
deleteBtn.addEventListener("click", deleteStaff);
staffImageInput.addEventListener("change", handleImageChange);

function fetchStaffs() {
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
  fetch("http://localhost/savoy-movie-booking/api/staff.php")
    .then((response) => response.json())
    .then((data) => {
      staffs = data.data || [];
      displayStaffs(staffs);
    })
    .catch((error) => console.error("Error fetching staffs:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
  } else if (staffs.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">No staffs available</td></tr>';
  }
}

function displayStaffs(staffs) {
  tableBody.innerHTML = "";
  staffs.forEach((staff, index) => {
    const avatar = `<img src="http://localhost/savoy-movie-booking/images/user-image.png" class="avatar" alt="Avatar" />`;
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <td>${avatar}</td>
      <td>${staff.email}</td>
      <td>${staff.username}</td>
      <td>${staff.first_name ?? "-----"}</td>
      <td>${staff.last_name ?? "-----"}</td>
      <td>${staff.phone ?? "-----"}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${
          staff.id
        }" data-email="${staff.email}" data-username="${
      staff.username
    }" data-password="${staff.password}" data-firstName="${
      staff.first_name ?? ""
    }" data-lastName="${staff.last_name ?? ""}" data-phone="${
      staff.phone ?? ""
    }" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterStaffs() {
  const query = searchInput.value.toLowerCase();
  const filteredStaffs = staffs.filter((staff) =>
    staff.username.toLowerCase().includes(query)
  );
  displayStaffs(filteredStaffs);
}


function openMoreOptions(event) {
  const id = event.target.dataset.id;
  const email = event.target.dataset.email;
  const username = event.target.dataset.username;
  const firstName = event.target.dataset.firstname;
  const lastName = event.target.dataset.lastname;
  const phone = event.target.dataset.phone;
  const password = event.target.dataset.password;

  console.log("open more options", firstName, lastName)

  // Hide the currently active popover if it exists
  if (activePopover) {
    activePopover.hide();
    bootstrap.Popover.getInstance(activePopover._element).dispose();
    activePopover = null;
  }

  const popoverContent = document.createElement("div");
  popoverContent.classList.add = "popover-body";
  popoverContent.innerHTML = `
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-email="${email}" data-username="${username}" data-password="${password}" data-firstName="${
    firstName || ""
  }" data-lastName="${lastName || ""}" data-phone="${phone || ""}">Edit</button>
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

    const emailElement = document.getElementById("staff-email");
  const usernameElement = document.getElementById("staff-username");
  const passwordDiv = document.getElementById("password-container");

  emailElement.disabled = false;
  usernameElement.disabled = false;
  passwordDiv.hidden = false;

  document.getElementById("editModalLabel").innerText = "Create Staff";
  emailElement.value = "";
  usernameElement.value = "";
  document.getElementById("staff-password").value = "";
  document.getElementById("staff-first-name").value = "";
  document.getElementById("staff-last-name").value = "";
  document.getElementById("staff-phone").value = "";
  document.getElementById("staff-id").value = "";

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  const id = event.target.dataset.id;
  const email = event.target.dataset.email;
  const username = event.target.dataset.username;
  const firstName = event.target.dataset.firstname;
  const lastName = event.target.dataset.lastname;
  const phone = event.target.dataset.phone;
  const password = event.target.dataset.password;

  const emailElement = document.getElementById("staff-email");
  const usernameElement = document.getElementById("staff-username");
  const passwordDiv = document.getElementById("password-container");

  emailElement.disabled = true;
  usernameElement.disabled = true;
  passwordDiv.hidden = true;

  document.getElementById("editModalLabel").innerText = "Edit Staff";
  emailElement.value = email;
  usernameElement.value = username;
  document.getElementById("staff-password").value = password;
  document.getElementById("staff-first-name").value = firstName ?? "";
  document.getElementById("staff-last-name").value = lastName ?? "";
  document.getElementById("staff-phone").value = phone ?? "";
  document.getElementById("staff-id").value = id;

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("staff-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function saveStaff() {
  const email = document.getElementById("staff-email").value;
  const username = document.getElementById("staff-username").value;
  const firstName = document.getElementById("staff-first-name").value;
  const lastName = document.getElementById("staff-last-name").value;
  const phone = document.getElementById("staff-phone").value;
  const password = document.getElementById("staff-password").value;
  const id = document.getElementById("staff-id").value;

  if (email) {
    if (!username) {
      showToast("Username is required", "error");
      return;
    }
    const payload = JSON.stringify({
      id,
      email,
      username,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
      password: password,
    });
    const method = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost/savoy-movie-booking/api/staff.php?id=${id}`
      : "http://localhost/savoy-movie-booking/api/staff.php";

    setLoadingState(saveBtn, true, "Saving...");
    fetch(url, {
      method: method,
      body: payload,
    })
      .then((response) => response.json())
      .then((data) => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("editModal")
        );
        modal.hide();
        fetchStaffs();
      })
      .catch((error) => console.error("Error saving staff:", error))
      .finally(() => {
        setLoadingState(saveBtn, false, "Save");
      });
  } else {
    showToast("Email is required", "error");
  }
}

function deleteStaff() {
  const id = document.getElementById("staff-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/staff.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchStaffs();
    })
    .catch((error) => console.error("Error deleting staff:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
