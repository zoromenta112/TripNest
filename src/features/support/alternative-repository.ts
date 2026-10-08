import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { supportAlternatives } from "../../db/schema/support-alternative";
import type {
  SupportAlternative,
  SupportAlternativeDecision,
  SupportAlternativeStatus,
} from "./types";

function toIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function toAlternative(row: typeof supportAlternatives.$inferSelect): SupportAlternative {
  return {
    id: row.id,
    ticketId: row.ticketId,
    proposedBy: row.proposedBy,
    status: row.status as SupportAlternativeStatus,
    originalTitle: row.originalTitle,
    originalStartAt: toIso(row.originalStartAt),
    originalEndAt: toIso(row.originalEndAt),
    originalPriceMinor: row.originalPriceMinor,
    alternativeTitle: row.alternativeTitle,
    alternativeStartAt: toIso(row.alternativeStartAt),
    alternativeEndAt: toIso(row.alternativeEndAt),
    alternativePriceMinor: row.alternativePriceMinor,
    currency: row.currency,
    travelerNote: row.travelerNote,
    proposedAt: row.proposedAt.toISOString(),
    decidedAt: toIso(row.decidedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

export async function getLatestSupportAlternative(ticketId: string) {
  const [row] = await db
    .select()
    .from(supportAlternatives)
    .where(eq(supportAlternatives.ticketId, ticketId))
    .orderBy(desc(supportAlternatives.proposedAt))
    .limit(1);

  return row ? toAlternative(row) : null;
}

export async function insertSupportAlternative(input: {
  ticketId: string;
  proposedBy: string;
  originalTitle: string;
  originalStartAt?: string | null;
  originalEndAt?: string | null;
  originalPriceMinor?: number | null;
  alternativeTitle: string;
  alternativeStartAt?: string | null;
  alternativeEndAt?: string | null;
  alternativePriceMinor?: number | null;
  currency: string;
}) {
  const metadata = JSON.stringify({ ticketId: input.ticketId });
  const result = await db.execute<{ id: string }>(sql`
    WITH created AS (
      INSERT INTO support_alternatives (
        ticket_id, proposed_by, status, original_title, original_start_at, original_end_at,
        original_price_minor, alternative_title, alternative_start_at, alternative_end_at,
        alternative_price_minor, currency
      )
      VALUES (
        ${input.ticketId}::uuid,
        ${input.proposedBy}::uuid,
        'pending',
        ${input.originalTitle},
        ${toDate(input.originalStartAt)},
        ${toDate(input.originalEndAt)},
        ${input.originalPriceMinor ?? null},
        ${input.alternativeTitle},
        ${toDate(input.alternativeStartAt)},
        ${toDate(input.alternativeEndAt)},
        ${input.alternativePriceMinor ?? null},
        ${input.currency}
      )
      RETURNING id
    ),
    audited AS (
      INSERT INTO audit_events (actor_id, action, entity_type, entity_id, metadata)
      SELECT ${input.proposedBy}::uuid, 'support_alternative_proposed', 'support_alternative', created.id, ${metadata}::jsonb
      FROM created
      RETURNING entity_id
    )
    SELECT id FROM created
  `);

  const createdId = result.rows[0]?.id;
  if (!createdId) {
    throw new Error("Unable to propose alternative");
  }

  const [row] = await db
    .select()
    .from(supportAlternatives)
    .where(eq(supportAlternatives.id, createdId));

  if (!row) {
    throw new Error("Unable to propose alternative");
  }
  return toAlternative(row);
}

export async function decideSupportAlternativeRow(input: {
  alternativeId: string;
  actorId: string;
  decision: SupportAlternativeDecision;
  travelerNote: string | null;
}) {
  const action =
    input.decision === "accepted"
      ? "support_alternative_accepted"
      : "support_alternative_rejected";
  const metadata = JSON.stringify({ decision: input.decision });
  const result = await db.execute<{
    id: string;
  }>(sql`
    WITH updated AS (
      UPDATE support_alternatives
      SET status = ${input.decision},
          traveler_note = ${input.travelerNote},
          decided_at = now(),
          updated_at = now()
      WHERE id = ${input.alternativeId}::uuid
        AND status = 'pending'
      RETURNING id
    ),
    audited AS (
      INSERT INTO audit_events (actor_id, action, entity_type, entity_id, metadata)
      SELECT ${input.actorId}::uuid, ${action}, 'support_alternative', updated.id, ${metadata}::jsonb
      FROM updated
      RETURNING entity_id
    )
    SELECT id FROM updated
  `);

  const updatedId = result.rows[0]?.id;
  if (!updatedId) {
    return null;
  }

  const [row] = await db
    .select()
    .from(supportAlternatives)
    .where(and(eq(supportAlternatives.id, updatedId)));

  return row ? toAlternative(row) : null;
}
