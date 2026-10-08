import { useRef, useState } from "react";
import { restoreFocus } from "@/lib/focus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "@/features/auth/SessionProvider";
import {
  requestApi,
  saveAndReconcile,
  matchesLearnerTransition,
  UnconfirmedWrite,
} from "./requests.api";

export function LearnerActions({ request, onSaved, onConflict }) {
  const { user } = useSession();
  const pending = request.status === "pending";
  const [reason, setReason] = useState(request.reason);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(null);
  const busy = useRef(false),
    field = useRef(null),
    opener = useRef(null);
  const inactive = !request.resource?.isActive;
  async function save(event) {
    event?.preventDefault();
    if (busy.current || unconfirmed) return;
    const count = [...reason.trim()].length;
    if (!pending && (count < 20 || count > 1000)) {
      setError("Enter a reason of 20–1,000 characters.");
      field.current?.focus();
      return;
    }
    if (!pending && inactive) return;
    const attempt = {
      action: pending ? "cancel" : "resubmit",
      revision: request.revision,
      reason: reason.trim(),
    };
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await saveAndReconcile(
        () =>
          pending
            ? requestApi.cancel(request.id, attempt.revision)
            : requestApi.resubmit(request.id, attempt.revision, attempt.reason),
        async () => (await requestApi.detail(request.id)).data,
        (saved) => matchesLearnerTransition(saved, attempt, user.id),
        (saved) =>
          saved.revision === request.revision &&
          saved.status === request.status,
      );
      onSaved(result.record, result.reconciled);
    } catch (failure) {
      if (failure.status === 409) onConflict();
      else if (failure.unconfirmed) setUnconfirmed(attempt);
      setError(failure.message);
    } finally {
      setConfirmation(false);
      busy.current = false;
      setSaving(false);
    }
  }
  async function checkSaved() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const saved = (await requestApi.detail(request.id)).data;
      if (matchesLearnerTransition(saved, unconfirmed, user.id))
        onSaved(saved, true);
      else if (
        saved.revision !== request.revision ||
        saved.status !== request.status
      )
        onConflict();
      else {
        setUnconfirmed(null);
        setError(
          "No change was saved. Review the request and choose the action again.",
        );
      }
    } catch {
      setError(new UnconfirmedWrite().message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <Card className="workflow-panel learner-actions">
      <h2>{pending ? "Waiting for review" : "Update and resubmit"}</h2>
      <p>
        {pending
          ? "Your request is waiting for a reviewer. You can cancel it while it is pending."
          : "Add context for your reviewer. Previous submissions and decisions stay in your history."}
      </p>
      {pending ? (
        <>
          {!unconfirmed && (
            <Button
              variant="outline"
              disabled={saving}
              onClick={(event) => {
                opener.current = event.currentTarget;
                setConfirmation(true);
              }}
            >
              Cancel request
            </Button>
          )}
          <p className="auth-hint">
            You can resubmit a cancelled request later.
          </p>
        </>
      ) : (
        <form onSubmit={save}>
          <label htmlFor="resubmit-reason">Updated request reason</label>
          <Textarea
            id="resubmit-reason"
            ref={field}
            value={reason}
            readOnly={saving || Boolean(unconfirmed)}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={
              Boolean(error) &&
              ([...reason.trim()].length < 20 ||
                [...reason.trim()].length > 1000)
            }
            aria-describedby={
              error ? "resubmit-help learner-action-error" : "resubmit-help"
            }
          />
          <p id="resubmit-help" className="auth-hint">
            Required · 20–1,000 characters
          </p>
          {inactive && (
            <p className="auth-error">
              This resource is unavailable for resubmission.
            </p>
          )}
          {!unconfirmed && (
            <Button type="submit" disabled={saving || inactive}>
              {saving ? "Saving request…" : "Resubmit request"}
            </Button>
          )}
        </form>
      )}
      {error && (
        <p id="learner-action-error" className="field-error" role="alert">
          {error}
        </p>
      )}
      {unconfirmed && (
        <Button onClick={checkSaved} disabled={saving}>
          {saving ? "Checking saved state…" : "Check saved state"}
        </Button>
      )}
      {confirmation && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !busy.current) setConfirmation(false);
          }}
        >
          <DialogContent
            showCloseButton={!saving}
            onEscapeKeyDown={(event) => {
              if (saving) event.preventDefault();
            }}
            onPointerDownOutside={(event) => {
              if (saving) event.preventDefault();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              restoreFocus(opener.current);
            }}
          >
            <DialogHeader>
              <DialogTitle>Cancel this request?</DialogTitle>
              <DialogDescription>
                {request.resource?.name}. Your history will be kept, and you can
                resubmit later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setConfirmation(false)}
              >
                Keep request
              </Button>
              <Button disabled={saving} onClick={save}>
                {saving ? "Cancelling…" : "Confirm cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
