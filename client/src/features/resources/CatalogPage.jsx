import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResourceSkeletons, ErrorState } from "@/components/feedback/States";
import { useSession } from "@/features/auth/SessionProvider";
import { CatalogHero } from "./CatalogHero";
import { ResourceGrid } from "./ResourceGrid";
import { useResources } from "./useResources";
export default function CatalogPage() {
  const { user, logout } = useSession();
  const [page, setPage] = useState(1),
    [logoutError, setLogoutError] = useState(""),
    [busy, setBusy] = useState(false);
  const { loading, resources, pagination, error, retry } = useResources(page);
  async function signOut() {
    setBusy(true);
    setLogoutError("");
    try {
      await logout();
    } catch (failure) {
      setLogoutError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AppHeader
        user={user}
        role={user.role}
        onLogout={signOut}
        logoutBusy={busy}
      />
      <main className="page-container">
        <CatalogHero role={user.role} />
        <div className="catalog-heading">
          <div>
            <h2>Explore resources</h2>
            <p>
              {loading
                ? "Loading resources…"
                : `${pagination?.total ?? 0} resources`}
            </p>
          </div>
        </div>
        {logoutError && (
          <p role="alert" className="auth-error">
            {logoutError}
          </p>
        )}
        {loading ? (
          <ResourceSkeletons />
        ) : error ? (
          <ErrorState message={error.message} onRetry={retry} />
        ) : resources.length ? (
          <ResourceGrid resources={resources} requests={{}} role={user.role} />
        ) : (
          <Card className="feedback">
            <h3>No resources to show</h3>
            <p>Check back when your learning catalog has been updated.</p>
          </Card>
        )}
        {pagination?.totalPages > 1 && (
          <nav className="pagination" aria-label="Resource pages">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </nav>
        )}
        <footer className="catalog-footer">
          <p>
            Request submission and review will be connected in the next phases.
          </p>
        </footer>
      </main>
    </>
  );
}
