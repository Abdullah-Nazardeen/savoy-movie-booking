import { formatDate, showToast, loadHTML } from "../utils/helper";
// Fetch query parameters from the URL
function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const date_id = urlParams.get("date_id");
  return { id, date_id };
}

// Fetch movie details from the API
async function fetchMovieDetails(id, date_id) {
  const url = `http://localhost/savoy-movie-booking/api/movie.php?id=${id}${
    date_id ? `&date_id=${date_id}` : ""
  }`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.status === "success") {
    return data.data;
  } else {
    throw new Error(data.message);
  }
}

function orderDates(datesWithIds) {
  // Sort the array of objects by date
  datesWithIds.sort(function (a, b) {
    return new Date(a.date) - new Date(b.date);
  });
  return datesWithIds;
}

function orderByCode(array) {
  // Helper function to extract the numeric part from the code
  function extractNumberFromCode(code) {
    const parts = code.split("-");
    return parseInt(parts[1], 10);
  }

  // Sort the array based on the numeric part of the code
  array.sort((a, b) => {
    const codeA = a.parking_code ? a.parking_code : a.seat_code;
    const codeB = b.parking_code ? b.parking_code : b.seat_code;

    const numberA = extractNumberFromCode(codeA);
    const numberB = extractNumberFromCode(codeB);

    return numberA - numberB;
  });

  return array;
}

let selectedDateId;
let movieData;
let filteredParkingData;
let addBtn, removeBtn, parkingCount;
let authData;

// Populate movie details into the HTML
function populateMovieDetails(movie) {
  const movieContent = document.getElementById("movie-content");
  const dates = movie.dates.map((date) => ({
    id: date.id,
    date: date.start_time,
  }));
  const orderedDates = orderDates(dates);

  movieContent.innerHTML = `
    <div class="movie-details">
      <div class="movie-poster-container">
        <img src="data:image/jpeg;base64,${
          movie.image
        }" alt="" class="image-poster" />
      </div>
      <div class="movie-info">
        <div class="title-container">
          <h2>${movie.name}</h2>
          <p class="price-title">Rs ${Number(movie.price)}.00</p>
        </div>
        <p>Show Dates: ${orderedDates
          .map(
            (date) =>
              `<span class="badge">${formatDate(
                date.date.split(" ")[0],
                date.date.split(" ")[1],
                { includeYear: false, includeTime: true }
              )}</span>`
          )
          .join("")}</p>
        <p>Category: ${movie.categories
          .map((category) => `<span class="badge">${category.name}</span>`)
          .join("")}</p>
        <p>Language: ${movie.languages
          .map((language) => `<span class="badge">${language.name}</span>`)
          .join("")}</p>
        <p>Duration: <span>${movie.duration}</span></p>
        <p>Description:</p>
        <p class="description">${movie.description}</p>
      </div>
    </div>
    <div class="actor-container">
      <h4>Actors</h4>
      <div class="MultiCarousel" data-items="1,3,5,6" data-slide="1" id="MultiCarousel" data-interval="1000">
        <div class="MultiCarousel-inner">
          ${movie.actors
            .map(
              (actor) => `
            <div class="item">
              <img src="data:image/jpeg;base64,${actor.image}" alt="" class="actor-image" />
              <p class="actor-name">${actor.name}</p>
            </div>
          `
            )
            .join("")}
        </div>
        <button class="btn btn-primary leftLst" title="left arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0" />
          </svg>
        </button>
        <button class="btn btn-primary rightLst" title="right arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708" />
          </svg>
        </button>
      </div>
    </div>
    <div class="date-container">
      <p class="show-time-title">Show Times</p>
      <div class="show-time-container">${orderedDates
        .map(
          (date, index) =>
            `<div class="show-time ${
              index === 0 ? "selected-time" : ""
            }" data-date-id="${date.id}"><p>${formatDate(
              date.date.split(" ")[0],
              date.date.split(" ")[1],
              { includeYear: false, includeTime: true }
            )}</p></div>`
        )
        .join("")}</div>
    </div>
    <div class="seating-booking-container">
      <div class="seating-info">
        <p>Available Seats</p>
        <div class="reserved-info-container">
          <div class="text-color-container">
            <p>Reserved</p>
            <div class="reserved-box"></div>
          </div>
          <div class="text-color-container">
            <p>Available</p>
            <div class="available-box"></div>
          </div>
        </div>
      </div>
      <div class="seating-structure">
        <div class="screen-container">
          <p>Screen</p>
          <div class="screen"></div>
        </div>
        ${generateSeatingStructure(orderByCode(movie.seating), orderedDates[0])}
      </div>
    </div>
    <div class="booking-form-container">
      <div class="booking-form">
        <div class="payment-form-container">
          <div class="parking-container">
            <p>Parking <span class="parking-price">(Rs ${
              movie.parking.price
            } per slot)</span></p>
            <div class="parking-form">
              <div class="custom-checkbox">
                <span class="parking-tickets-text">Add Parking Tickets <span class="parking-remaining">(${
                  movie["parking-slots"].filter(
                    (slot) =>
                      slot.status !== "booked" &&
                      slot.date_id == orderedDates[0].id
                  ).length
                } remaining)</span>:</span>
                <div class="quantity-controls ml-3">
                  <button type="button" class="btn btn-outline-secondary remove-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-dash" viewBox="0 0 16 16">
                      <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8" />
                    </svg>
                  </button>
                  <span class="mx-2">0</span>
                  <button type="button" class="btn btn-outline-secondary add-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-plus" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p class="booking-title">Payment Details</p>
          <div class="card">
            <img class="logo" src="./images/visa.png" />
            <label>Card Number</label>
            <input class="card-number" placeholder="1234 1234 1234 1234" type="text" required maxlength="16" />
            <div class="container2">
              <div class="name">
                <label>Card Holder</label>
                <input class="card-name" placeholder="BOB MARLEY" type="text" required />
              </div>
              <div class="expiration-date">
                <label>Exp. Date</label>
                <input class="card-name ex-date" placeholder="10/25" type="text" maxlength="5" required />
              </div>
              <div class="ccv">
                <label>CCV</label>
                <input class="card-name ccv-no" placeholder="123" type="text" maxlength="3" required />
              </div>
            </div>
          </div>
        </div>
        <div class="display-container">
          <p class="booking-title">Booking Details</p>
          <div class="booking-info">
            <div>
              <div class="key-value-pair">
                <p>Seat's Booked:</p>
                <p class="seat-badges"></p>
              </div>
              <div class="key-value-pair">
                <p>Parking Slot:</p>
                <p class="parking-badge"></p>
              </div>
            </div>
            <div>
              <div class="key-value-pair">
                <p>Movie Ticket Price:</p>
                <p class="movie-ticket-price">Rs 0.00</p>
              </div>
              <div class="key-value-pair">
                <p>Parking Ticket Price:</p>
                <p class="parking-ticket-price">Rs 0.00</p>
              </div>
              <div class="key-value-pair">
                <p>Total:</p>
                <p class="total-price">Rs 0.00</p>
              </div>
              <div class="payment-btn-container">
              ${
                authData?.id
                  ? `<button type="button" class="btn btn-primary payment-btn" id="add-schedule-btn">Checkout</button>`
                  : `<button type="button" class="btn btn-primary payment-btn" id="login-btn-1">Login</button>`
              }              
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (!authData?.id) {
    document.getElementById("login-btn-1").addEventListener("click", () => {
      window.location.href =
        "http://localhost/savoy-movie-booking/sign-in.html";
    });
  }
  initializeSeatSelection(movie.price);
  initializeParkingSelection(
    movie.parking.price,
    movie.parking.parking_capacity,
    orderedDates[0].id
  );
  initializeDateSelection(movie.dates, selectedDateId);

  // Initialize Bootstrap tooltips after DOM elements are rendered
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Generate seating structure based on the seating array
function generateSeatingStructure(seating, date = {}) {
  const sizes = [
    10, 14, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18,
    18, 18, 18,
  ];
  const filteredSeatingByDate = seating.filter(
    (seat) => seat.date_id == (selectedDateId ?? date.id)
  );
  let remainingSeats = filteredSeatingByDate.length;
  let seatGroups = [];
  while (remainingSeats > 0) {
    for (let size of sizes) {
      if (remainingSeats <= 0) break;
      seatGroups.push(
        filteredSeatingByDate.splice(0, Math.min(size, remainingSeats))
      );
      remainingSeats -= size;
    }
  }
  console.log("selectedDateId", selectedDateId);
  return seatGroups
    .map((group) => {
      let groupClass = "";
      switch (group.length) {
        case 10:
          groupClass = "ten-seat";
          break;
        case 14:
          groupClass = "fourteen-seat";
          break;
        case 18:
          groupClass = "eighteen-seat";
          break;
      }
      return `
        <div class="${groupClass}">
          ${group
            .map(
              (seat) => `<div class="seat ${
                seat.status === "booked" ? "booked" : ""
              }" data-seat-code="${
                seat.seat_code
              }" data-bs-toggle="tooltip" data-bs-placement="top"
              data-bs-custom-class="custom-tooltip"
              data-bs-title="${seat.seat_code}"></div>`
            )
            .join("")}
        </div>
      `;
    })
    .join("");
}

// Show or hide the loading UI
function showLoading(show) {
  document.getElementById("loading").classList.add("d-none");
  document.getElementById("main-content").classList.remove("d-none");
}

// Update booking details based on seat and parking selection
function updateBookingDetails(moviePrice, parkingPrice) {
  const selectedSeats = document.querySelectorAll(
    ".seating-structure .seat.selected"
  );
  const selectedParkingCount = parseInt(
    document.querySelector(".parking-form .quantity-controls span").innerText
  );

  const seatBadges = Array.from(selectedSeats)
    .map(
      (seat) =>
        `<span class="badge" data-seat-code="${seat.dataset.seatCode}">${seat.dataset.seatCode}</span>`
    )
    .join("");
  const parkingBadge = Array.from({ length: selectedParkingCount })
    .map(
      (_, i) =>
        `<span class="badge" data-parking-code="${filteredParkingData[i].parking_code}">${filteredParkingData[i].parking_code}</span>`
    )
    .join("");

  document.querySelector(".key-value-pair .seat-badges").innerHTML = seatBadges;
  document.querySelector(".key-value-pair .parking-badge").innerHTML =
    parkingBadge;

  const movieTicketPrice = selectedSeats.length * moviePrice;
  const parkingTicketPrice = selectedParkingCount * parkingPrice;

  document.querySelector(
    ".booking-info .movie-ticket-price"
  ).innerText = `Rs ${movieTicketPrice.toFixed(2)}`;
  document.querySelector(
    ".booking-info .parking-ticket-price"
  ).innerText = `Rs ${parkingTicketPrice.toFixed(2)}`;
  document.querySelector(".booking-info .total-price").innerText = `Rs ${(
    movieTicketPrice + parkingTicketPrice
  ).toFixed(2)}`;
}

// Add event listeners to seats for selection
function initializeSeatSelection(moviePrice) {
  const seats = document.querySelectorAll(
    ".seating-structure .seat:not(.booked)"
  );
  seats.forEach((seat) => {
    seat.addEventListener("click", () => {
      if (!seat.classList.contains("booked")) {
        seat.classList.toggle("selected");
        updateBookingDetails(moviePrice, getParkingPrice());
      }
    });
  });
}

// Initialize parking selection

function initializeParkingSelection(parkingPrice, parkingCapacity, dateId) {
  // Remove previous event listeners if they exist
  if (addBtn) addBtn.removeEventListener("click", handleAddClick);
  if (removeBtn) removeBtn.removeEventListener("click", handleRemoveClick);

  addBtn = document.querySelector(".add-btn");
  removeBtn = document.querySelector(".remove-btn");
  parkingCount = document.querySelector(
    ".parking-form .quantity-controls span"
  );

  addBtn.addEventListener("click", handleAddClick);
  removeBtn.addEventListener("click", handleRemoveClick);
}

function handleAddClick() {
  let count = parseInt(parkingCount.innerText);
  const filteredParking = movieData["parking-slots"].filter(
    (slot) => slot.date_id == selectedDateId && slot.status !== "booked"
  );
  filteredParkingData = orderByCode(filteredParking);
  if (count < filteredParkingData.length) {
    parkingCount.innerText = count + 1;
    updateBookingDetails(getMoviePrice(), getParkingPrice());
  }
}

function handleRemoveClick() {
  let count = parseInt(parkingCount.innerText);
  if (count > 0) {
    parkingCount.innerText = count - 1;
    updateBookingDetails(getMoviePrice(), getParkingPrice());
  }
}

// Initialize date selection
function initializeDateSelection(dates, dateId) {
  const dateContainers = document.querySelectorAll(".show-time");

  dateContainers.forEach((dateContainer) => {
    dateContainer.addEventListener("click", () => {
      dateContainers.forEach((container) =>
        container.classList.remove("selected-time")
      );
      dateContainer.classList.add("selected-time");
      selectedDateId = dateContainer.getAttribute("data-date-id");

      // Clear any selected parking or seating when the date changes
      document
        .querySelectorAll(".seat.selected")
        .forEach((seat) => seat.classList.remove("selected"));
      document.querySelector(
        ".parking-form .quantity-controls span"
      ).innerText = "0";

      // Update UI with filtered parking and seating
      updateParkingAndSeating();
    });
  });

  if (dateId) {
    const selectedDateContainer = document.querySelector(
      `.show-time[data-date-id="${dateId}"]`
    );
    if (selectedDateContainer) {
      selectedDateContainer.classList.add("selected-time");
      selectedDateId = dateId;
    }
  } else {
    dateContainers[0].classList.add("selected-time");
    selectedDateId = dateContainers[0].getAttribute("data-date-id");
  }
}

// Update parking and seating based on the selected date
function updateParkingAndSeating() {
  const filteredSeating = movieData.seating.filter(
    (seat) => seat.date_id == selectedDateId
  );
  const filteredParking = movieData["parking-slots"].filter(
    (slot) => slot.date_id == selectedDateId
  );

  const seatingStructure = document.querySelector(".seating-structure");
  seatingStructure.innerHTML = `<div class="screen-container">
  <p>Screen</p>
  <div class="screen"></div>
</div>${generateSeatingStructure(orderByCode(filteredSeating))}`;

  document.querySelector(".parking-remaining").innerText = `(${
    filteredParking.filter((slot) => slot.status !== "booked").length
  } remaining)`;

  initializeSeatSelection(movieData.price);
  initializeParkingSelection(
    movieData.parking.price,
    filteredParking.length,
    selectedDateId
  );
  updateBookingDetails(movieData.price, movieData.parking.price);

  // Initialize Bootstrap tooltips after DOM elements are updated
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.forEach((tooltipTriggerEl) => {
    new bootstrap.Tooltip(tooltipTriggerEl);
  });
}

// Get the current movie price
function getMoviePrice() {
  return parseFloat(
    document.querySelector(".price-title").innerText.replace("Rs ", "")
  );
}

// Get the current parking price
function getParkingPrice() {
  return parseFloat(
    document
      .querySelector(".parking-price")
      .innerText.replace("(Rs ", "")
      .replace(" per slot)", "")
  );
}

// Handle checkout button click
function handleCheckout(moviePrice, parkingPrice) {
  const checkoutButton = document.getElementById("add-schedule-btn");
  checkoutButton.addEventListener("click", async () => {
    const selectedSeats = Array.from(
      document.querySelectorAll(".seating-structure .seat.selected")
    ).map((seat) => ({
      seatCode: seat.dataset.seatCode,
    }));
    const selectedParkingCount = parseInt(
      document.querySelector(".parking-form .quantity-controls span").innerText
    );
    const selectedParkingSlots = filteredParkingData
      ?.slice(0, selectedParkingCount)
      .map((slot) => ({
        parkingCode: slot.parking_code,
      }));

    const bookingDetails = {
      seatsBooked: selectedSeats,
      parkingSlots: selectedParkingSlots,
      movieTicketPrice: selectedSeats.length * moviePrice,
      parkingTicketPrice: selectedParkingCount * parkingPrice,
      totalPrice:
        selectedSeats.length * moviePrice + selectedParkingCount * parkingPrice,
      selectedDateId: selectedDateId, 
    };

    console.log("Booking Details:", bookingDetails);

    // Capture payment details
    const paymentDetails = {
      name: document.querySelector(".card-name").value,
      cvv: document.querySelector(".ccv-no").value,
      bank_no: document.querySelector(".card-number").value,
      expire_date: document.querySelector(".ex-date").value,
      user_id: authData.id,
    };

    if (!paymentDetails.name) {
      showToast("Account name is required", "error");
      return;
    } else if (!paymentDetails.cvv) {
      showToast("CVV number is required", "error");
      return;
    } else if (!paymentDetails.bank_no) {
      showToast("Bank number is required", "error");
      return;
    } else if (!paymentDetails.expire_date) {
      showToast("Expire date is required", "error");
      return;
    } else if (bookingDetails.seatsBooked.length == 0) {
      showToast("Please select a seat", "error");
      return;
    }

    try {
      const paymentResponse = await fetch(
        "http://localhost/savoy-movie-booking/api/payment.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paymentDetails),
        }
      );

      const paymentResult = await paymentResponse.json();

      if (paymentResult.status === "success") {
        console.log("Payment created successfully:", paymentResult.data);

        // Create ticket only if payment is successful
        const ticketDetails = {
          user_id: authData.id,
          movie_id: parseInt(getQueryParams().id),
          status: "pending",
          final_price: bookingDetails.totalPrice,
          date: new Date().toISOString().split("T")[0],
          date_id: selectedDateId,
          seat_codes: bookingDetails.seatsBooked.map((seat) => seat.seatCode),
          parking_codes: bookingDetails.parkingSlots.map(
            (slot) => slot.parkingCode
          ),
        };

        const ticketResponse = await fetch(
          "http://localhost/savoy-movie-booking/api/ticket.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(ticketDetails),
          }
        );

        const ticketResult = await ticketResponse.json();

        if (ticketResult.status === "success") {
          console.log("Ticket created successfully:", ticketResult.data);
          showToast("Ticket has been booked", "success");
          setTimeout(()=>{
            window.location.href = "http://localhost/savoy-movie-booking/home.html"
          },1500)
        } else {
          console.error("Ticket creation failed:", ticketResult.message);
          showToast("Something went wrong, please try again later", "error");
        }
      } else {
        showToast("Something went wrong, please try again later", "error");
      }
    } catch (error) {
      showToast("Something went wrong, please try again later", "error");
    }
  });
}

// Initialize the script
document.addEventListener("DOMContentLoaded", async () => {
  loadHTML(
    "toast-placeholder",
    "http://localhost/savoy-movie-booking/common/toast.html"
  );
  const { id, date_id } = getQueryParams();
  authData = JSON.parse(localStorage.getItem("savoy-auth"));
  selectedDateId = date_id;
  if (!id) {
    console.error("Movie ID is missing from the URL");
    return;
  }
  showLoading(true);
  try {
    const movie = await fetchMovieDetails(id, date_id);
    movieData = movie;
    populateMovieDetails(movie);
    showLoading(false);
  } catch (error) {
    console.error("Failed to fetch movie details:", error);
    showLoading(false);
  }
  handleCheckout(getMoviePrice(), getParkingPrice());
});
