import { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // on page load, check if the saved token is still valid
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const d = await api("/auth/login", { method: "POST", body: { username, password } });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }

  async function register(username, email, password) {
    const d = await api("/auth/register", {
      method: "POST",
      body: { username, email, password },
    });
    setToken(d.token);
    setUser(d.user);
    return d.user;
  }

  // reload the logged-in user's details from the server
  async function refresh() {
    const d = await api("/auth/me");
    setUser(d.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);