import { motion, useReducedMotion } from "motion/react";
import { ResourceCard } from "./ResourceCard";
import { entranceMotion } from "@/lib/motion";
export function ResourceGrid({
  resources,
  requests,
  role,
  onRequest,
  onView,
  actionsDisabled = false,
}) {
  const reduced = useReducedMotion();
  return (
    <div className="resource-grid">
      {resources.map((resource, index) => (
        <motion.div key={resource.id} {...entranceMotion(reduced, index)}>
          <ResourceCard
            resource={resource}
            status={requests[resource.id]?.status}
            role={role}
            actionsDisabled={actionsDisabled}
            onRequest={
              onRequest && ((event) => onRequest(resource, event.currentTarget))
            }
            onView={
              onView && ((event) => onView(resource, event.currentTarget))
            }
          />
        </motion.div>
      ))}
    </div>
  );
}
