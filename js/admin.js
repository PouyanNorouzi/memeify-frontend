import { API_LINK } from "./modules/apiLink.js";

const API_ADMIN_BASE = `${API_LINK}/api/admin`;
const TOKEN_KEY = "memeify_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
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
      typeof errMessage === "string" ? errMessage : JSON.stringify(errMessage)
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

async function promoteUser(userId) {
  const token = getToken();
  if (!token) throw new Error("Missing token");
  const res = await fetch(`${API_ADMIN_BASE}/promote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  return await handleResponse(res);
}

async function deleteUser(userId) {
  const token = getToken();
  if (!token) throw new Error("Missing token");
  const res = await fetch(`${API_ADMIN_BASE}/delete`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  return await handleResponse(res);
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
    const tr = document.createElement("tr");

    const username = u.username ?? u.userName ?? u.name ?? "(no username)";
    tr.appendChild(createCell(username));
    tr.appendChild(createCell(u.email ?? ""));

    // Show roles in friendly way if available
    let rolesText = "";
    if (Array.isArray(u.roles)) {
      // roles might be array of role objects or ids
      rolesText = u.roles
        .map((r) => {
          if (!r) return "";
          if (typeof r === "string" || typeof r === "number") return String(r);
          // if role is object with name field
          if (r.name) return r.name;
          if (r.role) return r.role;
          return JSON.stringify(r);
        })
        .filter(Boolean)
        .join(", ");
    } else {
      rolesText = String(u.roles ?? "");
    }
    tr.appendChild(createCell(rolesText));

    const actionsTd = document.createElement("td");
    actionsTd.className = "actions";

    const promoteBtn = document.createElement("button");
    promoteBtn.className = "btn btn-promote";
    promoteBtn.textContent = "Promote";
    promoteBtn.addEventListener("click", async () => {
      if (!confirm(`Promote ${username} to admin?`)) return;
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

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete user ${username}? This cannot be undone.`)) return;
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

    actionsTd.appendChild(promoteBtn);
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

document.addEventListener("DOMContentLoaded", () => {
  const refreshBtn = document.getElementById("refreshBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  refreshBtn.addEventListener("click", () => {
    reloadUsers();
  });

  logoutBtn.addEventListener("click", () => {
    clearToken();
    setStatus("Token cleared. Reload to login.", "#333");
  });

  // initial load
  reloadUsers();
});
