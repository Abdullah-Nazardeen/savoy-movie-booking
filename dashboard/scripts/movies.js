import { setLoadingState, showToast, loadHTML } from "../../utils/helper";
import { MultiSelect } from "../../scripts/multi-select";

let movies = [];
let isLoading = false;
let isToastAdded = false;
let existingImage = null;
let scheduleCount = 1;
let selectedCategories = [];
let selectedActors = [];

const tableBody = document.getElementById("table-body");
const searchInput = document.getElementById("search-input");
const createBtn = document.getElementById("create-btn");
const saveBtn = document.getElementById("save-btn");
const deleteBtn = document.getElementById("delete-btn");
const imageField = document.getElementById("image-field");
const imagePreview = document.getElementById("image-preview");
const previewImg = document.getElementById("preview-img");
const removeImageBtn = document.getElementById("remove-image-btn");
const movieImageInput = document.getElementById("movie-image");
const addScheduleBtn = document.getElementById("add-schedule-btn");
const scheduleContainer = document.getElementById("movie-schedule-container");

document.addEventListener("DOMContentLoaded", fetchMovies);
searchInput.addEventListener("input", filterMovies);
createBtn.addEventListener("click", openCreateModal);
saveBtn.addEventListener("click", saveMovie);
deleteBtn.addEventListener("click", deleteMovie);
removeImageBtn.addEventListener("click", removeImage);
movieImageInput.addEventListener("change", handleImageChange);
addScheduleBtn.addEventListener("click", addScheduleRow);

function fetchMovies() {
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
  fetch("http://localhost/savoy-movie-booking/api/movie.php")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      movies = data.data || [];
      displayMovies(movies);
    })
    .catch((error) => console.error("Error fetching movies:", error))
    .finally(() => {
      isLoading = false;
      setLoadingUI(false);
    });
}

function setLoadingUI(isLoading) {
  if (isLoading) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
  } else if (movies.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">No movies available</td></tr>';
  }
}

function displayMovies(movies) {
  tableBody.innerHTML = "";

  movies.forEach((movie, index) => {
    const categoryIds = movie.categories.map((cat) => cat.id);
    const actorIds = movie.actors.map((actor) => actor.id);
    const dateIdArray = movie.dates.map((date) => date.id);
    const startTimeArray = movie.dates.map((date) => date.start_time);
    console.log("movie.description",movie.description)
    const avatar = movie.image
      ? `<img src="data:image/jpeg;base64,${movie.image}" class="avatar" alt="Avatar" />`
      : `<div class="avatar-placeholder">${movie.name
          .charAt(0)
          .toUpperCase()}</div>`;

    const categories = movie.categories
      .slice(0, 3)
      .map((category) => `<span class="badge">${category}</span>`)
      .join("");
    const categoriesBadge =
      movie.categories.length > 3 ? `<span class="badge">...</span>` : "";

    const actors = movie.actors
      .slice(0, 3)
      .map((actor) => `<span class="badge">${actor}</span>`)
      .join("");
    const actorsBadge =
      movie.actors.length > 3 ? `<span class="badge">...</span>` : "";

    const dates = movie.dates
      .slice(0, 2)
      .map((date) => `<span class="badge">${date.start_time}</span>`)
      .join("");
    const datesBadge =
      movie.dates.length > 2 ? `<span class="badge">...</span>` : "";

    const row = document.createElement("tr");
    row.classList.add("table-row");
    row.innerHTML = `
      <td>${avatar}</td>
      <td>${movie.name}</td>
      <td>${movie.screen.name}</td>
      <td>${movie.price}</td>     
      <td>${movie?.promotion?.discount ?? "None"}${movie?.promotion?.discount ? "%" : ""}</td>
      <td>${dates}${datesBadge}</td>
      <td>
        <i class="bi bi-three-dots table-more-option-btn" data-id="${
          movie.id
        }" data-name="${movie.name}" data-price="${
      movie.price
    }" data-description="${movie.description}" data-duration="${
      movie.duration
    }" data-image="${movie.image || ""}" data-promotion="${
      movie?.promotion_id ?? ""
    }" data-language="${movie.language_id}" data-screen="${
      movie.screen_id
    }" data-date="${dateIdArray}" data-time="${startTimeArray}" data-category="${categoryIds}" data-actor="${actorIds}" tabindex="0"></i>
      </td>
    `;
    tableBody.appendChild(row);
  });

  document.querySelectorAll(".table-more-option-btn").forEach((btn) => {
    btn.addEventListener("click", openMoreOptions);
  });
}

function filterMovies() {
  const query = searchInput.value.toLowerCase();
  const filteredMovies = movies.filter((movie) =>
    movie.name.toLowerCase().includes(query)
  );
  displayMovies(filteredMovies);
}

let activePopover = null;
function openMoreOptions(event) {
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const price = event.target.dataset.price;
  const description = event.target.dataset.description;
  console.log("description", description)
  const duration = event.target.dataset.duration;
  const promotion = event.target.dataset.promotion;
  const language = event.target.dataset.language;
  const screen = event.target.dataset.screen;
  const dateIds = event.target.dataset.date;
  const startTimes = event.target.dataset.time;
  const category = event.target.dataset.category;
  const actor = event.target.dataset.actor;
  const image = event.target.dataset.image;

  if (activePopover) {
    activePopover.hide();
    bootstrap.Popover.getInstance(activePopover._element).dispose();
    activePopover = null;
  }

  const popoverContent = document.createElement("div");
  popoverContent.classList.add = "popover-body";
  popoverContent.innerHTML = `
      <button class="dropdown-item edit-btn text-primary" data-id="${id}" data-name="${name}" data-price="${price}" data-description="${description}" data-duration="${duration}" data-image="${image}" data-promotion="${promotion}" data-language="${language}" data-screen="${screen}" data-date="${dateIds}" data-time="${startTimes}" data-category="${category}" data-actor="${actor}">Edit</button>
      <button class="dropdown-item delete-btn text-destruction" data-id="${id}">Delete</button>
    `;

  const popover = new bootstrap.Popover(event.target, {
    content: popoverContent,
    html: true,
    placement: "left",
  });

  popover.show();
  activePopover = popover;

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

  document.addEventListener("click", (e) => {
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

function resetFields() {
  selectedActors = [];
  selectedCategories = [];
  document.getElementById("editModalLabel").innerText = "Create Movie";
  document.getElementById("movie-name").value = "";
  document.getElementById("movie-price").value = "";
  document.getElementById("movie-description").value = "";
  document.getElementById("movie-duration").value = "";
  document.getElementById("movie-id").value = "";
  movieImageInput.value = "";
  imageField.classList.remove("d-none");
  imagePreview.classList.add("d-none");
  existingImage = null;
  // Reset the schedule container
  scheduleContainer.innerHTML = `
    <div class="row mb-3" id="schedule-row-1">
      <div class="col-md-6">
        <label for="schedule-date-1" class="form-label text-primary">Date</label>
        <input type="date" class="form-control no-glow" id="schedule-date-1"/>
      </div>
      <div class="col-md-5">
        <label for="schedule-time-1" class="form-label text-primary">Time</label>
        <input type="hidden" id="schedule-id-1" />
        <select class="form-select no-glow" id="schedule-time-1">
          <option value="9:00 am - 1:00 pm">9:00 am - 1:00 pm</option>
          <option value="1:00 pm - 5:00 pm">1:00 pm - 5:00 pm</option>
          <option value="5:00 pm - 9:00 pm">5:00 pm - 9:00 pm</option>
        </select>
      </div>
      <div class="col-md-1 d-flex align-items-end">
        <button type="button" class="btn btn-danger btn-sm" id="delete-schedule-btn-1" disabled>
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `;
  scheduleCount = 1;
}

function openCreateModal() {
  resetFields();
  fetchDropdownData();
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openEditModal(event) {
  resetFields();
  const id = event.target.dataset.id;
  const name = event.target.dataset.name;
  const price = event.target.dataset.price;
  const description = event.target.dataset.description;
  const duration = event.target.dataset.duration;
  const image = event.target.dataset.image;
  const promotion = event.target.dataset.promotion;
  const language = event.target.dataset.language;
  const screen = event.target.dataset.screen;
  const dateIds = event.target.dataset.date;
  const startTimes = event.target.dataset.time;
  const category = event.target.dataset.category;
  const actor = event.target.dataset.actor;
  const dateArray = dateIds.split(",");
  const startTimesArray = startTimes.split(",");
  console.log("ACTOR ====", actor);
  console.log("CATEGORY ====", category);
  selectedActors = [...actor.split(",")];
  selectedCategories = [...category.split(",")];

  const existingDates = dateArray.flatMap((id, index) => {
    return { id: id, start_time: startTimesArray[index] };
  });

  console.log("dateArray", existingDates);
  existingDates.forEach((date, index) => {
    const year = date.start_time.split(" ")[0];
    const time = date.start_time.split(" ")[1];
    console.log("date.id", date.id);
    console.log("year", year);
    console.log("time", time);
    let timeInterval;
    if (time === "09:00:00") {
      timeInterval = "9:00 am - 1:00 pm";
    } else if (time === "13:00:00") {
      timeInterval = "1:00 pm - 5:00 pm";
    } else if (time === "17:00:00") {
      timeInterval = "5:00 pm - 9:00 pm";
    }
    if (dateArray.length - 1 !== index) {
      addScheduleRow();

      document.getElementById(`schedule-id-${index + 1}`).value = date.id;
      document.getElementById(`schedule-time-${index + 1}`).value =
        timeInterval;
      document.getElementById(`schedule-date-${index + 1}`).value = year;
    } else {
      document.getElementById(`schedule-id-${index + 1}`).value = date.id;
      document.getElementById(`schedule-time-${index + 1}`).value =
        timeInterval;
      document.getElementById(`schedule-date-${index + 1}`).value = year;
    }
  });

  document.getElementById("editModalLabel").innerText = "Edit Movie";
  document.getElementById("movie-name").value = name;
  document.getElementById("movie-price").value = price;
  document.getElementById("movie-description").value = description;
  document.getElementById("movie-duration").value = duration;
  document.getElementById("movie-id").value = id;
  if (image) {
    previewImg.src = `data:image/jpeg;base64,${image}`;
    existingImage = `data:image/jpeg;base64,${image}`;
    imageField.classList.add("d-none");
    imagePreview.classList.remove("d-none");
  } else {
    movieImageInput.value = "";
    imageField.classList.remove("d-none");
    imagePreview.classList.add("d-none");
  }
  fetchDropdownData(category, actor, language, screen, promotion);
  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

function openDeleteModal(event) {
  const id = event.target.dataset.id;
  document.getElementById("movie-id").value = id;
  const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
  modal.show();
}

function handleImageChange() {
  const file = movieImageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      imageField.classList.add("d-none");
      imagePreview.classList.remove("d-none");
    };
    reader.readAsDataURL(file);
  }
}

function removeImage() {
  movieImageInput.value = "";
  existingImage = null;
  imageField.classList.remove("d-none");
  imagePreview.classList.add("d-none");
}

function addScheduleRow() {
  scheduleCount++;
  const row = document.createElement("div");
  row.classList.add("row", "mb-3");
  row.id = `schedule-row-${scheduleCount}`;
  row.innerHTML = `
    <div class="col-md-6">

      <input type="date" class="form-control no-glow" id="schedule-date-${scheduleCount}"/>
    </div>
    <div class="col-md-5">
      <input type="hidden" id="schedule-id-${scheduleCount}" />
      <select class="form-select no-glow" id="schedule-time-${scheduleCount}">
        <option value="9:00 am - 1:00 pm">9:00 am - 1:00 pm</option>
        <option value="1:00 pm - 5:00 pm">1:00 pm - 5:00 pm</option>
        <option value="5:00 pm - 9:00 pm">5:00 pm - 9:00 pm</option>
      </select>
    </div>
    <div class="col-md-1 d-flex align-items-end">
      <button type="button" class="btn btn-danger btn-sm delete-schedule-btn">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;
  scheduleContainer.appendChild(row);
  row.querySelector(".delete-schedule-btn").addEventListener("click", () => {
    scheduleContainer.removeChild(row);
  });
}

function saveMovie() {
  const name = document.getElementById("movie-name").value;
  const price = document.getElementById("movie-price").value;
  const description = document.getElementById("movie-description").value;
  const duration = document.getElementById("movie-duration").value;
  const id = document.getElementById("movie-id").value;
  const language = document.getElementById("movie-language").value;
  const screen = document.getElementById("movie-screen").value;
  const promotion = document.getElementById("movie-promotion").value;
  const image = movieImageInput.files[0];
  const schedules = [];

  for (let i = 1; i <= scheduleCount; i++) {
    const date = document.getElementById(`schedule-date-${i}`).value;
    const timeRange = document.getElementById(`schedule-time-${i}`).value;
    const id = document.getElementById(`schedule-id-${i}`).value;

    if (date && timeRange) {
      const [startTime, endTime] = timeRange.split(" - ");
      console.log(
        "`${date} ${convertTime(startTime)}`",
        `${date} ${convertTime(startTime)}`
      );
      const startTimestamp = new Date(
        `${date} ${convertTime(startTime)}`
      ).toISOString();
      const endTimestamp = new Date(
        `${date} ${convertTime(endTime)}`
      ).toISOString();
      schedules.push({
        id: id,
        start_time: startTimestamp,
        end_time: endTimestamp,
      });
    }
  }

  if (
    name &&
    price &&
    duration &&
    language &&
    description &&
    screen &&
    (image || existingImage) &&
    selectedCategories.length &&
    selectedActors.length &&
    schedules.length
  ) {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);
    formData.append("description", description);
    formData.append("duration", duration);
    formData.append("language_id", language);
    formData.append("screen_id", screen);
    formData.append("promotion_id", promotion);
    formData.append("category_ids", selectedCategories.join(","));
    formData.append("actor_ids", selectedActors.join(","));
    formData.append("dates", JSON.stringify(schedules));
    if (image) {
      formData.append("image", image);
    }
    if (id) {
      formData.append("id", id);
    }
    const method = "POST";
    const url = id
      ? `http://localhost/savoy-movie-booking/api/movie.php?id=${id}`
      : "http://localhost/savoy-movie-booking/api/movie.php";

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
        fetchMovies();
      })
      .catch((error) => console.error("Error saving movie:", error))
      .finally(() => {
        setLoadingState(saveBtn, false, "Save");
      });
  } else {
    if(!name) {
      showToast("Name is required", "error");
    } else if (!price) {
      showToast("Price is required", "error");
    } else if (!duration) {
      showToast("Duration is required", "error");
    } else if (!language) {
      showToast("Language is required", "error");
    } else if (!description) {
      showToast("Description is required", "error");
    } else if (!screen) {
      showToast("Screen is required", "error");
    } else if (!(image || existingImage)) {
      showToast("Movie image is required", "error");
    } else if (!selectedCategories.length) {
      showToast("Category is required", "error");
    } else if (!selectedActors.length) {
      showToast("Actor is required", "error");
    } else if (!schedules.length) {
      showToast("Movie schedule is required", "error");
    } else {
      showToast("All fields is required", "error");
    }
  }
}

function convertTime(time) {
  if (time === "9:00 am") {
    return "14:30";
  } else if (time === "1:00 pm") {
    return "18:30";
  } else if (time === "5:00 pm") {
    return "22:30";
  } else if (time === "9:00 pm") {
    return "02:30";
  }
}

function convertTo24Time(time) {
  const [timePart, modifier] = time.split(" ");
  console.log("TIMEPART", timePart, modifier);
  let [hours, minutes] = timePart.split(":");
  if (hours === "12") {
    hours = "00";
  }
  if (modifier === "pm") {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}`;
}

function deleteMovie() {
  const id = document.getElementById("movie-id").value;
  setLoadingState(deleteBtn, true, "Deleting...");
  fetch(`http://localhost/savoy-movie-booking/api/movie.php?id=${id}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("deleteModal")
      );
      modal.hide();
      fetchMovies();
    })
    .catch((error) => console.error("Error deleting movie:", error))
    .finally(() => {
      setLoadingState(deleteBtn, false, "Delete");
    });
}

function fetchDropdownData(
  existingCategoryIds = [],
  existingActorIds = [],
  languageId = "",
  screenId = "",
  promotionId = ""
) {
  fetch("http://localhost/savoy-movie-booking/api/category.php")
    .then((response) => response.json())
    .then((data) => {
      // Initialize the MultiSelect dropdown for categories
      new MultiSelect("#movie-category", {
        data: data.data.map((category) => {
          const isSelected = existingCategoryIds.includes(category.id);
          return {
            value: category.id,
            text: category.name,
            ...(isSelected && { selected: true }),
          };
        }),
        placeholder: "Select categories",
        search: true,
        selectAll: false,
        listAll: true,
        onSelect: (value) => {
          selectedCategories.push(value);
        },
        onUnselect: (value) => {
          selectedCategories = selectedCategories.filter((id) => id !== value);
        },
      });
    });

  fetch("http://localhost/savoy-movie-booking/api/actor.php")
    .then((response) => response.json())
    .then((data) => {
      // Initialize the MultiSelect dropdown for actors
      new MultiSelect("#movie-actors", {
        data: data.data.map((actor) => {
          const isSelected = existingActorIds.includes(actor.id);
          return {
            value: actor.id,
            text: actor.name,
            ...(isSelected && { selected: true }),
          };
        }),
        placeholder: "Select actors",
        search: true,
        selectAll: false,
        listAll: true,
        onSelect: (value) => {
          selectedActors.push(value);
        },
        onUnselect: (value) => {
          selectedActors = selectedActors.filter((id) => id !== value);
        },
      });
    });

  fetch("http://localhost/savoy-movie-booking/api/language.php")
    .then((response) => response.json())
    .then((data) => {
      const languageSelect = document.getElementById("movie-language");
      languageSelect.innerHTML = data.data
        .map((language, index) => {
          const isSelected = language.id === languageId;
          if (index === 0) {
            return `<option value="" disabled selected>Select movie language</option><option value="${
              language.id
            }" ${isSelected ? "selected" : ""}>${language.name}</option>`;
          } else {
            return `<option value="${language.id}" ${
              isSelected ? "selected" : ""
            }>${language.name}</option>`;
          }
        })
        .join("");
    });

  fetch("http://localhost/savoy-movie-booking/api/promotion.php")
    .then((response) => response.json())
    .then((data) => {
      const promotionSelect = document.getElementById("movie-promotion");
      promotionSelect.innerHTML = data.data
        .map((promotion, index) => {
          const isSelected = promotion.id === promotionId;
          if(index === 0) {
            return `<option value="" disabled selected>Select promotion</option><option value="">None</option><option value="${promotion.id}" ${
              isSelected ? "selected" : ""
            }>${promotion.name}</option>`;
          } else {
            return `<option value="${promotion.id}" ${
              isSelected ? "selected" : ""
            }>${promotion.name}</option>`;
          }
        })
        .join("");
    });

  fetch("http://localhost/savoy-movie-booking/api/screen.php")
    .then((response) => response.json())
    .then((data) => {
      const screenSelect = document.getElementById("movie-screen");
      screenSelect.innerHTML = data.data
        .map((screen, index) => {
          const isSelected = screen.id === screenId;
          if(index === 0) {
            return `<option value="" disabled selected>Select screen</option><option value="${screen.id}" ${
              isSelected ? "selected" : ""
            }>${screen.name}</option>`;
          } else {
            return `<option value="${screen.id}" ${
              isSelected ? "selected" : ""
            }>${screen.name}</option>`;
          }
          
        })
        .join("");
    });
}
