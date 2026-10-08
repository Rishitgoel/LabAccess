import { useId } from "react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { motionTiming } from "@/lib/motion";
import { requestStatuses } from "./list-query";
export function StatusFilters({ status, onChange }) {
  const id = useId(),
    reduced = useReducedMotion();
  return (
    <LayoutGroup id={id}>
      <div
        className="status-filters"
        role="group"
        aria-label="Filter requests by status"
      >
        {requestStatuses.map((value) => (
          <Button
            key={value}
            variant="outline"
            className="status-filter"
            aria-pressed={status === value}
            onClick={() => onChange(value)}
          >
            {status === value && (
              <motion.span
                className="status-filter__highlight"
                aria-hidden="true"
                layoutId="selected-status"
                layout={!reduced}
                transition={{
                  duration: reduced ? 0 : motionTiming.filter,
                  ease: "easeOut",
                }}
              />
            )}
            <span className="status-filter__label">
              {value[0].toUpperCase() + value.slice(1)}
            </span>
          </Button>
        ))}
      </div>
    </LayoutGroup>
  );
}
