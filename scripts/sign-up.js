import { validateEmail, validatePassword } from "../utils/validate";
import { loadHTML, setLoadingState, showToast } from "../utils/helper";

document.addEventListener("DOMContentLoaded", function () {
  loadHTML("toast-placeholder", "http://localhost/savoy-movie-booking/common/toast.html");
  const registerForm = document.getElementById("registerForm");

  if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
      event.preventDefault();

      const email = document.getElementById('regEmail').value;
      const username = document.getElementById('username').value;
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      const submitButton = registerForm.querySelector('button[type="submit"]');
      const submitButtonText = submitButton.textContent;

      setLoadingState(submitButton, true, "Loading...");

      if (validateEmail(email) && username.length > 0 && validatePassword(password, confirmPassword).valid) {
        try {
          const response = await fetch('http://localhost/savoy-movie-booking/api/auth/register.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, username, password, user_level: "admin" })
          });
          const data = await response.json();
          if(data.status === "success") {
            setLoadingState(submitButton, false, submitButtonText);
            showToast('Registered successfully');
            setTimeout(() => {
              window.location.href = "http://localhost/savoy-movie-booking/sign-in.html"
            }, 1000);
          } else {
            showToast(data.message, "error");
            setLoadingState(submitButton, false, submitButtonText);
          }
          
        } catch (error) {
          setLoadingState(submitButton, false, submitButtonText);
          showToast('Something went wrong', 'error');
          console.error('Error:', error);
        }
      } else {
        setLoadingState(submitButton, false, submitButtonText);
        if(!validateEmail(email)) {
          showToast('E-mail is not valid', 'error');
        } else if (username.length === 0) {
          showToast('Username is required', 'error');
        } else if (!validatePassword(password, confirmPassword).valid) {
          showToast(validatePassword(password, confirmPassword).message, 'error');
        }
        }
        
    });
  }
});
