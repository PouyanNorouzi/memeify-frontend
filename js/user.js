import { logout } from "./modules/auth.js";

const ADMIN_ROLE_ID = 1;

const userInfoString = localStorage.getItem("memeify_user");
if (!userInfoString) {
  alert("You are not logged in");
  window.location.href = "login.html";
}

const user = JSON.parse(userInfoString);

document.getElementById("userEmail").innerText = user.username;

document.getElementById("logout").onclick = () => {
  logout().then(() => (window.location.href = "index.html"));
};

if (user.roles.map((r) => r.id).includes(ADMIN_ROLE_ID)) {
  document.getElementById("admin-link").style.display = "block";
}
