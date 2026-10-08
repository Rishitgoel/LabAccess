import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
export function RequestListSkeleton() {
  return (
    <div
      className="request-table list-skeleton"
      role="status"
      aria-label="Loading requests"
    >
      <span className="sr-only">Loading requests</span>
      <div className="list-skeleton__header" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div className="list-skeleton__row" key={index} aria-hidden="true">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-5 w-24" />
        </div>
      ))}
    </div>
  );
}
export function RequestDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading request">
      <span className="sr-only">Loading request</span>
      <div className="workflow-heading" aria-hidden="true">
        <Skeleton className="h-10 w-3/4 max-w-lg" />
      </div>
      <div className="request-detail-grid" aria-hidden="true">
        <div>
          <Card className="workflow-panel detail-skeleton__context">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
          </Card>
          <Card className="workflow-panel detail-skeleton__timeline">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-20 w-full" />
          </Card>
        </div>
        <Card className="workflow-panel detail-skeleton__action">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-11 w-full" />
        </Card>
      </div>
    </div>
  );
}
