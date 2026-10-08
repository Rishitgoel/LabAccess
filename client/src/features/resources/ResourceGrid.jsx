import { motion, useReducedMotion } from "motion/react";
import { ResourceCard } from "./ResourceCard";
export function ResourceGrid({ resources, requests, role, onRequest, onView }) {
  const reduced = useReducedMotion();
  return (
    <div className="resource-grid">
      {resources.map((resource, index) => (
        <motion.div
          key={resource.id}
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0 : 0.35,
            delay: reduced ? 0 : Math.min(index * 0.06, 0.24),
          }}
        >
          <ResourceCard
            resource={resource}
            status={requests[resource.id]?.status}
            role={role}
            onRequest={(event) => onRequest(resource, event.currentTarget)}
            onView={(event) => onView(resource, event.currentTarget)}
          />
        </motion.div>
      ))}
    </div>
  );
}
