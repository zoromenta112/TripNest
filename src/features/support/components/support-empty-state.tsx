import styles from "./support.module.css";

export function SupportEmptyState() {
  return (
    <section className={styles.empty}>
      <h2 className={styles.emptyTitle}>No support requests yet</h2>
      <p className={styles.emptyBody}>
        Create a request if a booking, transfer, or trip detail needs help.
      </p>
    </section>
  );
}
