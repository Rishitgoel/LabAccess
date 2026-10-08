import { AlertCircle, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
export function EmptyState({ onReset }) {
  return (
    <Card className="feedback">
      <Library aria-hidden="true" />
      <h3>No resources to show</h3>
      <p>
        This is an empty-state preview. Return to the sample catalog to explore
        resources.
      </p>
      <Button variant="outline" onClick={onReset}>
        Return to resources
      </Button>
    </Card>
  );
}
export function ErrorState({ onRetry }) {
  return (
    <Card className="feedback" role="alert">
      <AlertCircle aria-hidden="true" />
      <h3>Resources could not be loaded</h3>
      <p>This is a read-error preview.</p>
      <Button onClick={onRetry}>Try again</Button>
    </Card>
  );
}
export function ResourceSkeletons() {
  return (
    <div role="status" aria-label="Loading resources">
      <span className="sr-only">Loading resources</span>
      <div className="resource-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} className="resource-skeleton" aria-hidden="true">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-auto h-11 w-36" />
          </Card>
        ))}
      </div>
    </div>
  );
}
