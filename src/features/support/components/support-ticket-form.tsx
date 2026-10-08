import { useState, type FormEvent } from "react";

import { SUPPORT_TICKET_CATEGORIES, type SupportTicketCategory } from "../types";
import { supportCategoryLabel } from "./support-status-badge";
import styles from "./support.module.css";

type SupportTicketFormProps = {
  saving: boolean;
  serverError: string | null;
  onCancel: () => void;
  onSubmit: (input: { category: SupportTicketCategory; message: string }) => void;
};

export function SupportTicketForm({
  saving,
  serverError,
  onCancel,
  onSubmit,
}: SupportTicketFormProps) {
  const [category, setCategory] = useState<SupportTicketCategory>("transport");
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) {
      return;
    }

    const trimmed = message.trim();
    if (trimmed.length < 10) {
      setFieldError("Message must be at least 10 characters.");
      return;
    }
    if (trimmed.length > 2000) {
      setFieldError("Message must be 2000 characters or fewer.");
      return;
    }

    setFieldError(null);
    onSubmit({ category, message: trimmed });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.formTitle}>Create support request</h2>
      <label className={styles.fieldLabel} htmlFor="support-category">
        Category
        <select
          id="support-category"
          className={styles.field}
          value={category}
          disabled={saving}
          onChange={(event) => setCategory(event.target.value as SupportTicketCategory)}
        >
          {SUPPORT_TICKET_CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {supportCategoryLabel(value)}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.fieldLabel} htmlFor="support-message">
        Message
        <textarea
          id="support-message"
          className={`${styles.field} ${styles.textarea}`}
          value={message}
          disabled={saving}
          maxLength={2000}
          onChange={(event) => {
            setMessage(event.target.value);
            setFieldError(null);
          }}
        />
      </label>
      <p className={styles.fieldHint}>At least 10 characters.</p>
      {fieldError ? (
        <p className={styles.fieldError} role="alert">
          {fieldError}
        </p>
      ) : null}
      {serverError ? (
        <p className={styles.formError} role="alert">
          {serverError}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={saving}>
          {saving ? "Sending" : "Send request"}
        </button>
        <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
