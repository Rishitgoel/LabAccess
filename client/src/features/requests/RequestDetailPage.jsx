import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/AppShell";
import { RouteState } from "@/components/feedback/RouteState";
import { ResourceSummary } from "@/features/resources/ResourceCard";
import { useSession } from "@/features/auth/SessionProvider";
import { formatDate } from "@/lib/dates";
import { useRequests } from "./useRequests";
import { RequestTimeline } from "./RequestTimeline";
import { DecisionPanel } from "./DecisionPanel";
import { LearnerActions } from "./LearnerActions";
import { StatusBadge } from "./StatusBadge";
export default function RequestDetailPage() {
  const { id } = useParams(),
    { user } = useSession(),
    location = useLocation();
  const { data, loading, error, refresh } = useRequests("detail", id);
  const [notice, setNotice] = useState("");
  if (error && [400, 404].includes(error.status)) return <RouteState />;
  if (error?.status === 403) return <RouteState denied />;
  const back = location.state?.back?.startsWith(
    user.role === "reviewer" ? "/review?" : "/requests?",
  )
    ? location.state.back
    : user.role === "reviewer"
      ? "/review"
      : "/requests";
  const item = data?.data;
  return (
    <AppShell>
      <Link className="workflow-back" to={back}>
        ← Back to {user.role === "reviewer" ? "review queue" : "my requests"}
      </Link>
      {notice && (
        <p
          className={
            notice.startsWith("This request") ? "auth-error" : "notice"
          }
          role="status"
        >
          {notice}
        </p>
      )}
      {loading ? (
        <Card
          className="workflow-panel"
          role="status"
          aria-label="Loading request"
        >
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </Card>
      ) : error ? (
        <Card className="feedback" role="alert">
          <h1>Request could not be loaded</h1>
          <p>{error.message}</p>
          <Button onClick={refresh}>Try again</Button>
        </Card>
      ) : (
        item && (
          <>
            <div className="workflow-heading">
              <div>
                <div className="detail-title">
                  <h1>{item.resource?.name ?? "Resource unavailable"}</h1>
                  <StatusBadge status={item.status} />
                </div>
                <p>Submitted {formatDate(item.submittedAt)}</p>
              </div>
            </div>
            <div className="request-detail-grid">
              <div>
                <Card className="workflow-panel">
                  <h2>
                    {user.role === "reviewer"
                      ? "Request context"
                      : "Request reason"}
                  </h2>
                  {user.role === "reviewer" && (
                    <p>
                      <strong>{item.learner?.name}</strong>
                      <br />
                      {item.learner?.email}
                    </p>
                  )}
                  <p className="preserved-text">{item.reason}</p>
                  <hr />
                  <h2>Resource details</h2>
                  {item.resource ? (
                    <ResourceSummary resource={item.resource} />
                  ) : (
                    <p>This resource is no longer available.</p>
                  )}
                </Card>
                {["rejected", "cancelled"].includes(item.status) && (
                  <Card className="workflow-panel request-feedback">
                    <h2>
                      {item.status === "rejected"
                        ? "Reviewer feedback"
                        : "Cancellation context"}
                    </h2>
                    <p className="preserved-text">
                      {item.status === "rejected"
                        ? item.decisionReason
                        : user.role === "learner"
                          ? "You cancelled this request. You can update the reason and resubmit."
                          : "The learner cancelled this request and can resubmit later."}
                    </p>
                    <p className="auth-hint">
                      {item.history.at(-1)?.actorName ?? "Account unavailable"}{" "}
                      · {formatDate(item.history.at(-1).at)}
                    </p>
                  </Card>
                )}
                <Card className="workflow-panel">
                  <RequestTimeline request={item} />
                </Card>
              </div>
              {user.role === "reviewer" && item.status === "pending" ? (
                <DecisionPanel
                  key={`${item.id}-${item.revision}`}
                  request={item}
                  onSaved={(_record, reconciled) => {
                    setNotice(
                      reconciled
                        ? "Saved decision found and verified."
                        : "Decision saved.",
                    );
                    refresh();
                  }}
                  onConflict={() => {
                    setNotice(
                      "This request changed. The saved state has been refreshed. Review it before choosing another action.",
                    );
                    refresh();
                  }}
                />
              ) : user.role === "learner" && item.status !== "approved" ? (
                <LearnerActions
                  key={`${item.id}-${item.revision}`}
                  request={item}
                  onSaved={(record, reconciled) => {
                    setNotice(
                      reconciled
                        ? "Saved change found and verified."
                        : record.status === "cancelled"
                          ? "Request cancelled."
                          : "Request resubmitted. Your reviewer can now see it.",
                    );
                    refresh();
                  }}
                  onConflict={() => {
                    setNotice(
                      "This request changed. The saved state has been refreshed. Review it before choosing another action.",
                    );
                    refresh();
                  }}
                />
              ) : (
                <Card className="workflow-panel outcome-panel">
                  <StatusBadge status={item.status} />
                  <h2>
                    {item.status === "pending"
                      ? "Waiting for review"
                      : item.status === "approved"
                        ? "Request approved"
                        : item.status === "rejected"
                          ? "Request rejected"
                          : "Request cancelled"}
                  </h2>
                  <p className="preserved-text">
                    {item.decisionReason ??
                      (item.status === "pending"
                        ? "Your request is waiting for a reviewer."
                        : "This request was cancelled by the learner.")}
                  </p>
                  {item.status === "approved" && (
                    <p className="auth-hint">
                      Approval records a decision; it does not provision
                      external access.
                    </p>
                  )}
                </Card>
              )}
            </div>
          </>
        )
      )}
    </AppShell>
  );
}
