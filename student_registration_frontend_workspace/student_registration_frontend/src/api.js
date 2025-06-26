//
// API utility for communicating with the student registration backend.
//
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3001";

// Helper to handle JSON and errors
async function apiFetch(url, { method = "GET", body, token, contentType, ...rest } = {}) {
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (body && (contentType || method !== "GET")) {
    headers["Content-Type"] = contentType || "application/json";
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? (headers["Content-Type"] === "application/json" ? JSON.stringify(body) : body) : undefined,
    ...rest,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { detail: "Unknown error (invalid JSON)" };
  }

  if (!response.ok) {
    throw data;
  }
  return data;
}

// PUBLIC_INTERFACE
export async function signup(email, password) {
  /** Register a new student. Returns user object, or throws on error. */
  return apiFetch("/signup", { method: "POST", body: { email, password } });
}

// PUBLIC_INTERFACE
export async function login(email, password) {
  /** Authenticate a student, returns { access_token, token_type } */
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);
  return apiFetch("/token", {
    method: "POST",
    body: params,
    contentType: "application/x-www-form-urlencoded",
  });
}

// PUBLIC_INTERFACE
export async function submitApplication(appBody, token) {
  /** Submit an application as an authenticated user. */
  return apiFetch("/applications/", { method: "POST", body: appBody, token });
}

// PUBLIC_INTERFACE
export async function getMyApplications(token) {
  /** List all applications belonging to the current student. */
  return apiFetch("/applications/", { method: "GET", token });
}

// PUBLIC_INTERFACE
export async function getApplicationStatus(applicationId, token) {
  /** Get status for a specific application (by ID). */
  return apiFetch(`/applications/${applicationId}/status`, { method: "GET", token });
}

// PUBLIC_INTERFACE
export async function healthCheck() {
  /** Check backend health */
  return apiFetch("/health");
}
