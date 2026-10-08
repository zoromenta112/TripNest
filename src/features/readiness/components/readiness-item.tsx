import { readinessCopy } from "../copy";
import type { ReadinessChecklistItem } from "../types";
import styles from "./readiness.module.css";

type ReadinessItemProps = {
  item: ReadinessChecklistItem;
  pending: boolean;
  onToggle: (item: ReadinessChecklistItem) => void;
};

export function ReadinessItem({ item, pending, onToggle }: ReadinessItemProps) {
  const status = pending
    ? readinessCopy.saving
    : item.completed
      ? readinessCopy.completedState
      : readinessCopy.incompleteState;
  const action = item.completed
    ? readinessCopy.markIncomplete
    : readinessCopy.markComplete;

  return (
    <li>
      <button
        type="button"
        className={`${styles.item} ${item.completed ? styles.itemCompleted : ""}`}
        aria-pressed={item.completed}
        aria-busy={pending}
        disabled={pending}
        onClick={() => onToggle(item)}
      >
        <span className={styles.marker} aria-hidden="true">
          {item.completed ? "✓" : ""}
        </span>
        <span className={styles.copy}>
          <span className={styles.itemTitle}>{item.title}</span>
          <span className={styles.itemDescription}>{item.description}</span>
        </span>
        <span className={styles.status}>
          {status}. {action}
        </span>
      </button>
    </li>
  );
}
