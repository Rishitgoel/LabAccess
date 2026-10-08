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
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const field = useRef(null);
  const busy = useRef(false);
  const count = [...reason.trim()].length;
  async function submit(event) {
    event.preventDefault();
    if (busy.current) return;
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
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy.current) onClose();
      }}
    >
      <DialogContent
        className="request-dialog"
        showCloseButton={!saving}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          field.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          openingControl?.focus();
        }}
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (saving) event.preventDefault();
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
            readOnly={saving}
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
          <p className="preview-note">
            Preview only. This request is not saved to a server.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding preview…" : "Submit request"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
