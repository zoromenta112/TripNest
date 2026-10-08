import type { SupportTicketCategory, SupportTicketStatus } from "../types";
import styles from "./support.module.css";

const statusLabels: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const categoryLabels: Record<SupportTicketCategory, string> = {
  transport: "Transportation",
  accommodation: "Accommodation",
  booking: "Booking",
  esim: "eSIM",
  activity: "Activities",
  other: "Other",
};

export function supportStatusLabel(status: SupportTicketStatus) {
  return statusLabels[status];
}

export function supportCategoryLabel(category: SupportTicketCategory) {
  return categoryLabels[category];
}

type SupportStatusBadgeProps = {
  status: SupportTicketStatus;
};

export function SupportStatusBadge({ status }: SupportStatusBadgeProps) {
  return <span className={styles.badge}>{supportStatusLabel(status)}</span>;
}
