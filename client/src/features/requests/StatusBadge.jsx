import { Check, Clock3, X, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
const states = {
  approved: [Check, "Approved"],
  pending: [Clock3, "Pending review"],
  rejected: [X, "Rejected"],
  cancelled: [Ban, "Cancelled"],
};
export function StatusBadge({ status }) {
  const [Icon, label] = states[status];
  return (
    <Badge className="status-badge" data-status={status}>
      <Icon size={15} aria-hidden="true" />
      {label}
    </Badge>
  );
}
