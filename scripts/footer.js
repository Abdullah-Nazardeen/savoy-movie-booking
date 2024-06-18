import { loadHTML } from "../utils/helper";

document.addEventListener("DOMContentLoaded", function () {
  loadHTML(
    "footer-container",
    "http://localhost/savoy-movie-booking/common/footer.html"
  );
  const currentPath = window.location.pathname.split("/").pop();
  setTimeout(() => {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      const linkPath = link.getAttribute("href").split("/").pop();
      console.log("linkPath: " + linkPath)
      console.log("currentPath: " + currentPath)
      if (linkPath === currentPath) {
        link.classList.add("selected");
      }
    });
  }, 300);
});
