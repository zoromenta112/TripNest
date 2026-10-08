"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { SUPPORT_TICKET_STATUSES, type SupportTicket, type SupportTicketStatus } from "../types";
import { formatSupportDate } from "./support-ticket-card";
import { supportCategoryLabel, supportStatusLabel } from "./support-status-badge";
import styles from "./support.module.css";

type Filter = "all" | SupportTicketStatus;

const filters: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "All" },
  ...SUPPORT_TICKET_STATUSES.map((status) => ({
    value: status,
    label: supportStatusLabel(status),
  })),
];

function preview(message: string) {
  const compact = message.replace(/\s+/g, " ").trim();
  return compact.length <= 120 ? compact : `${compact.slice(0, 117)}...`;
}

export function AdminTicketBoard({ header }: { header: ReactNode }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (nextFilter: Filter) => {
    setLoading(true);
    setLoadError(false);
    try {
      const query = nextFilter === "all" ? "" : `?status=${nextFilter}`;
      const response = await fetch(`/api/admin/tickets${query}`);
      if (!response.ok) {
        throw new Error("load failed");
      }
      const body = (await response.json()) as { data?: { tickets?: SupportTicket[] } };
      if (!body.data?.tickets) {
        throw new Error("load failed");
      }
      setTickets(body.data.tickets);
    } catch {
      setTickets(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {header}

        <div className={styles.toolbar} role="group" aria-label="Filter by status">
          {filters.map((item) => (
            <button
              key={item.value}
              className={`${styles.button} ${filter === item.value ? "" : styles.secondary}`}
              type="button"
              aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.skeleton} aria-live="polite" aria-busy="true">
            <p className={styles.summary}>Loading tickets</p>
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
          </div>
        ) : null}

        {!loading && loadError ? (
          <section className={styles.notice} role="alert">
            <h2 className={styles.noticeTitle}>Tickets could not be loaded.</h2>
            <button className={styles.button} type="button" onClick={() => void load(filter)}>
              Retry
            </button>
          </section>
        ) : null}

        {!loading && !loadError && tickets && tickets.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>No tickets in this view</h2>
            <p className={styles.emptyBody}>Try another status filter.</p>
          </section>
        ) : null}

        {!loading && !loadError && tickets && tickets.length > 0 ? (
          <ul className={styles.list}>
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link className={`${styles.card} ${styles.cardLink}`} href={`/admin/tickets/${ticket.id}`}>
                  <span className={styles.cardTop}>
                    <span className={styles.category}>{supportCategoryLabel(ticket.category)}</span>
                    <span className={styles.badge}>{supportStatusLabel(ticket.status)}</span>
                  </span>
                  <p className={styles.preview}>{preview(ticket.message)}</p>
                  <p className={styles.meta}>
                    <span>Ref {ticket.id.slice(0, 8)}</span>
                    <time dateTime={ticket.createdAt}>Created {formatSupportDate(ticket.createdAt)}</time>
                    <time dateTime={ticket.updatedAt}>Updated {formatSupportDate(ticket.updatedAt)}</time>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </main>
  );
}
