"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import type { SupportAlternative, SupportTicketStatus } from "../types";
import styles from "./support.module.css";

type SupportAlternativePanelProps = {
  ticketId: string;
  mode: "admin" | "traveler";
  ticketStatus?: SupportTicketStatus;
};

function formatPrice(minor: number | null, currency: string) {
  if (minor === null) {
    return "Not specified";
  }
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

function formatWhen(value: string | null) {
  if (!value) {
    return "Not specified";
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function priceDifference(alternative: SupportAlternative) {
  if (alternative.originalPriceMinor === null || alternative.alternativePriceMinor === null) {
    return "Not calculable";
  }
  const difference = alternative.alternativePriceMinor - alternative.originalPriceMinor;
  const sign = difference > 0 ? "+" : "";
  return `${sign}${(difference / 100).toFixed(2)} ${alternative.currency}`;
}

function timeDifference(alternative: SupportAlternative) {
  if (!alternative.originalStartAt || !alternative.alternativeStartAt) {
    return "Not calculable";
  }
  const minutes = Math.round(
    (new Date(alternative.alternativeStartAt).getTime() - new Date(alternative.originalStartAt).getTime()) / 60000,
  );
  if (minutes === 0) {
    return "Same start time";
  }
  const direction = minutes > 0 ? "later" : "earlier";
  const absolute = Math.abs(minutes);
  if (absolute % 60 === 0) {
    const hours = absolute / 60;
    return `${hours} hour${hours === 1 ? "" : "s"} ${direction}`;
  }
  return `${absolute} minutes ${direction}`;
}

function toIso(value: string) {
  if (!value) {
    return null;
  }
  return new Date(value).toISOString();
}

function toMinor(value: string) {
  if (!value.trim()) {
    return null;
  }
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }
  return Math.round(amount * 100);
}

export function SupportAlternativePanel({ ticketId, mode, ticketStatus }: SupportAlternativePanelProps) {
  const [alternative, setAlternative] = useState<SupportAlternative | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalRecorded, setApprovalRecorded] = useState(false);
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalTime, setOriginalTime] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [alternativeTitle, setAlternativeTitle] = useState("");
  const [alternativeTime, setAlternativeTime] = useState("");
  const [alternativePrice, setAlternativePrice] = useState("");

  const endpoint =
    mode === "admin"
      ? `/api/admin/tickets/${ticketId}/alternative`
      : `/api/tickets/${ticketId}/alternative`;

  const load = useCallback(async () => {
    setLoaded(false);
    try {
      const response = await fetch(endpoint);
      if (response.status === 404) {
        setAlternative(null);
        setLoaded(true);
        return;
      }
      if (!response.ok) {
        setError("The alternative could not be loaded.");
        setLoaded(true);
        return;
      }
      const body = (await response.json()) as { data?: { alternative?: SupportAlternative } };
      setAlternative(body.data?.alternative ?? null);
      setLoaded(true);
    } catch {
      setError("The alternative could not be loaded.");
      setLoaded(true);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  async function propose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }
    const originalPriceMinor = toMinor(originalPrice);
    const alternativePriceMinor = toMinor(alternativePrice);
    if (originalPriceMinor === undefined || alternativePriceMinor === undefined) {
      setError("Enter prices as positive amounts, or leave them blank.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTitle,
          originalStartAt: toIso(originalTime),
          originalPriceMinor,
          alternativeTitle,
          alternativeStartAt: toIso(alternativeTime),
          alternativePriceMinor,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { alternative?: SupportAlternative };
        error?: { message?: string };
      } | null;
      if (!response.ok || !body?.data?.alternative) {
        setError(body?.error?.message ?? "The alternative was not proposed.");
        return;
      }
      setAlternative(body.data.alternative);
      setShowForm(false);
    } catch {
      setError("The alternative was not proposed.");
    } finally {
      setSaving(false);
    }
  }

  async function decide(decision: "accepted" | "rejected") {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { alternative?: SupportAlternative; replacementExecutionRequired?: boolean };
        error?: { message?: string };
      } | null;
      if (!response.ok || !body?.data?.alternative) {
        setError(body?.error?.message ?? "The decision was not saved.");
        return;
      }
      setAlternative(body.data.alternative);
      setApprovalRecorded(body.data.replacementExecutionRequired === true);
    } catch {
      setError("The decision was not saved.");
    } finally {
      setSaving(false);
    }
  }

  const canPropose = mode === "admin" && ticketStatus === "in_progress" && alternative?.status !== "pending";

  return (
    <section className={`${styles.card} ${styles.detail}`}>
      <h2 className={styles.formTitle}>Alternative proposal</h2>
      {!loaded ? <p className={styles.summary}>Loading alternative</p> : null}
      {error ? (
        <p className={styles.formError} role="alert">
          {error}
        </p>
      ) : null}
      {alternative ? (
        <>
          <div className={styles.meta}>
            <span>Status: {alternative.status}</span>
          </div>
          <div className={styles.list}>
            <div>
              <h3 className={styles.resolutionTitle}>Original</h3>
              <p className={styles.preview}>{alternative.originalTitle}</p>
              <p className={styles.meta}>Time: {formatWhen(alternative.originalStartAt)}</p>
              <p className={styles.meta}>{formatPrice(alternative.originalPriceMinor, alternative.currency)}</p>
            </div>
            <div>
              <h3 className={styles.resolutionTitle}>Proposed alternative</h3>
              <p className={styles.preview}>{alternative.alternativeTitle}</p>
              <p className={styles.meta}>Time: {formatWhen(alternative.alternativeStartAt)}</p>
              <p className={styles.meta}>{formatPrice(alternative.alternativePriceMinor, alternative.currency)}</p>
            </div>
          </div>
          <p className={styles.meta}>Price difference: {priceDifference(alternative)}</p>
          <p className={styles.meta}>Time difference: {timeDifference(alternative)}</p>
        </>
      ) : null}
      {loaded && !alternative && mode === "traveler" ? (
        <p className={styles.summary}>No alternative has been proposed yet.</p>
      ) : null}
      {mode === "traveler" && (approvalRecorded || alternative?.status === "accepted") ? (
        <p className={styles.summary}>
          Your approval has been recorded. The booking replacement has not been executed yet.
        </p>
      ) : null}
      {alternative?.status === "rejected" ? (
        <p className={styles.summary}>This alternative was rejected. No booking was changed.</p>
      ) : null}
      {mode === "traveler" && alternative?.status === "pending" ? (
        <div className={styles.actions}>
          <button className={styles.button} type="button" disabled={saving} onClick={() => void decide("accepted")}>
            {saving ? "Saving" : "Accept alternative"}
          </button>
          <button className={`${styles.button} ${styles.secondary}`} type="button" disabled={saving} onClick={() => void decide("rejected")}>
            Reject alternative
          </button>
        </div>
      ) : null}
      {canPropose && !showForm ? (
        <button className={styles.button} type="button" onClick={() => setShowForm(true)}>
          Propose Alternative
        </button>
      ) : null}
      {showForm ? (
        <form className={styles.form} onSubmit={(event) => void propose(event)}>
          <label className={styles.fieldLabel} htmlFor="original-title">
            Original title
            <input id="original-title" className={styles.field} value={originalTitle} onChange={(event) => setOriginalTitle(event.target.value)} required />
          </label>
          <label className={styles.fieldLabel} htmlFor="original-time">
            Original time
            <input id="original-time" className={styles.field} type="datetime-local" value={originalTime} onChange={(event) => setOriginalTime(event.target.value)} />
          </label>
          <label className={styles.fieldLabel} htmlFor="original-price">
            Original price
            <input id="original-price" className={styles.field} inputMode="decimal" value={originalPrice} onChange={(event) => setOriginalPrice(event.target.value)} />
          </label>
          <label className={styles.fieldLabel} htmlFor="alternative-title">
            Alternative title
            <input id="alternative-title" className={styles.field} value={alternativeTitle} onChange={(event) => setAlternativeTitle(event.target.value)} required />
          </label>
          <label className={styles.fieldLabel} htmlFor="alternative-time">
            Alternative time
            <input id="alternative-time" className={styles.field} type="datetime-local" value={alternativeTime} onChange={(event) => setAlternativeTime(event.target.value)} />
          </label>
          <label className={styles.fieldLabel} htmlFor="alternative-price">
            Alternative price
            <input id="alternative-price" className={styles.field} inputMode="decimal" value={alternativePrice} onChange={(event) => setAlternativePrice(event.target.value)} />
          </label>
          <button className={styles.button} type="submit" disabled={saving}>
            {saving ? "Sending" : "Send proposal"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
