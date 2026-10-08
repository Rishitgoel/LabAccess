import { Link } from "react-router-dom";
import { ShieldAlert, FolderSearch } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AppShell } from "@/components/layout/AppShell";
import { useSession } from "@/features/auth/SessionProvider";
export function RouteState({ denied = false }) {
  const { user } = useSession();
  const Icon = denied ? ShieldAlert : FolderSearch;
  const content = (
    <Card className="route-state">
      <Icon size={48} aria-hidden="true" />
      <p className="eyebrow">{denied ? "Access restricted" : "404"}</p>
      <h1>{denied ? "Access denied" : "We could not find that page"}</h1>
      <p>
        {denied
          ? "Your account does not have permission to open this page."
          : "The page or request may be unavailable."}
      </p>
      <Link className="text-action" to="/">
        Back to resources →
      </Link>
    </Card>
  );
  return user ? (
    <AppShell>{content}</AppShell>
  ) : (
    <main className="page-container">{content}</main>
  );
}
