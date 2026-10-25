import { useState, useEffect } from "react";
import { AuthContext } from "./authContext";
import { getToken } from "../services/tokenStorage";
import * as authService from "../services/authService";

export default function AuthProvider({ children }) {
  const [loading, setLoading] = useState(() => getToken() !== null);
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
  };
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };
  const register = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    setUser(data.user);
  };
  const deleteAccount = async () => {
    await authService.deleteAccount();
    setUser(null);
  };
  const resetPassword = async (email) => {
    const response = await authService.resetPassword(email);
    return response;
  };

  useEffect(() => {
    let cancelled = false;

    if (!getToken()) {
      return;
    }

    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        deleteAccount,
        resetPassword,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
