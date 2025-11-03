import { signup } from "./modules/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const emailInput = document.getElementById("email");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const messageEl = document.getElementById("message");
  const submitBtn = form.querySelector('button[type="submit"]');

  function setMessage(text, color = "#b00") {
    messageEl.textContent = text;
    messageEl.style.color = color;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "Creating..." : "Register";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("");
    const email = (emailInput.value || "").trim();
    const username = (usernameInput.value || "").trim();
    const password = passwordInput.value || "";

    // Basic client-side validation
    if (!email) return setMessage("Please provide an email.");
    if (!username) return setMessage("Please choose a username.");
    if (!password || password.length < 6)
      return setMessage("Password must be at least 6 characters.");

    setLoading(true);

    try {
      // Call the signup helper from your modules/auth.js
      // Expected to POST { username, email, password } to /api/auth/create
      const result = await signup(username, email, password);

      // Successful signup returns { user, token } per server implementation
      setMessage("Account created — redirecting to login...", "green");

      // Small delay to let user see the message, then redirect to login page
      setTimeout(() => {
        window.location.href = "user.html";
      }, 1000);

      console.log("Signup success:", result);
    } catch (err) {
      // err may be an Error object thrown by your auth module's fetch wrapper
      setMessage(err?.message || "Registration failed.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  });
});
