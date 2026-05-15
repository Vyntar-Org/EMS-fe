import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "../helpers/storage";
import { api } from "../helpers/api";
import { API_URLS } from "../helpers/apiUrls";

const AuthContext = createContext();

const buildTokenPayload = (data) => {
  const payload = data?.data || data || {};
  return {
    accessToken: payload.access || payload.access_token,
    refreshToken: payload.refresh || payload.refresh_token,
    expiresIn:
      payload.access_expires_in ||
      payload.expires_in ||
      payload.expiresIn ||
      3600,
    user: payload.user || data.user || null,
    permissions: payload.permissions || data.permissions || [],
  };
};

const saveAuthData = ({
  user,
  permissions = [],
  accessToken,
  refreshToken,
  expiresIn,
}) => {
  if (accessToken) storage.setLocal("access_token", accessToken);
  if (refreshToken) storage.setLocal("refresh_token", refreshToken);
  storage.setLocal(
    "token_expiry",
    new Date().getTime() + Number(expiresIn || 3600) * 1000,
  );
  if (user) storage.setLocal("user", user);
  storage.setLocal("permissions", permissions);
};

const clearAuthData = () => {
  storage.clearAll();
};

const fetchCurrentUser = async (accessToken = null) => {
  // try {
  //   const response = await api.get("/auth/user/");
  //   return response.data || response;
  // } catch (error) {
  try {
    const fallback = await api.get(API_URLS.CURRENT_USER, {
      ...(accessToken
        ? {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        : {}),
    });
    return fallback.data || fallback;
  } catch (error) {
    throw error;
  }
  // }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = storage.getLocal("access_token");
        const storedUser = storage.getLocal("user");
        const storedPermissions = storage.getLocal("permissions");

        if (token) {
          setUser(storedUser);
          setPermissions(storedPermissions || []);
        }
        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const responseBody = await api.post(API_URLS.LOGIN, {
        username,
        password,
      });

      const {
        accessToken,
        refreshToken,
        expiresIn,
        user: userData,
        permissions: userPermissions,
      } = buildTokenPayload(responseBody);

      if (!accessToken || !refreshToken) {
        throw new Error("Login response did not return valid tokens");
      }

      let finalUser = userData;
      if (!finalUser && accessToken) {
        try {
          finalUser = await fetchCurrentUser(accessToken);
        } catch (error) {
          // Unable to fetch user data after login
        }
      }

      saveAuthData({
        user: finalUser,
        permissions: userPermissions,
        accessToken,
        refreshToken,
        expiresIn,
      });
      setUser(finalUser);
      setPermissions(userPermissions || []);

      return responseBody;
    } catch (error) {
      throw new Error(error.message || "Login failed");
    }
  };

  const logout = async () => {
    const refreshToken = storage.getLocal("refresh_token");

    if (refreshToken) {
      try {
        await api.post(API_URLS.LOGOUT, { refresh: refreshToken });
      } catch (error) {
        // Logout request failed, clearing local auth state anyway
      }
    }

    setUser(null);
    setPermissions([]);
    clearAuthData();
  };

  const hasPermission = (permissionKey) => {
    if (!permissionKey) return true;
    return permissions.includes(permissionKey);
  };

  const isAuthenticated = async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return true;
    } catch {
      return false;
    }
  };

  const getUserData = async () => {
    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      throw new Error(error.message || "Failed to fetch user data");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        loading,
        login,
        logout,
        hasPermission,
        isAuthenticated,
        getUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
