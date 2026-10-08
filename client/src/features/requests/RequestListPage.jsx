import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { motionTiming } from "@/lib/motion";
import { Link, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestListSkeleton } from "@/components/feedback/WorkflowSkeletons";
import { StatusFilters } from "./StatusFilters";
import { StatusBadge } from "./StatusBadge";
import { useRequests } from "./useRequests";
import { formatDate } from "@/lib/dates";
import { readListQuery, availablePage } from "./list-query";
export default function RequestListPage({ review = false }) {
  const reduced = useReducedMotion();
  const [params, setParams] = useSearchParams();
  const { page, status } = readListQuery(params, review);
  const { data, loading, error, refresh } = useRequests(
    review ? "review" : "mine",
    page,
    status,
  );
  useEffect(() => {
    if (!loading && data?.pagination) {
      const next = availablePage(page, data.pagination.totalPages);
      if (next !== page)
        setParams({ status, page: String(next) }, { replace: true });
    }
  }, [loading, data, page, status, setParams]);
  const filtered = status !== "all";
  return (
    <AppShell>
      <div className="workflow-heading">
        <div>
          <h1>{review ? "Review queue" : "My requests"}</h1>
          <p>
            {review
              ? status === "pending"
                ? "Review pending learner requests. Oldest first."
                : "Browse learner requests and saved decisions. Latest first."
              : "Follow decisions and track your access requests."}
          </p>
        </div>
        <Link className="text-action" to="/">
          Browse resources →
        </Link>
      </div>
      <StatusFilters
        status={status}
        onChange={(value) => setParams({ status: value, page: "1" })}
      />
      <p className="sr-only" role="status" aria-atomic="true">
        {loading
          ? "Loading requests"
          : data
            ? `${data.pagination.total} ${status === "all" ? "" : status + " "}requests. Page ${page}.`
            : ""}
      </p>
      {loading && !data ? (
        <RequestListSkeleton />
      ) : error ? (
        <Card className="feedback" role="alert">
          <h2>Requests could not be loaded</h2>
          <p>{error.message}</p>
          <Button onClick={refresh}>Try again</Button>
        </Card>
      ) : !data.data.length ? (
        <Card className="feedback">
          <h2>{filtered ? `No ${status} requests` : "No requests to show"}</h2>
          <p>
            {filtered
              ? "No requests match this status. Choose another filter to see more."
              : review
                ? "Learner requests will appear here."
                : "Browse resources to make your first request."}
          </p>
          <Link to="/">Browse resources</Link>
        </Card>
      ) : (
        <motion.div
          key={`${status}-${page}`}
          className="request-table"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduced ? 0 : motionTiming.filter }}
        >
          <table>
            <caption className="sr-only">
              {review ? "Learner requests" : "Your access requests"}
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
                        back: `${review ? "/review" : "/requests"}?status=${status}&page=${page}`,
                      }}
                    >
                      {review && item.status === "pending"
                        ? "Review request"
                        : "View details"}{" "}
                      →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
      {data?.pagination && (
        <nav className="pagination" aria-label="Request pages">
          <span>{data.pagination.total} requests</span>
          <Button
            variant="outline"
            disabled={page === 1 || loading}
            onClick={() => setParams({ status, page: String(page - 1) })}
          >
            Previous
          </Button>
          <span>
            Page {page} of {Math.max(1, data.pagination.totalPages)}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.totalPages || loading}
            onClick={() => setParams({ status, page: String(page + 1) })}
          >
            Next
          </Button>
        </nav>
      )}
    </AppShell>
  );
}
