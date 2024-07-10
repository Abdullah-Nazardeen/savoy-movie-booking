import { formatDate } from "../utils/helper";

document.addEventListener("DOMContentLoaded", function () {
  const loadingElement = document.getElementById("loading");
  const moviesContainer = document.getElementById("movies-container");

  let movies = [];

  fetchMovies();

  async function fetchMovies() {
    try {
      const response = await fetch(
        "http://localhost/savoy-movie-booking/api/movie.php"
      );
      const data = await response.json();
      movies = data.data;
      displayMovies(movies);
    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      loadingElement.classList.add("d-none");
      moviesContainer.classList.remove("d-none");
    }
  }

  function filterMovies() {
    const searchQuery = document
      .getElementById("search-input")
      .value.toLowerCase();
    const category = document.getElementById("categories").value;
    const language = document.getElementById("languages").value;
    const actor = document.getElementById("actors").value;

    return movies.filter((movie) => {
      const matchesSearch = movie.name.toLowerCase().includes(searchQuery);
      const matchesCategory = category
        ? movie.categories.some((cat) => cat.id == category)
        : true;
      const matchesLanguage = language
        ? movie.languages.some((lang) => lang.id == language)
        : true;
      const matchesActor = actor
        ? movie.actors.some((act) => act.id == actor)
        : true;

      return (
        matchesSearch && matchesCategory && matchesLanguage && matchesActor
      );
    });
  }

  function displayMovies(movies) {
    const filteredMovies = filterMovies(movies);
    const moviesContainer = document.getElementById("movie-list");
    moviesContainer.innerHTML = "";

    filteredMovies.forEach((movie) => {
      const movieCard = createMovieCard(movie);
      moviesContainer.appendChild(movieCard);
    });
  }

  function createMovieCard(movie) {
    const movieCard = document.createElement("div");
    movieCard.className = "movie-card";

    const discountBadge = document.createElement("div");
    discountBadge.className = "discount-badge";

    const link = document.createElement("a");
    link.href = `movie.html?id=${movie.id}`;

    const img = document.createElement("img");
    img.src = `data:image/jpeg;base64,${movie.image}`;
    img.alt = movie.title;

    const movieDetails = document.createElement("div");
    movieDetails.className = "movie-details";

    const movieTitle = document.createElement("div");
    movieTitle.className = "movie-title";

    const movieInfo = document.createElement("div");

    const titleText = document.createElement("p");
    const spanTitle = document.createElement("span");
    spanTitle.className = "movie-text";
    spanTitle.textContent = movie.name;
    titleText.appendChild(spanTitle);
    movieTitle.appendChild(titleText);

    const duration = document.createElement("p");
    duration.innerHTML = `Duration: <span class="movie-text">${movie.duration}</span>`;

    const price = document.createElement("p");
    price.innerHTML = `Price: <span class="movie-text">Rs ${
      movie?.promotion?.discount
        ? `<strike>${Number(movie.price)}</strike> => ${
            Number(movie.price) -
            Number(movie.price) * (Number(movie.promotion.discount) / 100)
          }`
        : `${movie.price}`
    }</span>`;

    const discount = document.createElement("p");
    discount.innerHTML = `<span class="movie-text">${
      movie?.promotion?.discount ? movie?.promotion?.discount : ""
    } %</span>`;
    discountBadge.appendChild(discount);

    movieInfo.appendChild(duration);
    movieInfo.appendChild(price);
    movieDetails.appendChild(movieTitle);
    movieDetails.appendChild(movieInfo);

    if (movie?.promotion?.discount) {
      movieCard.appendChild(discountBadge);
    }

    link.appendChild(img);
    link.appendChild(movieDetails);
    movieCard.appendChild(link);

    return movieCard;
  }

  setTimeout(() => {
    // Event listeners for search and filter functionality
    document.getElementById("search-input").addEventListener("input", () => {
      displayMovies(movies);
    });

    document.getElementById("categories").addEventListener("change", () => {
      displayMovies(movies);
    });

    document.getElementById("languages").addEventListener("change", () => {
      displayMovies(movies);
    });

    document.getElementById("actors").addEventListener("change", () => {
      displayMovies(movies);
    });
  }, [1000]);
});
