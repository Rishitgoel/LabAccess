import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "@/features/auth/SessionProvider";
export function RouteFocus() {
  const { pathname } = useLocation();
  const { loading } = useSession();
  useEffect(() => {
    document.getElementById("main-content")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, loading]);
  return null;
}
