import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let customers = [];
let isLoading = false;
let isToastAdded = false;
let activePopover = null;

const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const customerImageInput = document.getElementById("customer-image");

document.addEventListener("DOMContentLoaded", fetchCustomers);
searchInput.addEventListener("input", filterCustomers);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveCustomer);
deleteBtn.addEventListener("click", deleteCustomer);
customerImageInput.addEventListener("change", handleImageChange);

function fetchCustomers() {
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
  fetch("http://localhost/savoy-movie-booking/api/customer.php")
    .then((response) => response.json())
    .then((data) => {
      customers = data.data || [];
      displayCustomers(customers);
    })
    .catch((error) => console.error("Error fetching customers:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
  } else if (customers.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">No customers available</td></tr>';
  }
}

function displayCustomers(customers) {
  tableBody.innerHTML = "";
  customers.forEach((customer, index) => {
    const avatar = `<img src="http://localhost/savoy-movie-booking/images/user-image.png" class="avatar" alt="Avatar" />`

    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <td>${avatar}</td>
      <td>${customer.email}</td>
      <td>${customer.username}</td>
      <td>${customer.first_name ?? "-----"}</td>
      <td>${customer.last_name ?? "-----"}</td>
      <td>${customer.phone ?? "-----"}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${customer.id}" data-email="${customer.email}" data-username="${customer.username}" data-firstName="${customer.first_name || ''}" data-lastName="${customer.last_name || ''}" data-phone="${customer.phone || ''}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterCustomers() {
  const query = searchInput.value.toLowerCase();
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(query)
  );
  displayCustomers(filteredCustomers);
}


function openMoreOptions(event) {
    const id = event.target.dataset.id;
    const email = event.target.dataset.email;
    const username = event.target.dataset.username;
    const firstName = event.target.dataset.firstname;
    const lastName = event.target.dataset.lastname;
    const phone = event.target.dataset.phone;

  // Hide the currently active popover if it exists
  if (activePopover) {
    activePopover.hide();
    bootstrap.Popover.getInstance(activePopover._element).dispose();
    activePopover = null;
  }

  const popoverContent = document.createElement("div");
  popoverContent.classList.add = "popover-body";
  popoverContent.innerHTML = `
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-email="${email}" data-username="${username}" data-firstName="${first_name || ''}" data-lastName="${last_name || ''}" data-phone="${phone || ''}">Edit</button>
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
  document.getElementById("editModalLabel").innerText = "Create Customer";
  document.getElementById("customer-email").value = "";
  document.getElementById("customer-username").value = "";
  document.getElementById("customer-first-name").value = "";
  document.getElementById("customer-last-name").value = "";
  document.getElementById("customer-phone").value = "";
  document.getElementById("customer-id").value = "";

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

  document.getElementById("editModalLabel").innerText = "Edit Customer";
  document.getElementById("customer-email").value = email;
  document.getElementById("customer-username").value = username;
  document.getElementById("customer-first-name").value = firstName ?? "";
  document.getElementById("customer-last-name").value = lastName ?? "";
  document.getElementById("customer-phone").value = phone ?? "";
  document.getElementById("customer-id").value = id;

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("customer-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function saveCustomer() {
  const email = document.getElementById("customer-email").value
  const username = document.getElementById("customer-username").value
  const firstName = document.getElementById("customer-first-name").value
  const lastName = document.getElementById("customer-last-name").value
  const phone = document.getElementById("customer-phone").value
  const id = document.getElementById("customer-id").value

  if (email) {
    if(!username) {
      showToast("Username is required", "error");
      return
    }
    const payload = JSON.stringify({ id, email, username, first_name: firstName, last_name: lastName, phone: phone});
    const method = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost/savoy-movie-booking/api/customer.php?id=${id}`
      : "http://localhost/savoy-movie-booking/api/customer.php";

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
        fetchCustomers();
      })
      .catch((error) => console.error("Error saving customer:", error))
      .finally(() => {
        setLoadingState(saveBtn, false, "Save");
      });
  } else {
    showToast("Email is required", "error");
  }
}

function deleteCustomer() {
  const id = document.getElementById("customer-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/customer.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchCustomers();
    })
    .catch((error) => console.error("Error deleting customer:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
