import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let feedbacks = [];
let isLoading = false;
let isToastAdded = false;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const deleteBtn = document.getElementById("delete-btn");

document.addEventListener("DOMContentLoaded", fetchFeedbacks);
searchInput.addEventListener("input", filterFeedbacks);
deleteBtn.addEventListener("click", deleteFeedback);

function fetchFeedbacks() {
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
  fetch("http://localhost/savoy-movie-booking/api/feedback.php")
    .then((response) => response.json())
    .then((data) => {
      feedbacks = data.data || [];
      displayFeedbacks(feedbacks);
    })
    .catch((error) => console.error("Error fetching feedbacks:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
  } else if (feedbacks.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4" class="text-center">No feedbacks available</td></tr>';
  }
}

function displayFeedbacks(feedbacks) {
    tableBody.innerHTML = "";
    feedbacks.forEach((feedback, index) => {
      const truncatedComment =
        feedback.comment.length > 50
          ? feedback.comment.substring(0, 50) + "..."
          : feedback.comment;
  
      const row = document.createElement("tr");
      row.classList.add("table-row");
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <td>${feedback.email}</td>
        <td>${truncatedComment}</td>
        <td>
          <i class="bi bi-three-dots table-more-option-btn" data-id="${
            feedback.id
          }" data-email="${feedback.email}" data-comment="${feedback.comment}" tabindex="0"></i>
        </td>
      `;
      tableBody.appendChild(row);
    });
  
    document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
      btn.addEventListener("click", openMoreOptions);
    });
  }
  
function filterFeedbacks() {
  const query = searchInput.value.toLowerCase();
  const filteredFeedbacks = feedbacks.filter((feedback) =>
    feedback.name.toLowerCase().includes(query)
  );
  displayFeedbacks(filteredFeedbacks);
}

let activePopover = null;
function openMoreOptions(event) {
  const id = event.target.dataset.id;
  const email = event.target.dataset.email;
  const comment = event.target.dataset.comment;
console.log("COMMENT: " + comment)
  // Hide the currently active popover if it exists
  if (activePopover) {
    activePopover.hide();
    bootstrap.Popover.getInstance(activePopover._element).dispose();
    activePopover = null;
  }

  const popoverContent = document.createElement("div");
  popoverContent.classList.add = "popover-body";
  popoverContent.innerHTML = `
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-email="${email}" data-comment="${comment}">View</button>
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

function openEditModal(event) {
  const id = event.target.dataset.id;
  const comment = event.target.dataset.comment;
  console.log("EDIT COMMENT", comment)
  document.getElementById("editModalLabel").innerText = "View Feedback";
  document.getElementById("comment").value = comment;
  document.getElementById("feedback-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("feedback-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function deleteFeedback() {
  const id = document.getElementById("feedback-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/feedback.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchFeedbacks();
    })
    .catch((error) => console.error("Error deleting feedback:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
