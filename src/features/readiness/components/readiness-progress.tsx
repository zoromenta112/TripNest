import { readinessCopy } from "../copy";
import type { ReadinessProgress } from "../types";
import styles from "./readiness.module.css";

type ReadinessProgressProps = {
  progress: ReadinessProgress;
};

export function ReadinessProgress({ progress }: ReadinessProgressProps) {
  const remaining = Math.max(progress.total - progress.completed, 0);

  return (
    <section className={`${styles.card} ${styles.progress}`} aria-labelledby="readiness-progress-label">
      <div className={styles.progressTop}>
        <h2 id="readiness-progress-label" className={styles.progressLabel}>
          {readinessCopy.progressLabel}
        </h2>
        <p className={styles.percentage}>{progress.percentage}%</p>
      </div>
      <ul className={styles.counts}>
        <li>
          {readinessCopy.completedLabel}: {progress.completed}
        </li>
        <li>
          {readinessCopy.remainingLabel}: {remaining}
        </li>
      </ul>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percentage}
        aria-valuetext={`${progress.completed} of ${progress.total} completed`}
      >
        <div className={styles.fill} style={{ width: `${progress.percentage}%` }} />
      </div>
    </section>
  );
}
