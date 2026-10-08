"use client";

import { useState } from "react";

import styles from "../readiness/components/readiness.module.css";

type DownloadTripSummaryProps = {
  tripId: string;
};

export function DownloadTripSummary({ tripId }: DownloadTripSummaryProps) {
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    if (downloading) {
      return;
    }
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/trips/${tripId}/export`);
      if (!response.ok) {
        setError("The trip summary could not be downloaded.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tripnest-trip-summary.html";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("The trip summary could not be downloaded.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <button className={styles.retry} type="button" onClick={() => void download()} disabled={downloading}>
        {downloading ? "Preparing summary" : "Download trip summary"}
      </button>
      {error ? (
        <p className={styles.updateError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
