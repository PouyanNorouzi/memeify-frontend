import { API_LINK } from "./modules/apiLink.js";
import { logout } from "./modules/auth.js";

const API_ADMIN_BASE = `${API_LINK}/api/admin`;
const TOKEN_KEY = "memeify_token";
const TOKEN_USER = "memeify_user";
const ADMIN_ROLE_ID = 1;
const API_CALL_LIMIT = 20;

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
  const userText = localStorage.getItem(TOKEN_USER);
  if (!userText) return null;
  return JSON.parse(userText);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function handleResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const errMessage =
      (payload && (payload.error || payload.message)) ||
      payload ||
      res.statusText;
    throw new Error(
      typeof errMessage === "string" ? errMessage : JSON.stringify(errMessage),
    );
  }
  return payload;
}

function setStatus(msg, color = "#b00") {
  const s = document.getElementById("status");
  s.textContent = msg;
  s.style.color = color;
}

function createCell(text) {
  const td = document.createElement("td");
  td.textContent = text ?? "";
  return td;
}

function getIdFromUser(user) {
  return user._id || user.id || user.userId || "";
}

async function fetchUsers() {
  const token = getToken();
  if (!token) {
    setStatus("No token found. Please login as admin.", "#b00");
    return [];
  }

  const res = await fetch(`${API_ADMIN_BASE}/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const payload = await handleResponse(res);
  // server returns { users: [...] }
  return payload.users || [];
}

async function fetchStats() {
  const token = getToken();
  if (!token) {
    setStatus("No token found. Please login as admin.", "#b00");
    return [];
  }

  const res = await fetch(`${API_ADMIN_BASE}/stats`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const payload = await handleResponse(res);
  // server returns { stats: [...] }
  return payload.stats || [];
}

async function promoteUser(userId) {
  const token = getToken();
  if (!token) throw new Error("Missing token");
  const res = await fetch(`${API_ADMIN_BASE}/users/${userId}/promote`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return await handleResponse(res);
}

async function deleteUser(userId) {
  const token = getToken();
  if (!token) throw new Error("Missing token");
  const res = await fetch(`${API_ADMIN_BASE}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  return await handleResponse(res);
}

function renderStats(stats) {
  const tbody = document.getElementById("statsBody");
  tbody.innerHTML = "";

  if (!stats || stats.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "No endpoint statistics available.";
    td.style.opacity = "0.8";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  stats.forEach((stat) => {
    const tr = document.createElement("tr");
    tr.appendChild(createCell(stat.method));
    tr.appendChild(createCell(stat.endpoint));
    tr.appendChild(createCell(stat.requestCount));
    tbody.appendChild(tr);
  });
}

function renderUsers(users) {
  const tbody = document.getElementById("usersBody");
  tbody.innerHTML = "";

  if (!users || users.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 4;
    td.textContent = "No users found.";
    td.style.opacity = "0.8";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  users.forEach((u) => {
    if (u.id === getCurrentUser().id) return;
    const tr = document.createElement("tr");
    console.log(u)

    tr.appendChild(createCell(u.username));
    tr.appendChild(createCell(u.email));
    tr.appendChild(createCell(u.roles.map((r) => r.roleType).join(", ")));
    tr.appendChild(createCell(`${u.apiCalls}/${API_CALL_LIMIT}`))

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    if (!u.roles.map((r) => r.id).includes(ADMIN_ROLE_ID)) {
      const promoteBtn = document.createElement("button");
      promoteBtn.className = "btn btn-promote";
      promoteBtn.textContent = "Promote";
      promoteBtn.addEventListener("click", async () => {
        if (!confirm(`Promote ${u.username} to admin?`)) return;
        try {
          setStatus("Promoting...", "#333");
          const id = getIdFromUser(u);
          const result = await promoteUser(id);
          setStatus(result.message || "Promoted.", "green");
          await reloadUsers();
        } catch (err) {
          setStatus(err.message || "Promote failed");
          console.error("Promote error:", err);
        }
      });
      actionsTd.appendChild(promoteBtn);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete user ${u.username}? This cannot be undone.`)) return;
      try {
        setStatus("Deleting...", "#333");
        const id = getIdFromUser(u);
        const result = await deleteUser(id);
        setStatus(result.message || "Deleted.", "green");
        await reloadUsers();
      } catch (err) {
        setStatus(err.message || "Delete failed");
        console.error("Delete error:", err);
      }
    });

    actionsTd.appendChild(deleteBtn);
    tr.appendChild(actionsTd);

    tbody.appendChild(tr);
  });
}

async function reloadUsers() {
  try {
    setStatus("Loading users...", "#333");
    const users = await fetchUsers();
    renderUsers(users);
    setStatus(""); // clear status
  } catch (err) {
    setStatus(err.message || "Failed to load users");
    console.error("Fetch users error:", err);
  }
}

async function reloadStats() {
  try {
    const stats = await fetchStats();
    renderStats(stats);
  } catch (err) {
    console.error("Fetch stats error:", err);
  }
}

async function reloadAll() {
  await reloadStats();
  await reloadUsers();
}

document.addEventListener("DOMContentLoaded", () => {
  if(!getToken() || !getCurrentUser()) {
    alert("user not logged in");
    window.location.href = "login.html";
  }

  if (!getCurrentUser().roles.map(r => r.id).includes(ADMIN_ROLE_ID)) {
    alert("you are not an admin");
    window.location.href = "user.html";
  }

  const refreshBtn = document.getElementById("refreshBtn");
  const userPageBtn = document.getElementById("userPageBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  refreshBtn.addEventListener("click", () => {
    reloadAll();
  });

  userPageBtn.addEventListener("click", () => {
    window.location.href = "user.html";
  });

  logoutBtn.addEventListener("click", () => {
    logout().then(() => (window.location.href = "index.html"));
  });

  // initial load
  reloadAll();
});
