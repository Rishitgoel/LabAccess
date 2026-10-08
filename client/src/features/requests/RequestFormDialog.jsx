import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResourceSummary } from "@/features/resources/ResourceCard";
export function RequestFormDialog({
  resource,
  onClose,
  onSubmit,
  openingControl,
  preview = false,
  onCheckSaved,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const field = useRef(null);
  const busy = useRef(false);
  const count = [...reason.trim()].length;
  async function submit(event) {
    event.preventDefault();
    if (busy.current || unconfirmed) return;
    if (count < 20 || count > 1000) {
      setError("Enter a reason of 20–1,000 characters.");
      field.current?.focus();
      return;
    }
    busy.current = true;
    field.current?.focus();
    setSaving(true);
    setError("");
    try {
      await onSubmit(resource, reason.trim());
      onClose();
    } catch (failure) {
      setError(failure.message);
      if (failure.unconfirmed) setUnconfirmed(true);
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
      if (await onCheckSaved(resource, reason.trim())) onClose();
      else {
        setUnconfirmed(false);
        setError("No request was saved. Review your reason and submit again.");
      }
    } catch {
      setError(
        "Saved state could not be checked. Check again before submitting.",
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy.current && !unconfirmed) onClose();
      }}
    >
      <DialogContent
        className="request-dialog"
        showCloseButton={!saving && !unconfirmed}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          field.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          openingControl?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (saving || unconfirmed) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (saving || unconfirmed) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Request access</DialogTitle>
          <DialogDescription>
            Tell your reviewer how you will use this resource.
          </DialogDescription>
        </DialogHeader>
        <div className="request-dialog__summary">
          <ResourceSummary resource={resource} />
        </div>
        <form onSubmit={submit} noValidate>
          <label htmlFor="request-reason">Request reason</label>
          <Textarea
            ref={field}
            id="request-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError("");
            }}
            readOnly={saving || unconfirmed}
            placeholder="Describe what you want to learn or build…"
            aria-invalid={!!error}
            aria-describedby={`reason-help${error ? " reason-error" : ""}`}
          />
          <div id="reason-help" className="field-help">
            <span>20–1,000 characters</span>
            <span>{count.toLocaleString("en-US")}/1,000</span>
          </div>
          {error && (
            <p id="reason-error" role="alert" className="field-error">
              {error}
            </p>
          )}
          {preview && (
            <p className="preview-note">
              Preview only. This request is not saved to a server.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving || unconfirmed}
            >
              Cancel
            </Button>
            {unconfirmed ? (
              <Button type="button" onClick={checkSaved} disabled={saving}>
                {saving ? "Checking saved state…" : "Check saved request"}
              </Button>
            ) : (
              <Button type="submit" disabled={saving}>
                {saving
                  ? preview
                    ? "Adding preview…"
                    : "Saving request…"
                  : "Submit request"}
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
