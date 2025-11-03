import { login } from "./modules/auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
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
    submitBtn.textContent = isLoading ? "Logging in..." : "Login";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMessage("");

    const username = (usernameInput.value || "").trim();
    const password = passwordInput.value || "";

    if (!username) return setMessage("Please enter your username.");
    if (!password) return setMessage("Please enter your password.");

    setLoading(true);
    try {
      // `login(username, password)` is expected to POST to /api/auth/login
      // and save token/user (per your auth module) or return the payload.
      const result = await login(username, password);

      setMessage("Logged in successfully.", "green");

      setTimeout(() => {
        window.location.href = "user.html";
      }, 700);

      console.log("Login success:", result);
    } catch (err) {
      setMessage(err?.message || "Login failed.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  });
});
