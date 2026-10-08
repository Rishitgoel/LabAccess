import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/features/auth/SessionProvider";
import { AppHeader } from "./AppHeader";
export function AppShell({ children }) {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AppHeader
        user={user}
        role={user.role}
        onViewRequests={() =>
          navigate(user.role === "reviewer" ? "/review" : "/requests")
        }
        onLogout={signOut}
        logoutBusy={busy}
      />
      <main className="page-container">
        {error && (
          <p role="alert" className="auth-error">
            {error}
          </p>
        )}
        {children}
      </main>
    </>
  );
}
