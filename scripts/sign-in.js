import { validateEmail } from "../utils/validate";
import { loadHTML, setLoadingState, showToast } from "../utils/helper";

document.addEventListener("DOMContentLoaded", function () {
  loadHTML("toast-placeholder", "http://localhost/savoy-movie-booking/common/toast.html");
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const submitButton = loginForm.querySelector('button[type="submit"]');
      const submitButtonText = submitButton.textContent;
      setLoadingState(submitButton, true, "Loading...");
      console.log("validateEmail(email)", validateEmail(email));
      if (validateEmail(email)) {
        try {
          const response = await fetch(
            "http://localhost/savoy-movie-booking/api/auth/login.php",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email, password }),
            }
          );
          const data = await response.json();
          if (data.status === "success") {
            setLoadingState(submitButton, false, submitButtonText);
            showToast("Logged In");
            setTimeout(() => {
              window.location.href =
                "http://localhost/savoy-movie-booking/dashboard/tickets.html";
            }, 1000);
          } else {
            showToast(data.message, "error");
            setLoadingState(submitButton, false, submitButtonText);
          }
        } catch (error) {
          setLoadingState(submitButton, false, submitButtonText);
          showToast("Something went wrong", "error");
          console.error("Error:", error);
        }
      } else {
        console.log("RUNNINGGGGGGGGGG", validateEmail(email));
        setLoadingState(submitButton, false, submitButtonText);
        showToast("Please enter a valid email address.", "error");
      }
    });
  }
});
