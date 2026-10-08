import type { TripSummary } from "./types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function list(items: string[]) {
  if (items.length === 0) {
    return "<p>None recorded.</p>";
  }
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

export function renderTripSummaryHtml(summary: TripSummary) {
  const references = list(summary.bookingReferences);
  const supportRows = summary.support.byStatus
    .map(
      (item) =>
        `<li>${escapeHtml(item.label)}: ${item.count}</li>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TripNest trip summary</title>
  <style>
    body { margin: 0; font-family: "Segoe UI", system-ui, sans-serif; color: #1c2430; background: #f3f6f4; }
    main { width: min(100% - 32px, 720px); margin: 32px auto; }
    h1, h2, p { margin: 0; }
    h1 { font-size: 2rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.05rem; margin-bottom: 8px; }
    .brand { color: #0f6e6e; font-weight: 700; margin-bottom: 8px; }
    .section { background: #fff; border: 1px solid #e2e8e4; border-radius: 16px; padding: 20px; margin-top: 16px; }
    ul { margin: 8px 0 0; padding-inline-start: 1.2rem; }
    .note { color: #5c6b73; line-height: 1.5; }
    @media print { body { background: #fff; } main { width: auto; margin: 0; } .section { break-inside: avoid; } }
  </style>
</head>
<body>
  <main>
    <p class="brand">TripNest</p>
    <h1>Trip Summary</h1>
    <section class="section">
      <h2>Trip overview</h2>
      <p>${escapeHtml(summary.tripName)}</p>
      <p>${escapeHtml(summary.origin)} to ${escapeHtml(summary.destination)}</p>
      <p>${escapeHtml(summary.startDate)} to ${escapeHtml(summary.endDate)}</p>
      <p>${summary.travelerCount} travelers · ${escapeHtml(summary.currency)}</p>
      <p>Booking references</p>
      ${references}
    </section>
    <section class="section">
      <h2>Readiness</h2>
      <p>${summary.readiness.completed} of ${summary.readiness.total} complete (${summary.readiness.percentage}%)</p>
    </section>
    <section class="section">
      <h2>Support</h2>
      <p>${summary.support.total} requests</p>
      <ul>${supportRows}</ul>
    </section>
    <section class="section">
      <p class="note">This is a TripNest academic demo summary. Travel services and transactions are simulated.</p>
    </section>
  </main>
</body>
</html>`;
}
