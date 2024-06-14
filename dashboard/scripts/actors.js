import { setLoadingState, showToast, loadHTML } from "../../utils/helper";

let actors = [];
let isLoading = false;
let isToastAdded = false;
let existingImage = null;
const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const imageField = document.getElementById("image-field");
const imagePreview = document.getElementById("image-preview");
const previewImg = document.getElementById("preview-img");
const removeImageBtn = document.getElementById("remove-image-btn");
const actorImageInput = document.getElementById("actor-image");

document.addEventListener("DOMContentLoaded", fetchActors);
searchInput.addEventListener("input", filterActors);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveActor);
deleteBtn.addEventListener("click", deleteActor);
removeImageBtn.addEventListener("click", removeImage);
actorImageInput.addEventListener("change", handleImageChange);

function fetchActors() {
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
  fetch("http://localhost/savoy-movie-booking/api/actor.php")
    .then((response) => response.json())
    .then((data) => {
      actors = data.data || [];
      displayActors(actors);
    })
    .catch((error) => console.error("Error fetching actors:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">Loading...</td></tr>';
  } else if (actors.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="3" class="text-center">No actors available</td></tr>';
  }
}

function displayActors(actors) {
  tableBody.innerHTML = "";
  actors.forEach((actor, index) => {
    const avatar = actor.image
      ? `<img src="data:image/jpeg;base64,${actor.image}" class="avatar" alt="Avatar" />`
      : `<div class="avatar-placeholder">${actor.name.charAt(0).toUpperCase()}</div>`;

    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <td>${avatar}</td>
      <td>${actor.name}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${actor.id}" data-name="${actor.name}" data-image="${actor.image || ''}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterActors() {
  const query = searchInput.value.toLowerCase();
  const filteredActors = actors.filter((actor) =>
    actor.name.toLowerCase().includes(query)
  );
  displayActors(filteredActors);
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
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-name="${name}" data-image="${event.target.dataset.image}">Edit</button>
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
  document.getElementById("editModalLabel").innerText = "Create Actor";
  document.getElementById("actor-name").value = "";
  document.getElementById("actor-id").value = "";
  actorImageInput.value = "";
  imageField.classList.remove("d-none");
  imagePreview.classList.add("d-none");
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const image = event.target.dataset.image;
  
  document.getElementById("editModalLabel").innerText = "Edit Actor";
  document.getElementById("actor-name").value = name;
  document.getElementById("actor-id").value = id;

  if (image) {
    previewImg.src = `data:image/jpeg;base64,${image}`;
    existingImage =`data:image/jpeg;base64,${image}`;
    imageField.classList.add("d-none");
    imagePreview.classList.remove("d-none");
  } else {
    actorImageInput.value = "";
    imageField.classList.remove("d-none");
    imagePreview.classList.add("d-none");
  }

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("actor-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function handleImageChange() {
  const file = actorImageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      imageField.classList.add("d-none");
      imagePreview.classList.remove("d-none");
    };
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  actorImageInput.value = "";
  existingImage = null;
  imageField.classList.remove("d-none");
  imagePreview.classList.add("d-none");
}

function saveActor() {
  const name = document.getElementById("actor-name").value;
  const id = document.getElementById("actor-id").value;
  const image = actorImageInput.files[0];
  
  console.log("Image saved", image)
  if (name) {
    const formData = new FormData();
    formData.append("name", name);
    if(!existingImage) {
      showToast("Image is required", "error");
      return
    }
    if (image) {
      formData.append("image", image);
    }
    if (id) {
      formData.append("id", id);
    }

    const method = "POST";
    const url = id
      ? `http://localhost/savoy-movie-booking/api/actor.php?id=${id}`
      : "http://localhost/savoy-movie-booking/api/actor.php";

    setLoadingState(saveBtn, true, "Saving...");
    fetch(url, {
      method: method,
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("editModal")
        );
        modal.hide();
        fetchActors();
      })
      .catch((error) => console.error("Error saving actor:", error))
      .finally(() => {
        setLoadingState(saveBtn, false, "Save");
      });
  } else {
    showToast("Name is required", "error");
  }
}

function deleteActor() {
  const id = document.getElementById("actor-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/actor.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchActors();
    })
    .catch((error) => console.error("Error deleting actor:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}
