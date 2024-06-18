import { formatDate } from '../utils/helper'

document.addEventListener("DOMContentLoaded", function() {
    const loadingElement = document.getElementById('loading');
    const moviesContainer = document.getElementById('movies-container');

    fetchMovies();

    async function fetchMovies() {
        try {
            const response = await fetch('http://localhost/savoy-movie-booking/api/movie.php');
            const movies = await response.json();
            const categorizedMovies = categorizeMoviesByDate(movies.data);
            console.log("categorizedMovies", categorizedMovies)
            displayMovies(categorizedMovies);
        } catch (error) {
            console.error('Error fetching movies:', error);
        } finally {
            loadingElement.classList.add('d-none');
            moviesContainer.classList.remove('d-none');
        }
    }

    function categorizeMoviesByDate(movies) {
        const categorizedMovies = {};

        movies.forEach(movie => {
            movie.dates.forEach(date => {
                const dateKey = date.start_time.split(" ")[0]; // Use only the date part
                if (!categorizedMovies[dateKey]) {
                    categorizedMovies[dateKey] = [];
                }
                categorizedMovies[dateKey].push({ ...movie, start_time: date.start_time });
            });
        });

        return categorizedMovies;
    }

    function displayMovies(categorizedMovies) {
        const sortedDates = Object.keys(categorizedMovies).sort((a, b) => new Date(a) - new Date(b));

        sortedDates.forEach(date => {
            const movies = categorizedMovies[date];
            const dateContainer = document.createElement('div');
            dateContainer.className = 'movie-by-date-container';

            const dateTitleContainer = document.createElement('div');
            dateTitleContainer.className = 'movie-by-date-title-container';

            const dateTitle = document.createElement('h5');
            dateTitle.classList.add('date-title');
            dateTitle.textContent = formatDate(date);

            dateTitleContainer.appendChild(dateTitle);
            dateContainer.appendChild(dateTitleContainer);

            const moviesListContainer = document.createElement('div');
            moviesListContainer.className = 'movie-by-date-list';

            movies.forEach(movie => {
                const movieCard = createMovieCard(movie);
                moviesListContainer.appendChild(movieCard);
            });

            dateContainer.appendChild(moviesListContainer);
            moviesContainer.appendChild(dateContainer);
        });
    }

    function createMovieCard(movie) {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        const discountBadge = document.createElement('div');
        discountBadge.className = 'discount-badge';

        const link = document.createElement('a');
        link.href = `movie.html?id=${movie.id}`;

        const img = document.createElement('img');
        img.src = `data:image/jpeg;base64,${movie.image}`
        img.alt = movie.title;

        const movieDetails = document.createElement('div');
        movieDetails.className = 'movie-details';

        const movieTitle = document.createElement('div');
        movieTitle.className = 'movie-title';

        const movieInfo = document.createElement('div');

        const titleText = document.createElement('p');
        const spanTitle = document.createElement('span');
        spanTitle.className = 'movie-text';
        spanTitle.textContent = movie.name;
        titleText.appendChild(spanTitle);
        movieTitle.appendChild(titleText);

        const showDate = document.createElement('p');
        showDate.innerHTML = `Show Date: <span class="movie-text">${movie.start_time.split(" ")[0]}</span>`;

        const showTime = document.createElement('p');
        showTime.innerHTML = `Show Time: <span class="movie-text">${movie.start_time.split(" ")[1]}</span>`;

        const duration = document.createElement('p');
        duration.innerHTML = `Duration: <span class="movie-text">${movie.duration}</span>`;

        const price = document.createElement('p');
        price.innerHTML = `Price: <span class="movie-text">Rs ${movie?.promotion?.discount ? `<strike>${Number(movie.price)}</strike> => ${(Number(movie.price) - Number(movie.price)*(Number(movie.promotion.discount)/100))}` : `${movie.price}`}</span>`;

        const discount = document.createElement('p');
        discount.innerHTML = `<span class="movie-text">${movie?.promotion?.discount ? movie?.promotion?.discount : ""} %</span>`;
        discountBadge.appendChild(discount)

        movieInfo.appendChild(showDate);
        movieInfo.appendChild(showTime);
        movieInfo.appendChild(duration);
        movieInfo.appendChild(price);
        movieDetails.appendChild(movieTitle);
        movieDetails.appendChild(movieInfo);

        if(movie?.promotion?.discount) {
            movieCard.appendChild(discountBadge);
        }
  

        link.appendChild(img);
        link.appendChild(movieDetails);
        movieCard.appendChild(link);

        return movieCard;
    }
});
