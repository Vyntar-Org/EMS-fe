import { storage } from "./storage";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://bms.api.v1.vyntar.in/api";

// Token Expiry Check (within 5 minutes)
const isTokenExpiringSoon = (expiryTime) => {
  if (!expiryTime) return true;
  // Expiry time is assumed to be in seconds or milliseconds, we'll assume ms for standard Date
  const now = new Date().getTime();
  const timeToExpire = expiryTime - now;
  return timeToExpire < 5 * 60 * 1000; // 5 minutes in milliseconds
};

const refreshTokenIfNeeded = async () => {
  const expiry = storage.getLocal("token_expiry");
  const refreshToken = storage.getLocal("refresh_token");

  if (refreshToken && isTokenExpiringSoon(expiry)) {
    try {
      const response = await fetch(`${BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Refresh failed");
      }

      const data = await response.json();
      const tokenPayload = data.data || data || {};
      const accessToken = tokenPayload.access || tokenPayload.access_token;
      const refreshTokenResponse =
        tokenPayload.refresh || tokenPayload.refresh_token;
      const accessExpiresIn =
        tokenPayload.access_expires_in ||
        tokenPayload.expires_in ||
        tokenPayload.expiresIn ||
        3600;

      if (!accessToken || !refreshTokenResponse) {
        throw new Error("Refresh failed: invalid token response");
      }

      storage.setLocal("access_token", accessToken);
      storage.setLocal("refresh_token", refreshTokenResponse);
      const newExpiry = new Date().getTime() + Number(accessExpiresIn) * 1000;
      storage.setLocal("token_expiry", newExpiry);
      return accessToken;
    } catch (error) {
      storage.clearAll();
      window.location.href = "/login";
      return null;
    }
  }
  return storage.getLocal("access_token");
};

const fetchApi = async (endpoint, options = {}) => {
  const token = await refreshTokenIfNeeded();

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (response.status === 401) {
      storage.clearAll();
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw { status: response.status, data };
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const api = {
  get: (endpoint, options) => fetchApi(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options) =>
    fetchApi(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  put: (endpoint, body, options) =>
    fetchApi(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (endpoint, options) =>
    fetchApi(endpoint, { ...options, method: "DELETE" }),
};
