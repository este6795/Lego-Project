import { getToken, removeToken } from "./tokenStorage";

export const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(
  path,
  { method = "GET", body, headers = {} } = {},
) {
  const isFormData = body instanceof FormData;
  const finalHeaders = { ...headers };
  const token = getToken();
  if (token) {
    finalHeaders["Authorization"] = `Token ${token}`;
  }

  if (body && !isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const csrfToken = getCsrfToken();
  if (method !== "GET" && csrfToken) {
    finalHeaders["X-CSRFToken"] = csrfToken;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body && !isFormData ? JSON.stringify(body) : body,
    credentials: "include",
  });

  const contentType = response.headers.get("Content-Type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      console.warn("Unauthorized request, removing token");
      removeToken();
    }
    const message =
      data?.detail || data?.error || `Request failed (${response.status})`;
    throw new ApiError(message, response.status, data);
  }
  return data;
}
