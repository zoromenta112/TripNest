"use client";

import { useCallback, useEffect, useState } from "react";

import { TripNestHeader } from "../../components/branding/tripnest-header";
import { SupportEmptyState } from "../../features/support/components/support-empty-state";
import { SupportTicketCard } from "../../features/support/components/support-ticket-card";
import { SupportTicketForm } from "../../features/support/components/support-ticket-form";
import styles from "../../features/support/components/support.module.css";
import type { SupportTicket, SupportTicketCategory } from "../../features/support/types";

const DEVELOPMENT_TRIP_ID = "11111111-1111-4111-8111-111111111111";

type TicketList = {
  tickets: SupportTicket[];
};

async function readTickets(): Promise<TicketList> {
  const response = await fetch("/api/tickets");
  if (!response.ok) {
    throw new Error("Unable to load support tickets.");
  }
  const body = (await response.json()) as { data?: TicketList };
  if (!body.data || !Array.isArray(body.data.tickets)) {
    throw new Error("Unable to load support tickets.");
  }
  return body.data;
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await readTickets();
      setTickets(data.tickets);
    } catch {
      setTickets(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTicket(input: { category: SupportTicketCategory; message: string }) {
    if (saving) {
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: DEVELOPMENT_TRIP_ID,
          category: input.category,
          message: input.message,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
        setServerError(body?.error?.message ?? "The request was not sent. Check the message and try again.");
        return;
      }
      setCreating(false);
      await load();
    } catch {
      setServerError("The request was not sent. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.toolbar}>
          <TripNestHeader
            title="Support Center"
            subtitle="Track and manage travel assistance requests."
          />
          {!creating ? (
            <button className={styles.button} type="button" onClick={() => setCreating(true)}>
              Create support request
            </button>
          ) : null}
        </div>

        {creating ? (
          <SupportTicketForm
            saving={saving}
            serverError={serverError}
            onCancel={() => {
              if (!saving) {
                setCreating(false);
                setServerError(null);
              }
            }}
            onSubmit={(input) => void createTicket(input)}
          />
        ) : null}

        {loading ? (
          <div className={styles.skeleton} aria-live="polite" aria-busy="true">
            <p className={styles.summary}>Loading support requests</p>
            <div className={styles.skeletonRow} />
            <div className={styles.skeletonRow} />
          </div>
        ) : null}

        {!loading && loadError ? (
          <section className={styles.notice} role="alert">
            <h2 className={styles.noticeTitle}>Support requests could not be loaded.</h2>
            <p className={styles.noticeBody}>Check the connection and try again.</p>
            <button className={styles.button} type="button" onClick={() => void load()}>
              Retry
            </button>
          </section>
        ) : null}

        {!loading && !loadError && tickets && tickets.length === 0 ? <SupportEmptyState /> : null}

        {!loading && !loadError && tickets && tickets.length > 0 ? (
          <ul className={styles.list}>
            {tickets.map((ticket) => (
              <SupportTicketCard key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        ) : null}
      </div>
    </main>
  );
}
