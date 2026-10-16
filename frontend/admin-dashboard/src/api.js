// All backend calls for the admin dashboard live here.
export const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

const TOKEN_KEY = "citylens_admin_token";
const USER_KEY = "citylens_admin_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getSavedAdmin = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body, form, auth = true } = {}) {
  const headers = {};
  let payload;

  if (form) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    payload = new URLSearchParams(form).toString();
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth && getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { method, headers, body: payload });
  } catch {
    throw new ApiError(`Cannot reach the backend at ${API_URL}. Is it running?`, 0);
  }

  if (!response.ok) {
    let message = "Something went wrong.";
    try {
      const data = await response.json();
      if (typeof data.detail === "string") message = data.detail;
      else if (Array.isArray(data.detail)) message = data.detail.map((d) => d.msg).join(", ");
    } catch {
      /* not JSON */
    }
    if (response.status === 401 && auth) logout();
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export async function login(email, password) {
  const data = await request("/auth/login", {
    method: "POST",
    auth: false,
    form: { username: email.trim().toLowerCase(), password },
  });

  if (data.role !== "admin") {
    throw new ApiError("This account is not an admin account.", 403);
  }

  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: data.user_id, name: data.name, email: data.email })
  );
  return data;
}

export const signupAdmin = ({ name, email, password, adminCode }) =>
  request("/auth/register-admin", {
    method: "POST",
    auth: false,
    body: { name, email: email.trim().toLowerCase(), password, admin_code: adminCode },
  });

export const getEmergencies = () => request("/emergencies");
export const getIncidents = () => request("/incidents");
export const getFloodRisks = () => request("/flood-risk");

export const getFloodForecast = (observations) =>
  request("/ml/flood-forecast", {
    method: "POST",
    body: { observations },
  });

export const setEmergencyStatus = (id, status) =>
  request(`/emergencies/${id}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
  });

export const setIncidentStatus = (id, status) =>
  request(`/incidents/${id}/status?status=${encodeURIComponent(status)}`, {
    method: "PATCH",
  });

export function openAdminSocket() {
  const wsUrl = API_URL.replace(/^http/, "ws");
  return new WebSocket(`${wsUrl}/ws/admin?token=${encodeURIComponent(getToken() || "")}`);
}


export async function getIncidentEvidence(id) {
  const token = getToken();

  if (!token) {
    throw new ApiError("Please log in as an admin.", 401);
  }

  let response;

  try {
    response = await fetch(
      `${API_URL}/incidents/${id}/evidence`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch {
    throw new ApiError("Cannot reach the backend.", 0);
  }

  if (!response.ok) {
    if (response.status === 401) logout();

    throw new ApiError(
      response.status === 403
        ? "Admin access is required to view evidence."
        : response.status === 404
          ? "No evidence image was found for this report."
          : "Could not load incident evidence.",
      response.status
    );
  }

  return URL.createObjectURL(await response.blob());
}


export const reviewIncidentVerification = (id, decision, reason) =>
  request(`/incidents/${id}/verification`, {
    method: "PATCH",
    body: { decision, reason },
  });
