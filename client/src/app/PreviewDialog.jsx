import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResourceSummary } from "@/features/resources/ResourceCard";
import { resources } from "@/features/resources/fixtures";
import { StatusBadge } from "@/features/requests/StatusBadge";

// Temporary design-review controls, removed when the real features are connected.
export function PreviewDialog({
  dialog,
  onClose,
  role,
  setRole,
  preview,
  setPreview,
  requests,
  failSubmission,
  setFailSubmission,
}) {
  const title =
    dialog.type === "options"
      ? "Preview options"
      : dialog.type === "detail"
        ? "Request preview"
        : role === "reviewer"
          ? "Review queue preview"
          : "My requests preview";
  const request = dialog.resource && requests[dialog.resource.id];
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (dialog.opener) {
            event.preventDefault();
            dialog.opener.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Sample data only. Nothing here is saved to a server.
          </DialogDescription>
        </DialogHeader>
        {dialog.type === "options" ? (
          <div className="preview-options">
            <fieldset>
              <legend>Catalog state</legend>
              <div>
                {["catalog", "loading", "empty", "error"].map((value) => (
                  <Button
                    key={value}
                    variant={preview === value ? "default" : "outline"}
                    aria-pressed={preview === value}
                    onClick={() => {
                      setPreview(value);
                      onClose();
                    }}
                  >
                    {value === "catalog" ? "Resources" : value}
                  </Button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Navigation role</legend>
              <div>
                {["learner", "reviewer"].map((value) => (
                  <Button
                    key={value}
                    variant={role === value ? "default" : "outline"}
                    aria-pressed={role === value}
                    onClick={() => {
                      setRole(value);
                      onClose();
                    }}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </fieldset>
            <label className="preview-checkbox">
              <input
                type="checkbox"
                checked={failSubmission}
                onChange={(event) => setFailSubmission(event.target.checked)}
              />
              Simulate a failed submission
            </label>
          </div>
        ) : dialog.type === "detail" ? (
          <div className="request-preview">
            <ResourceSummary resource={dialog.resource} />
            <StatusBadge status={request.status} />
            <h3>Request reason</h3>
            <p>{request.reason}</p>
            {request.decisionReason && (
              <>
                <h3>Reviewer feedback</h3>
                <p>{request.decisionReason}</p>
              </>
            )}
            <p className="preview-note">
              This is a read-only fixture. Workflow actions and history are
              coming in later phases.
            </p>
          </div>
        ) : (
          <ul className="request-preview-list">
            {resources
              .filter(
                (resource) =>
                  requests[resource.id] &&
                  (role !== "reviewer" ||
                    requests[resource.id].status === "pending"),
              )
              .map((resource) => (
                <li key={resource.id}>
                  <div>
                    <h3>{resource.name}</h3>
                    <StatusBadge status={requests[resource.id].status} />
                  </div>
                  <p>{requests[resource.id].reason}</p>
                </li>
              ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
