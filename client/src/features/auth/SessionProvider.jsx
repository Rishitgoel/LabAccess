import { createContext, useContext, useEffect, useState } from "react";
import { api, clearCsrf } from "@/lib/api";
const SessionContext = createContext(null);
export function SessionProvider({ children }) {
  const [session, setSession] = useState({
    loading: true,
    user: null,
    error: null,
  });
  async function refresh() {
    setSession({ loading: true, user: null, error: null });
    try {
      const { data } = await api("/auth/me");
      setSession({ loading: false, user: data, error: null });
    } catch (error) {
      setSession({
        loading: false,
        user: null,
        error: error.status === 401 ? null : error,
      });
    }
  }
  useEffect(() => {
    refresh();
    const expired = () => {
      clearCsrf();
      setSession({ loading: false, user: null, error: null, expired: true });
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, []);
  async function login(credentials) {
    const { data } = await api("/auth/login", {
      method: "POST",
      body: credentials,
    });
    clearCsrf();
    setSession({ loading: false, user: data, error: null });
  }
  async function logout() {
    await api("/auth/logout", { method: "POST", body: {} });
    clearCsrf();
    setSession({ loading: false, user: null, error: null });
  }
  return (
    <SessionContext.Provider value={{ ...session, refresh, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}
export const useSession = () => useContext(SessionContext);
