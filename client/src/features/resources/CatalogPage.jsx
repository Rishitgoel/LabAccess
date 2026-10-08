import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResourceSkeletons, ErrorState } from "@/components/feedback/States";
import { useSession } from "@/features/auth/SessionProvider";
import { useRequests } from "@/features/requests/useRequests";
import { RequestFormDialog } from "@/features/requests/RequestFormDialog";
import {
  loadAllMine,
  requestApi,
  saveAndReconcile,
} from "@/features/requests/requests.api";
import { CatalogHero } from "./CatalogHero";
import { ResourceGrid } from "./ResourceGrid";
import { useResources } from "./useResources";
export default function CatalogPage() {
  const { user } = useSession(),
    navigate = useNavigate();
  const [page, setPage] = useState(1),
    [dialog, setDialog] = useState(null),
    [notice, setNotice] = useState("");
  const catalog = useResources(page),
    requests = useRequests("catalog", user.role === "learner");
  const loading = catalog.loading || requests.loading,
    error = catalog.error ?? requests.error;
  const mapping = Object.fromEntries(
    (requests.data ?? []).map((item) => [item.resourceId, item]),
  );
  function retry() {
    catalog.retry();
    requests.refresh();
  }
  async function existing(resource) {
    return (await loadAllMine()).find(
      (item) => item.resourceId === resource.id,
    );
  }
  async function submit(resource, reason) {
    try {
      const result = await saveAndReconcile(
        () => requestApi.create(resource.id, reason),
        () => existing(resource),
        (saved) => saved.reason === reason,
      );
      setNotice(
        result.reconciled
          ? "Saved request found and verified."
          : "Request saved. Your reviewer can now see it.",
      );
      requests.refresh();
    } catch (failure) {
      if (failure.status === 409) {
        requests.refresh();
        setNotice(
          "A request already exists. Open its saved details from the catalog.",
        );
      }
      throw failure;
    }
  }
  async function checkSaved(resource) {
    const saved = await existing(resource);
    requests.refresh();
    if (saved) {
      navigate(`/requests/${saved.id}`);
      return true;
    }
    return false;
  }
  return (
    <AppShell>
      <CatalogHero
        role={user.role}
        onViewRequests={() =>
          navigate(user.role === "reviewer" ? "/review" : "/requests")
        }
      />
      <div className="catalog-heading">
        <div>
          <h2>Explore resources</h2>
          <p>
            {loading
              ? "Loading resources…"
              : `${catalog.pagination?.total ?? 0} resources`}
          </p>
        </div>
      </div>
      <p
        role="status"
        aria-atomic="true"
        className={notice ? "notice" : "sr-only"}
      >
        {notice}
      </p>
      {loading && catalog.hasData && requests.data && (
        <p role="status" className="refresh-status">
          Updating saved requests…
        </p>
      )}
      {loading && (!catalog.hasData || !requests.data) ? (
        <ResourceSkeletons />
      ) : error ? (
        <ErrorState message={error.message} onRetry={retry} />
      ) : catalog.resources.length ? (
        <ResourceGrid
          resources={catalog.resources}
          requests={mapping}
          role={user.role}
          actionsDisabled={loading}
          onRequest={
            user.role === "learner"
              ? (resource, opener) => setDialog({ resource, opener })
              : undefined
          }
          onView={(resource) =>
            navigate(`/requests/${mapping[resource.id].id}`)
          }
        />
      ) : (
        <Card className="feedback">
          <h3>No resources to show</h3>
          <p>Check back when your learning catalog has been updated.</p>
        </Card>
      )}
      {catalog.pagination?.totalPages > 1 && (
        <nav className="pagination" aria-label="Resource pages">
          <Button
            variant="outline"
            disabled={loading || page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} of {catalog.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={loading || page >= catalog.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
      <footer className="catalog-footer">
        <p>Access decisions are managed by your reviewer.</p>
      </footer>
      {dialog && (
        <RequestFormDialog
          resource={dialog.resource}
          openingControl={dialog.opener}
          onClose={() => setDialog(null)}
          onSubmit={submit}
          onCheckSaved={checkSaved}
        />
      )}
    </AppShell>
  );
}
