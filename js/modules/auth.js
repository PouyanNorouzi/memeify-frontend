import { API_LINK } from "./apiLink.js";

const API_AUTH_BASE = `${API_LINK}/api/auth`;
const API_USER_BASE = `${API_LINK}/api/users`;
const TOKEN_KEY = "memeify_token";
const USER_KEY = "memeify_user";

/* ---- token helpers ---- */
function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ---- helper to parse fetch responses ---- */
async function handleResponse(res) {
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    // Error might be a string or object
    const errMsg =
      (payload && payload.error) ||
      (payload && payload.message) ||
      payload ||
      res.statusText;
    throw new Error(errMsg);
  }
  return payload;
}

/* ---- API functions ---- */
export async function login(username, password) {
  const res = await fetch(`${API_AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const payload = await handleResponse(res);
  // Expecting: { user, token }
  if (payload.token) saveToken(payload.token);
  if (payload.user)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return payload;
}

export async function signup(username, email, password) {
  const res = await fetch(`${API_AUTH_BASE}/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const payload = await handleResponse(res);
  if (payload.token) saveToken(payload.token);
  if (payload.user)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return payload;
}

export async function verify() {
  const token = getToken();
  if (!token) throw new Error("No token stored");
  const res = await fetch(`${API_AUTH_BASE}/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await handleResponse(res);
  // server returns { user, token: newToken }
  if (payload.token) saveToken(payload.token);
  if (payload.user)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  return payload;
}

export async function logout() {
  const token = getToken();
  // Call logout endpoint (your server returns success even if it doesn't clear a server-side session)
  await fetch(`${API_AUTH_BASE}/logout`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  clearToken();
  return true;
}

export async function getUser(userId) {
  const token = getToken();
  const res = await fetch(`${API_USER_BASE}/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await handleResponse(res);
  localStorage.setItem(USER_KEY, JSON.stringify(payload));
  return payload;
}

/* ---- utility for authenticated requests to other APIs ---- */
function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
