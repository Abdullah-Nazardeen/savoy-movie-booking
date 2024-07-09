import { setLoadingState, showToast, loadHTML, capitalizeFirstLetter } from "../../utils/helper";

let ticket = [];
let isLoading = false;
let isToastAdded = false;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");

document.addEventListener("DOMContentLoaded", fetchTicket);
searchInput.addEventListener("input", filterTicket);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveTicket);
deleteBtn.addEventListener("click", deleteTicket);

function fetchTicket() {
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
  fetch("http://localhost/savoy-movie-booking/api/ticket.php")
    .then((response) => response.json())
    .then((data) => {
      ticket = data.data || [];
      displayTicket(ticket);
    })
    .catch((error) => console.error("Error fetching ticket:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="8" class="text-center">Loading...</td></tr>';
  } else if (ticket.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="8" class="text-center">No ticket available</td></tr>';
  }
}

function displayTicket(ticket) {
  tableBody.innerHTML = "";
  ticket.forEach((ticket, index) => {
    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <th scope="row">${index + 1}</th>
      <td>${ticket.user_email}</td>
      <td>${ticket.movie_name}</td>
      <td>${ticket?.seat_codes?.split(",").length}</td>
      <td>${
        ticket?.parking_codes?.split(",").length
          ? ticket?.parking_codes?.split(",").length
          : 0
      }</td>
      <td>${ticket.final_price}</td>
      <td>${ticket.date}</td>
      <td>${
        ticket.status !== "pending"
          ? `<span class="badge ${ticket.status == "rejected" ? "reject-badge" : "accept-badge"}">${capitalizeFirstLetter(ticket.status)}</span>`
          : `<div class="status-icons-container" data-id="${
            ticket.id
          }"><i class="bi bi-check-square-fill accept-booking"></i><i class="bi bi-x-square-fill reject-booking"></i></div>`
      }
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".accept-booking").forEach((btn) => {
    btn.addEventListener("click", () => saveTicket("accept", btn));
  });

  document.querySelectorAll(".reject-booking").forEach((btn) => {
    btn.addEventListener("click", () => saveTicket("reject", btn));
  });
}

function filterTicket() {
  const query = searchInput.value.toLowerCase();
  const filteredTicket = ticket.filter((ticket) =>
    ticket.name.toLowerCase().includes(query)
  );
  displayTicket(filteredTicket);
}

function saveTicket(type, btn) {
  const id = btn.closest(".status-icons-container").dataset.id;
  if (id) {
    const method = "PUT";
    const url = `http://localhost/savoy-movie-booking/api/ticket.php?id=${id}`;
    const payload = JSON.stringify({ id, status: type === "accept" ? "Accepted" : "rejected" });
    setLoadingState(saveBtn, true, "Saving...");
    fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: payload,
    })
      .then((response) => response.json())
      .then((data) => {
        fetchTicket();
      })
      .catch((error) => console.error("Error saving ticket:", error))
      .finally(() => {
        setLoadingState(saveBtn, false, "Save");
      });
  } else {
    console.log("ID is missing")
  }
}
