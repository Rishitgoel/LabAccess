import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "./StatusBadge";
import { useRequests } from "./useRequests";
import { formatDate } from "@/lib/dates";
export default function RequestListPage({ review = false }) {
  const [params, setParams] = useSearchParams();
  const rawPage = params.get("page") ?? "1";
  const page =
    /^[1-9]\d*$/.test(rawPage) && Number.isSafeInteger(Number(rawPage))
      ? Number(rawPage)
      : 1;
  const { data, loading, error, refresh } = useRequests(
    review ? "review" : "mine",
    page,
  );
  return (
    <AppShell>
      <div className="workflow-heading">
        <div>
          <h1>{review ? "Review queue" : "My requests"}</h1>
          <p>
            {review
              ? "Review pending learner requests. Oldest first."
              : "Follow decisions and track your access requests."}
          </p>
        </div>
        <Link className="text-action" to="/">
          Browse resources →
        </Link>
      </div>
      {loading ? (
        <Card
          className="workflow-panel"
          role="status"
          aria-label="Loading requests"
        >
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </Card>
      ) : error ? (
        <Card className="feedback" role="alert">
          <h2>Requests could not be loaded</h2>
          <p>{error.message}</p>
          <Button onClick={refresh}>Try again</Button>
        </Card>
      ) : !data.data.length ? (
        <Card className="feedback">
          <h2>{review ? "No pending requests" : "No requests to show"}</h2>
          <p>
            {review
              ? "New learner requests will appear here."
              : "Browse resources to make your first request."}
          </p>
          <Link to="/">Browse resources</Link>
        </Card>
      ) : (
        <div className="request-table">
          <table>
            <caption className="sr-only">
              {review ? "Pending reviews" : "Your access requests"}
            </caption>
            <thead>
              <tr>
                {review && <th>Learner</th>}
                <th>Resource</th>
                <th>Status</th>
                <th>Submitted</th>
                {!review && <th>Latest update</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((item) => (
                <tr key={item.id}>
                  {review && (
                    <td data-label="Learner">
                      <strong>
                        {item.learner?.name ?? "Account unavailable"}
                      </strong>
                      <small>{item.learner?.email}</small>
                    </td>
                  )}
                  <td data-label="Resource">
                    <strong>
                      {item.resource?.name ?? "Resource unavailable"}
                    </strong>
                    <small>{item.resource?.description}</small>
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={item.status} />
                  </td>
                  <td data-label="Submitted">{formatDate(item.submittedAt)}</td>
                  {!review && (
                    <td data-label="Latest update">
                      {item.decisionReason ??
                        (item.status === "cancelled"
                          ? "Cancelled by you"
                          : "Awaiting review")}
                    </td>
                  )}
                  <td data-label="Action">
                    <Link
                      className="text-action"
                      to={`/requests/${item.id}`}
                      state={{
                        back: `${review ? "/review" : "/requests"}?page=${page}`,
                      }}
                    >
                      {review ? "Review request" : "View details"} →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data?.pagination && (
        <nav className="pagination" aria-label="Request pages">
          <span>{data.pagination.total} requests</span>
          <Button
            variant="outline"
            disabled={page === 1 || loading}
            onClick={() => setParams({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <span>Page {page}</span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.totalPages || loading}
            onClick={() => setParams({ page: String(page + 1) })}
          >
            Next
          </Button>
        </nav>
      )}
    </AppShell>
  );
}
