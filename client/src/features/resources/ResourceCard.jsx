import {
  ArrowRight,
  Atom,
  BarChart3,
  Code2,
  Database,
  Pencil,
  Settings2,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/requests/StatusBadge";
const icons = {
  code: Code2,
  react: Atom,
  database: Database,
  design: Pencil,
  settings: Settings2,
  chart: BarChart3,
};
export function ResourceIcon({ type }) {
  const Icon = icons[type] ?? Code2;
  return (
    <span className="resource-icon">
      <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
    </span>
  );
}
export function ResourceSummary({ resource }) {
  return (
    <div className="resource-summary">
      <ResourceIcon
        type={
          resource.icon ??
          (resource.category === "Data"
            ? "database"
            : resource.category === "Design"
              ? "design"
              : "code")
        }
      />
      <div>
        <p className="eyebrow">{resource.category}</p>
        <h3>{resource.name}</h3>
        <p>{resource.description}</p>
        <p className="eligibility">
          <Users size={14} aria-hidden="true" />
          {resource.eligibility}
        </p>
      </div>
    </div>
  );
}
export function ResourceCard({
  resource,
  status,
  role,
  onRequest,
  onView,
  actionsDisabled = false,
}) {
  return (
    <Card className="resource-card">
      <ResourceSummary resource={resource} />
      <div className="resource-card__actions">
        {status && <StatusBadge status={status} />}
        {role === "learner" && !status && onRequest ? (
          <Button onClick={onRequest} disabled={actionsDisabled}>
            Request access
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : status ? (
          <Button variant="ghost" onClick={onView} disabled={actionsDisabled}>
            View request
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : (
          <span className="resource-card__readonly">
            {role === "reviewer"
              ? "Requests are made by learners."
              : "Available in your learning catalog."}
          </span>
        )}
      </div>
    </Card>
  );
}
