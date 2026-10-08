import { useRef, useState } from "react";
import { restoreFocus } from "@/lib/focus";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/features/auth/SessionProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { requestApi, saveAndReconcile, UnconfirmedWrite } from "./requests.api";
export function DecisionPanel({ request, onSaved, onConflict }) {
  const { user } = useSession();
  const [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [confirmation, setConfirmation] = useState(null),
    [saving, setSaving] = useState(false),
    [unconfirmed, setUnconfirmed] = useState(null);
  const busy = useRef(false),
    field = useRef(null),
    opener = useRef(null);
  function choose(status, event) {
    if ([...reason.trim()].length < 10 || [...reason.trim()].length > 500) {
      setError("Enter a decision reason of 10–500 characters.");
      field.current.focus();
      return;
    }
    opener.current = event.currentTarget;
    setConfirmation(status);
    setError("");
  }
  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    const attempt = {
      revision: request.revision,
      status: confirmation,
      reason: reason.trim(),
    };
    try {
      const result = await saveAndReconcile(
        () => requestApi.decide(request.id, attempt),
        async () => (await requestApi.detail(request.id)).data,
        (saved) =>
          saved.revision === attempt.revision + 1 &&
          saved.status === attempt.status &&
          saved.decisionReason === attempt.reason &&
          saved.history.at(-1)?.actorId === user.id,
        (saved) =>
          saved.revision === attempt.revision && saved.status === "pending",
      );
      setConfirmation(null);
      onSaved(result.record, result.reconciled);
    } catch (failure) {
      setConfirmation(null);
      if (failure.status === 409) onConflict();
      else if (failure.unconfirmed) setUnconfirmed(attempt);
      setError(failure.message);
    } finally {
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
      if (
        saved.revision === unconfirmed.revision + 1 &&
        saved.status === unconfirmed.status &&
        saved.decisionReason === unconfirmed.reason &&
        saved.history.at(-1)?.actorId === user.id
      )
        onSaved(saved, true);
      else if (
        saved.revision !== unconfirmed.revision ||
        saved.status !== "pending"
      )
        onConflict();
      else {
        setUnconfirmed(null);
        setError(
          "No decision was saved. Review your reason and choose an action again.",
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
    <Card className="workflow-panel decision-panel">
      <h2>Make a decision</h2>
      <label htmlFor="decision-reason">Decision reason</label>
      <Textarea
        ref={field}
        id="decision-reason"
        value={reason}
        readOnly={saving || Boolean(unconfirmed)}
        onChange={(event) => setReason(event.target.value)}
        aria-invalid={
          Boolean(error) &&
          ([...reason.trim()].length < 10 || [...reason.trim()].length > 500)
        }
        aria-describedby={
          error ? "decision-help decision-error" : "decision-help"
        }
        placeholder="Explain your decision to the learner…"
      />
      <p id="decision-help" className="auth-hint">
        Required · 10–500 characters
      </p>
      {error && (
        <p id="decision-error" role="alert" className="field-error">
          {error}
        </p>
      )}
      {unconfirmed ? (
        <Button onClick={checkSaved} disabled={saving}>
          {saving ? "Checking saved state…" : "Check saved decision"}
        </Button>
      ) : (
        <div className="decision-actions">
          <Button
            disabled={saving}
            onClick={(event) => choose("approved", event)}
          >
            Approve request
          </Button>
          <Button
            variant="outline"
            disabled={saving}
            onClick={(event) => choose("rejected", event)}
          >
            Reject request
          </Button>
        </div>
      )}
      <p className="auth-hint">
        Your decision is saved with the request history.
      </p>
      {confirmation && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !busy.current) setConfirmation(null);
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
              <DialogTitle>
                {confirmation === "approved"
                  ? "Approve this request?"
                  : "Reject this request?"}
              </DialogTitle>
              <DialogDescription>
                {request.resource?.name} · {request.learner?.name}
              </DialogDescription>
            </DialogHeader>
            <p className="preserved-text">{reason.trim()}</p>
            <DialogFooter>
              <Button
                variant="outline"
                disabled={saving}
                onClick={() => setConfirmation(null)}
              >
                Go back
              </Button>
              <Button disabled={saving} onClick={save}>
                {saving ? "Saving decision…" : "Confirm decision"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
