import Link from "next/link";

import type { SupportTicket } from "../types";
import { supportCategoryLabel, SupportStatusBadge } from "./support-status-badge";
import styles from "./support.module.css";

type SupportTicketCardProps = {
  ticket: SupportTicket;
};

function preview(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  if (compact.length <= 140) {
    return compact;
  }
  return `${compact.slice(0, 137)}...`;
}

export function formatSupportDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function SupportTicketCard({ ticket }: SupportTicketCardProps) {
  return (
    <li>
      <Link className={`${styles.card} ${styles.cardLink}`} href={`/support/${ticket.id}`}>
        <span className={styles.cardTop}>
          <span className={styles.category}>{supportCategoryLabel(ticket.category)}</span>
          <SupportStatusBadge status={ticket.status} />
        </span>
        <p className={styles.preview}>{preview(ticket.message)}</p>
        <p className={styles.meta}>
          <time dateTime={ticket.createdAt}>Created {formatSupportDate(ticket.createdAt)}</time>
        </p>
      </Link>
    </li>
  );
}
