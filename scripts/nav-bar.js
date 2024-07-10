import {
  setLoadingState,
  showToast,
  loadHTML,
  capitalizeFirstLetter,
} from "../utils/helper";

let activePopover = null;
let authData = null;
let tickets = [];

document.addEventListener("DOMContentLoaded", function () {
  loadHTML(
    "nav-container",
    "http://localhost/savoy-movie-booking/common/nav-bar.html"
  );

  setTimeout(() => {
    loadHTML(
      "toast-placeholder",
      "http://localhost/savoy-movie-booking/common/toast.html"
    );

    const currentPath = window.location.pathname.split("/").pop();

    // Check if the current URL is the search page
    if (
      window.location.href ===
      "http://localhost/savoy-movie-booking/search.html"
    ) {
      // Add class 'search' to the middle-nav element
      const middleNav = document.querySelector(".nav-middle");
      middleNav.classList.add("search");

      // Add class 'd-none' to the nav-links element
      const navLinks = document.querySelector(".nav-links");
      navLinks.classList.add("d-none");

      // Remove class 'form-select' from the select elements
      const selectElements = document.querySelectorAll(".form-select");
      selectElements.forEach((select) => select.classList.remove("d-none"));

      // Populate the select fields with values from the API
      populateSelectField(
        "http://localhost/savoy-movie-booking/api/category.php",
        "#categories",
        "Category"
      );
      populateSelectField(
        "http://localhost/savoy-movie-booking/api/language.php",
        "#languages",
        "Language"
      );
      populateSelectField(
        "http://localhost/savoy-movie-booking/api/actor.php",
        "#actors",
        "Actor"
      );
    } else {
      document.querySelector(".search-bar").addEventListener("click", () => {
        window.location.href =
          "http://localhost/savoy-movie-booking/search.html";
      });
    }

    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      const linkPath = link.getAttribute("href").split("/").pop();
      if (linkPath === currentPath) {
        link.classList.add("selected");
      }
    });

    // Check local storage for user data
    authData = JSON.parse(localStorage.getItem("savoy-auth"));
    const loginNavContainer = document.getElementById("login-nav-container");

    if (authData) {
      loginNavContainer.innerHTML = `
      ${
        authData.user_level === "customer"
          ? `
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        fill="currentColor"
        class="bi bi-ticket-perforated-fill"
        viewBox="0 0 16 16"
        id="nav-tickets"
      >
        <path
          d="M0 4.5A1.5 1.5 0 0 1 1.5 3h13A1.5 1.5 0 0 1 16 4.5V6a.5.5 0 0 1-.5.5 1.5 1.5 0 0 0 0 3 .5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 11.5V10a.5.5 0 0 1 .5-.5 1.5 1.5 0 1 0 0-3A.5.5 0 0 1 0 6zm4-1v1h1v-1zm1 3v-1H4v1zm7 0v-1h-1v1zm-1-2h1v-1h-1zm-6 3H4v1h1zm7 1v-1h-1v1zm-7 1H4v1h1zm7 1v-1h-1v1zm-8 1v1h1v-1zm7 1h1v-1h-1z"
        />
      </svg>`
          : "<a href='/savoy-movie-booking/dashboard/movies.html' class='nav-link'>Dashboard</a>"
      }
        <button id="user-btn" class="nav-icon">${authData.username}</button>
      `;

      const userBtn = document.getElementById("user-btn");
      const feedbackLink = document.getElementById("feedback-nav");

      feedbackLink.addEventListener("click", (e) => {
        e.preventDefault();
        openFeedbackModal();
      });

      const popoverContent = document.createElement("div");
      popoverContent.classList.add = "popover-body";
      popoverContent.innerHTML = `
      ${
        authData.user_level === "customer"
          ? `<button class="dropdown-item edit-btn text-primary" id="edit-profile-btn">Edit Profile</button>`
          : ""
      }
      <button class="dropdown-item logout-btn text-destruction" id="logout-btn">Logout</button>
    `;

      const popover = new bootstrap.Popover(userBtn, {
        content: popoverContent,
        html: true,
        placement: "bottom",
        trigger: "click",
      });

      userBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activePopover) {
          activePopover.hide();
        }
        popover.show();
        activePopover = popover;
      });

      // Logout logic
      document.body.addEventListener("click", (e) => {
        const target = e.target;
        if (target && target.id === "logout-btn") {
          localStorage.removeItem("savoy-auth");
          window.location.reload();
        }
      });

      // Edit profile logic
      document.body.addEventListener("click", (e) => {
        const target = e.target;
        if (target && target.id === "edit-profile-btn") {
          openEditProfileModal(authData);
          if (activePopover) {
            activePopover.hide();
          }
        }
      });

      // Close popover when clicking outside
      document.addEventListener("click", (e) => {
        if (!userBtn.contains(e.target) && activePopover) {
          activePopover.hide();
          activePopover = null;
        }
      });

      // Fetch and display tickets when the ticket icon is clicked
      const ticketIcon = document.getElementById("nav-tickets");
      if (ticketIcon) {
        ticketIcon.addEventListener("click", (e) => {
          e.preventDefault();
          fetchTickets(authData.id);
        });
      }

      function openFeedbackModal() {
        const modal = new bootstrap.Modal(
          document.getElementById("feedbackModal")
        );
        modal.show();
      }

      setTimeout(() => {
        const sendBtn = document.getElementById("send-btn");
        sendBtn.addEventListener("click", () => {
          sendFeedback();
        });
      }, 300);

      function sendFeedback() {
        const comment = document.getElementById("comment").value;
        const authData = JSON.parse(localStorage.getItem("savoy-auth"));

        if (!comment) {
          showToast("Comment is required", "error");
          return;
        }

        const payload = JSON.stringify({
          comment: comment,
          email: authData.email,
          user_id: authData.id,
        });

        const url = "http://localhost/savoy-movie-booking/api/feedback.php";

        const sendBtn = document.getElementById("send-btn");
        setLoadingState(sendBtn, true, "Sending...");
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: payload,
        })
          .then((response) => response.json())
          .then((data) => {
            const modal = bootstrap.Modal.getInstance(
              document.getElementById("feedbackModal")
            );
            modal.hide();
            if (data.status === "success") {
              showToast("Thank you for your feedback", "success");
            } else {
              showToast(data.message, "error");
            }
          })
          .catch((error) => {
            console.error("Error sending feedback:", error);
            showToast("Error sending feedback", "error");
          })
          .finally(() => {
            setLoadingState(sendBtn, false, "Send");
          });
      }
    } else {
      loginNavContainer.innerHTML = `<a id="login-nav-link" href="/savoy-movie-booking/sign-in.html"><button id="login-btn">Login</button></a>`;
    }
  }, 500);
});

function openEditProfileModal(user) {
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  document.getElementById("user-email").value = user.email;
  document.getElementById("user-username").value = user.username;
  document.getElementById("user-first-name").value = user.first_name ?? "";
  document.getElementById("user-last-name").value = user.last_name ?? "";
  document.getElementById("user-phone").value = user.phone ?? "";
  document.getElementById("user-id").value = user.id;
  modal.show();
}

setTimeout(() => {
  const saveBtn = document.getElementById("save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveUserProfile();
    });
  }
}, 300);

function saveUserProfile() {
  const email = document.getElementById("user-email").value;
  const username = document.getElementById("user-username").value;
  const firstName = document.getElementById("user-first-name").value;
  const lastName = document.getElementById("user-last-name").value;
  const phone = document.getElementById("user-phone").value;
  const id = document.getElementById("user-id").value;

  if (email) {
    if (!username) {
      showToast("Username is required", "error");
      return;
    }
    const payload = JSON.stringify({
      id,
      first_name: firstName,
      last_name: lastName,
      phone: phone,
    });
    const method = "PUT";
    const url = `http://localhost/savoy-movie-booking/api/user.php?id=${id}`;

    const saveBtn = document.getElementById("save-btn");
    setLoadingState(saveBtn, true, "Saving...");
    fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
    })
      .then((response) => response.json())
      .then((data) => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("editModal")
        );
        modal.hide();
        if (data.status === "success") {
          // Update local storage with the new user data

          authData = {
            id: id,
            email: email,
            username: username,
            user_level: "customer",
            first_name: firstName,
            last_name: lastName,
            phone: phone,
          };

          localStorage.setItem("savoy-auth", JSON.stringify(authData));
          showToast("Profile updated successfully", "success");
        } else {
          showToast(data.message, "error");
        }
      })
      .catch((error) => {
        console.error("Error saving user profile:", error);
        showToast("Error saving profile", "error");
      })
      .finally(() => {
        setLoadingState(saveBtn, false, "Save changes");
      });
  } else {
    showToast("Email is required", "error");
  }
}

function fetchTickets(userId) {
  setLoadingUI(true);
  fetch(`http://localhost/savoy-movie-booking/api/ticket.php?id=${userId}`)
    .then((response) => response.json())
    .then((data) => {
      tickets = data.data || [];
      displayTickets(tickets);
      openOffcanvas();
    })
    .catch((error) => console.error("Error fetching tickets:", error))
    .finally(() => setLoadingUI(false));
}

function setLoadingUI(isLoading) {
  const offcanvasBody = document.querySelector(".offcanvas-body");
  if (isLoading) {
    offcanvasBody.innerHTML = '<div class="text-center">Loading...</div>';
  } else if (tickets.length === 0) {
    offcanvasBody.innerHTML =
      '<div class="text-center">No tickets available</div>';
  }
}

function displayTickets(tickets) {
  const offcanvasBody = document.querySelector(".offcanvas-body");
  offcanvasBody.innerHTML = "";

  tickets.forEach((ticket) => {
    const ticketCard = document.createElement("div");
    ticketCard.classList.add("ticket-card", "mb-3", "p-3", "border", "rounded");

    const seatCodes = ticket.seat_codes ? ticket.seat_codes.split(",") : [];
    const parkingCodes = ticket.parking_codes
      ? ticket.parking_codes.split(",")
      : [];

    ticketCard.innerHTML = `
      <div class="d-flex justify-content-between">
        <h5>${ticket.movie_name}</h5>
        <span>${ticket.date}</span>
      </div>
      <div class="ticket-card-row">
      <p><strong>Seats:</strong> ${seatCodes
        .map((code) => `<span class="badge bg-primary me-1">${code}</span>`)
        .join("")}</p>
      </div>
      <div class="ticket-card-row">
      <p><strong>Parking:</strong> ${parkingCodes
        .map((code) => `<span class="badge bg-secondary me-1">${code}</span>`)
        .join("")}</p>
      </div>
      <div class="d-flex justify-content-between ticket-card-row">
        <p><strong>Price:</strong> <span>Rs ${ticket.final_price}</span></p>
        <span class="badge bg-info ${
          ticket.status == "rejected"
            ? "reject-badge"
            : ticket.status == "pending"
            ? "pending-badge"
            : "accept-badge"
        }">${capitalizeFirstLetter(ticket.status)}</span>
      </div>
    `;
    offcanvasBody.appendChild(ticketCard);
  });
}

function openOffcanvas() {
  const offcanvas = new bootstrap.Offcanvas(
    document.getElementById("offcanvasDark")
  );
  offcanvas.show();
}

function populateSelectField(apiUrl, selectId, label) {
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      const select = document.querySelector(selectId);
      const allOption = document.createElement("option");
      const labelOption = document.createElement("option");
      labelOption.value = "";
      labelOption.textContent = label;
      labelOption.selected = true;
      labelOption.disabled = true;
      allOption.value = "";
      allOption.textContent = "All";
      select.appendChild(labelOption);
      select.appendChild(allOption);
      if (select && data && data.data) {
        data.data.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.id;
          option.textContent = item.name;
          select.appendChild(option);
        });
      }
    })
    .catch((error) =>
      console.error(`Error fetching data from ${apiUrl}:`, error)
    );
}
