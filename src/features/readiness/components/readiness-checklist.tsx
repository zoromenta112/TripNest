"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { DownloadTripSummary } from "../../trip-export/download-trip-summary";
import { readinessCopy } from "../copy";
import type { ReadinessChecklistItem, ReadinessItemKey, ReadinessProgress } from "../types";
import { ReadinessItem } from "./readiness-item";
import { ReadinessProgress as ReadinessProgressCard } from "./readiness-progress";
import styles from "./readiness.module.css";

type ChecklistData = {
  items: ReadinessChecklistItem[];
  progress: ReadinessProgress;
};

type ReadinessChecklistProps = {
  tripId: string;
  header: ReactNode;
};

async function readChecklist(tripId: string, init?: RequestInit): Promise<ChecklistData> {
  const response = await fetch(`/api/trips/${tripId}/checklist`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(readinessCopy.loadError);
  }

  const body = (await response.json()) as { data?: ChecklistData };
  if (!body.data || !Array.isArray(body.data.items) || !body.data.progress) {
    throw new Error(readinessCopy.loadError);
  }

  return body.data;
}

export function ReadinessChecklist({ tripId, header }: ReadinessChecklistProps) {
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [pendingKey, setPendingKey] = useState<ReadinessItemKey | null>(null);
  const requestSeq = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setUpdateError(false);

    try {
      const next = await readChecklist(tripId);
      setData(next);
    } catch {
      setData(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleItem(item: ReadinessChecklistItem) {
    if (pendingKey === item.key) {
      return;
    }

    const requestId = requestSeq.current + 1;
    requestSeq.current = requestId;
    setPendingKey(item.key);
    setUpdateError(false);

    try {
      const next = await readChecklist(tripId, {
        method: "PATCH",
        body: JSON.stringify({
          itemKey: item.key,
          completed: !item.completed,
        }),
      });
      if (requestId !== requestSeq.current) {
        return;
      }
      setData(next);
    } catch {
      if (requestId !== requestSeq.current) {
        return;
      }
      setUpdateError(true);
    } finally {
      if (requestId === requestSeq.current) {
        setPendingKey(null);
      }
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.header}>
          {header}
          <DownloadTripSummary tripId={tripId} />
        </div>

        {loading ? <ChecklistSkeleton /> : null}

        {!loading && loadError ? (
          <section className={`${styles.card} ${styles.notice}`} role="alert">
            <h2 className={styles.noticeTitle}>{readinessCopy.loadError}</h2>
            <p className={styles.noticeBody}>{readinessCopy.loadErrorBody}</p>
            <button type="button" className={styles.retry} onClick={() => void load()}>
              {readinessCopy.retry}
            </button>
          </section>
        ) : null}

        {!loading && !loadError && data && data.items.length === 0 ? (
          <section className={`${styles.card} ${styles.empty}`}>
            <h2 className={styles.emptyTitle}>{readinessCopy.emptyTitle}</h2>
            <p className={styles.emptyBody}>{readinessCopy.emptyBody}</p>
          </section>
        ) : null}

        {!loading && !loadError && data && data.items.length > 0 ? (
          <>
            <ReadinessProgressCard progress={data.progress} />
            {updateError ? (
              <p className={styles.updateError} role="alert">
                {readinessCopy.updateError}
              </p>
            ) : null}
            <ul className={styles.list}>
              {data.items.map((item) => (
                <ReadinessItem
                  key={item.key}
                  item={item}
                  pending={pendingKey === item.key}
                  onToggle={(selected) => void toggleItem(selected)}
                />
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </main>
  );
}

function ChecklistSkeleton() {
  return (
    <div className={styles.skeleton} aria-live="polite" aria-busy="true">
      <p className={styles.summary}>{readinessCopy.loading}</p>
      <div className={styles.skeletonBlock} />
      <div className={styles.skeletonRow} />
      <div className={styles.skeletonRow} />
      <div className={styles.skeletonRow} />
    </div>
  );
}
