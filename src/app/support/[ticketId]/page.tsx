"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { TripNestHeader } from "../../../components/branding/tripnest-header";
import { formatSupportDate } from "../../../features/support/components/support-ticket-card";
import { supportCategoryLabel, SupportStatusBadge } from "../../../features/support/components/support-status-badge";
import styles from "../../../features/support/components/support.module.css";
import { SupportAlternativePanel } from "../../../features/support/components/support-alternative-panel";
import type { SupportTicket } from "../../../features/support/types";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "missing" }
  | { status: "ready"; ticket: SupportTicket };

export default function SupportTicketPage() {
  const params = useParams<{ ticketId: string }>();
  const ticketId = params.ticketId;
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (response.status === 404) {
        setState({ status: "missing" });
        return;
      }
      if (!response.ok) {
        setState({ status: "error" });
        return;
      }
      const body = (await response.json()) as { data?: { ticket?: SupportTicket } };
      if (!body.data?.ticket) {
        setState({ status: "error" });
        return;
      }
      setState({ status: "ready", ticket: body.data.ticket });
    } catch {
      setState({ status: "error" });
    }
  }, [ticketId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <TripNestHeader
          title="Support request"
          subtitle="Review the request and its latest status."
        />
        <div className={styles.backRow}>
          <Link className={styles.back} href="/support">
            Back to Support Center
          </Link>
        </div>

        {state.status === "loading" ? (
          <div className={styles.skeleton} aria-live="polite" aria-busy="true">
            <p className={styles.summary}>Loading support request</p>
            <div className={styles.skeletonRow} />
          </div>
        ) : null}

        {state.status === "error" ? (
          <section className={styles.notice} role="alert">
            <h1 className={styles.noticeTitle}>This request could not be loaded.</h1>
            <p className={styles.noticeBody}>Check the connection and try again.</p>
            <button className={styles.button} type="button" onClick={() => void load()}>
              Retry
            </button>
          </section>
        ) : null}

        {state.status === "missing" ? (
          <section className={styles.empty}>
            <h1 className={styles.emptyTitle}>Support request not found</h1>
            <p className={styles.emptyBody}>It may have been removed, or the link is incorrect.</p>
          </section>
        ) : null}

        {state.status === "ready" ? (
          <article className={`${styles.card} ${styles.detail}`}>
            <header className={styles.cardTop}>
              <h2 className={styles.category}>{supportCategoryLabel(state.ticket.category)}</h2>
              <SupportStatusBadge status={state.ticket.status} />
            </header>
            <p className={styles.message}>{state.ticket.message}</p>
            <div className={styles.meta}>
              <time dateTime={state.ticket.createdAt}>Created {formatSupportDate(state.ticket.createdAt)}</time>
              <time dateTime={state.ticket.updatedAt}>Updated {formatSupportDate(state.ticket.updatedAt)}</time>
            </div>
            {state.ticket.resolutionNote ? (
              <section className={styles.resolution}>
                <h2 className={styles.resolutionTitle}>Resolution note</h2>
                <p className={styles.message}>{state.ticket.resolutionNote}</p>
              </section>
            ) : null}
          </article>
        ) : null}
        {state.status === "ready" ? (
          <SupportAlternativePanel mode="traveler" ticketId={ticketId} ticketStatus={state.ticket.status} />
        ) : null}
      </div>
    </main>
  );
}
