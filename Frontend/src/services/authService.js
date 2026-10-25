import { apiRequest } from "./api";
import { setToken, removeToken } from "./tokenStorage";

export async function login(email, password) {
  const data = await apiRequest("/api/auth/login/", {
    method: "POST",
    body: { email, password },
  });
  if (data.token) {
    // save the token sent from backend to localstorage
    setToken(data.token);
  }
  return data;
}

export async function logout() {
  try {
    await apiRequest("/api/auth/logout/", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    // remove the token from localstorage after logout
    removeToken();
  }
}

export async function register(name, email, password) {
  const data = await apiRequest("/api/auth/register/", {
    method: "POST",
    body: { name, email, password },
  });
  if (data.token) {
    // save the token sent from backend to localstorage
    setToken(data.token);
  }
  return data;
}

export async function resetPassword(email) {
  const data = await apiRequest("/api/auth/password-reset/", {
    method: "POST",
    body: { email },
  });
  return data;
}

export async function confirmPasswordReset(uid, token, newPassword) {
  const data = await apiRequest("/api/auth/password-reset/confirm/", {
    method: "POST",
    body: { uid, token, new_password: newPassword },
  });
  return data;
}

export async function deleteAccount() {
  await apiRequest("/api/auth/me/", { method: "DELETE" });
  removeToken();
}

export async function getCurrentUser() {
  const data = await apiRequest("/api/auth/me/", {
    method: "GET",
  });
  return data;
}
