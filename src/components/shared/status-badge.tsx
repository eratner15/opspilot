import { cn, getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  SCHEDULED: "Scheduled",
  EN_ROUTE: "En Route",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  INVOICED: "Invoiced",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  ON_HOLD: "On Hold",
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
  UNPAID: "Unpaid",
  OVERDUE: "Overdue",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ON_LEAVE: "On Leave",
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const displayLabel = label ?? STATUS_LABELS[status] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        getStatusColor(status),
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
