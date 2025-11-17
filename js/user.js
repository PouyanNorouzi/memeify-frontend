import { logout } from "./modules/auth.js";
import { API_LINK } from "./modules/apiLink.js";

const ADMIN_ROLE_ID = 1;
const API_CAPTION_BASE = `${API_LINK}/api/caption`;

// Authentication Check
const userInfoString = localStorage.getItem("memeify_user");
if (!userInfoString) {
  alert("You are not logged in");
  window.location.href = "login.html";
}

const user = JSON.parse(userInfoString);
document.getElementById("userEmail").innerText = user.username;

// Logout Handler
document.getElementById("logout").onclick = () => {
  logout().then(() => (window.location.href = "index.html"));
};

// Admin Role UI
if (user.roles.map((r) => r.id).includes(ADMIN_ROLE_ID)) {
  document.getElementById("admin-link").style.display = "block";
}

// Caption Generation Logic
document.getElementById("generateBtn").addEventListener("click", async () => {
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload an image first!");
    return;
  }

  // Preview
  const previewImg = document.getElementById("previewImg");
  previewImg.src = URL.createObjectURL(file);
  document.getElementById("resultSection").style.display = "block";
  document.getElementById("captionResult").textContent = "Generating...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const token = localStorage.getItem("memeify_token");
    console.log("All localStorage keys:", Object.keys(localStorage));
    console.log("Token value:", token);

    if (!token) {
      alert("Please log in first!");
      document.getElementById("captionResult").textContent = "Error: Not authenticated.";
      return;
    }

    const response = await fetch(API_CAPTION_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in first.");
      }
      throw new Error("Failed to generate caption.");
    }

    const data = await response.json();
    document.getElementById("captionResult").textContent = data.caption;
  } catch (error) {
    document.getElementById("captionResult").textContent = "Error generating caption.";
    console.error(error);
  }
});
