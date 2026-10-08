"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import type { SupportTicket } from "../types";
import { SupportAlternativePanel } from "./support-alternative-panel";
import { formatSupportDate } from "./support-ticket-card";
import { supportCategoryLabel, SupportStatusBadge } from "./support-status-badge";
import styles from "./support.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "missing" }
  | { status: "ready"; ticket: SupportTicket };

type AdminTicketDetailProps = {
  ticketId: string;
  header: ReactNode;
};

export function AdminTicketDetail({ ticketId, header }: AdminTicketDetailProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showResolve, setShowResolve] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    setFeedback(null);
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`);
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

  async function updateTicket(body: { status: SupportTicket["status"]; resolutionNote?: string }) {
    if (updating || state.status !== "ready") {
      return;
    }
    setUpdating(true);
    setFeedback(null);
    setFormError(null);
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { ticket?: SupportTicket };
        error?: { message?: string };
      } | null;
      if (!response.ok || !payload?.data?.ticket) {
        setFormError(payload?.error?.message ?? "The ticket was not updated.");
        return;
      }
      setState({ status: "ready", ticket: payload.data.ticket });
      setShowResolve(false);
      setNote("");
      setFeedback(`Status is now ${payload.data.ticket.status.replaceAll("_", " ")}.`);
    } catch {
      setFormError("The ticket was not updated. Try again.");
    } finally {
      setUpdating(false);
    }
  }

  function resolve() {
    if (note.trim().length < 10) {
      setFormError("A resolution note must be at least 10 characters.");
      return;
    }
    void updateTicket({ status: "resolved", resolutionNote: note.trim() });
  }

  const ticket = state.status === "ready" ? state.ticket : null;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        {header}
        <div className={styles.backRow}>
          <Link className={styles.back} href="/admin/tickets">
            Back to admin tickets
          </Link>
        </div>

        {state.status === "loading" ? (
          <div className={styles.skeleton} aria-live="polite" aria-busy="true">
            <p className={styles.summary}>Loading ticket</p>
            <div className={styles.skeletonRow} />
          </div>
        ) : null}

        {state.status === "error" ? (
          <section className={styles.notice} role="alert">
            <h1 className={styles.noticeTitle}>This ticket could not be loaded.</h1>
            <button className={styles.button} type="button" onClick={() => void load()}>
              Retry
            </button>
          </section>
        ) : null}

        {state.status === "missing" ? (
          <section className={styles.empty}>
            <h1 className={styles.emptyTitle}>Ticket not found</h1>
            <p className={styles.emptyBody}>This support request is not in the admin queue.</p>
          </section>
        ) : null}

        {ticket ? (
          <article className={`${styles.card} ${styles.detail}`}>
            <header className={styles.cardTop}>
              <h2 className={styles.category}>{supportCategoryLabel(ticket.category)}</h2>
              <SupportStatusBadge status={ticket.status} />
            </header>
            <p className={styles.meta}>Ref {ticket.id}</p>
            <p className={styles.message}>{ticket.message}</p>
            <div className={styles.meta}>
              <time dateTime={ticket.createdAt}>Created {formatSupportDate(ticket.createdAt)}</time>
              <time dateTime={ticket.updatedAt}>Updated {formatSupportDate(ticket.updatedAt)}</time>
            </div>
            {ticket.resolutionNote ? (
              <section className={styles.resolution}>
                <h2 className={styles.resolutionTitle}>Resolution note</h2>
                <p className={styles.message}>{ticket.resolutionNote}</p>
              </section>
            ) : null}

            {feedback ? <p className={styles.summary}>{feedback}</p> : null}
            {formError ? (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            ) : null}

            <div className={styles.actions}>
              {ticket.status === "open" ? (
                <>
                  <button className={styles.button} type="button" disabled={updating} onClick={() => void updateTicket({ status: "in_progress" })}>
                    {updating ? "Saving" : "Start progress"}
                  </button>
                  <button className={`${styles.button} ${styles.secondary}`} type="button" disabled={updating} onClick={() => void updateTicket({ status: "closed" })}>
                    Close
                  </button>
                </>
              ) : null}
              {ticket.status === "in_progress" ? (
                <>
                  <button className={styles.button} type="button" disabled={updating} onClick={() => setShowResolve(true)}>
                    Resolve
                  </button>
                  <button className={`${styles.button} ${styles.secondary}`} type="button" disabled={updating} onClick={() => void updateTicket({ status: "closed" })}>
                    Close
                  </button>
                </>
              ) : null}
              {ticket.status === "resolved" ? (
                <button className={styles.button} type="button" disabled={updating} onClick={() => void updateTicket({ status: "closed" })}>
                  {updating ? "Saving" : "Close"}
                </button>
              ) : null}
              {ticket.status === "closed" ? <p className={styles.summary}>This ticket is closed.</p> : null}
            </div>

            {showResolve && ticket.status === "in_progress" ? (
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  resolve();
                }}
              >
                <label className={styles.fieldLabel} htmlFor="resolution-note">
                  Resolution note
                  <textarea
                    id="resolution-note"
                    className={`${styles.field} ${styles.textarea}`}
                    value={note}
                    disabled={updating}
                    onChange={(event) => {
                      setNote(event.target.value);
                      setFormError(null);
                    }}
                  />
                </label>
                <button className={styles.button} type="submit" disabled={updating}>
                  {updating ? "Saving" : "Save resolution"}
                </button>
              </form>
            ) : null}
          </article>
        ) : null}
        {ticket ? <SupportAlternativePanel mode="admin" ticketId={ticketId} ticketStatus={ticket.status} /> : null}
      </div>
    </main>
  );
}
