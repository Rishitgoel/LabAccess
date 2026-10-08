import React, { useState } from "react";
import { MotionConfig } from "motion/react";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  EmptyState,
  ErrorState,
  ResourceSkeletons,
} from "@/components/feedback/States";
import { CatalogHero } from "@/features/resources/CatalogHero";
import { ResourceGrid } from "@/features/resources/ResourceGrid";
import { resources, initialRequests } from "@/features/resources/fixtures";
import { RequestFormDialog } from "@/features/requests/RequestFormDialog";
import { PreviewDialog } from "./PreviewDialog";

export default function PreviewCatalog() {
  const [requests, setRequests] = useState(initialRequests);
  const [role, setRole] = useState("learner");
  const [preview, setPreview] = useState("catalog");
  const [failSubmission, setFailSubmission] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState("");
  const reset = () => {
    setRequests(initialRequests);
    setPreview("catalog");
    setNotice("Preview reset. No server data was changed.");
  };
  async function submit(resource, reason) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (failSubmission) {
      setFailSubmission(false);
      throw new Error(
        "Preview submission failed. Your reason is still here. Try again.",
      );
    }
    setRequests((previous) => ({
      ...previous,
      [resource.id]: { status: "pending", reason },
    }));
    setNotice(
      "Request added to this preview. Nothing was saved to a server; refreshing resets it.",
    );
  }
  const openList = (event) =>
    setDialog({ type: "list", opener: event.currentTarget });
  return (
    <MotionConfig reducedMotion="user">
      <AppHeader
        role={role}
        onViewRequests={openList}
        onOptions={(opener) => setDialog({ type: "options", opener })}
        onReset={reset}
      />
      <main id="main-content" tabIndex={-1} className="page-container">
        <CatalogHero role={role} onViewRequests={openList} />
        <div className="catalog-heading">
          <div>
            <h2>Explore resources</h2>
            <p>{preview === "empty" ? 0 : resources.length} resources</p>
          </div>
          <span className="fixture-label">Interactive preview · not saved</span>
        </div>
        {notice && (
          <p className="notice" role="status">
            {notice}
          </p>
        )}
        {preview === "loading" ? (
          <ResourceSkeletons />
        ) : preview === "empty" ? (
          <EmptyState onReset={() => setPreview("catalog")} />
        ) : preview === "error" ? (
          <ErrorState onRetry={() => setPreview("catalog")} />
        ) : (
          <ResourceGrid
            resources={resources}
            requests={role === "reviewer" ? {} : requests}
            role={role}
            onRequest={(resource, opener) =>
              setDialog({ type: "request", resource, opener })
            }
            onView={(resource, opener) =>
              setDialog({ type: "detail", resource, opener })
            }
          />
        )}
        <footer className="catalog-footer">
          <p>Access decisions are managed by your reviewer.</p>
          <p>
            Sample data for design review. Accounts and saved requests arrive in
            later phases.
          </p>
        </footer>
      </main>
      {dialog?.type === "request" ? (
        <RequestFormDialog
          preview
          key={dialog.resource.id}
          resource={dialog.resource}
          openingControl={dialog.opener}
          onClose={() => setDialog(null)}
          onSubmit={submit}
        />
      ) : (
        dialog && (
          <PreviewDialog
            dialog={dialog}
            onClose={() => setDialog(null)}
            role={role}
            setRole={setRole}
            preview={preview}
            setPreview={setPreview}
            requests={requests}
            failSubmission={failSubmission}
            setFailSubmission={setFailSubmission}
          />
        )
      )}
    </MotionConfig>
  );
}
