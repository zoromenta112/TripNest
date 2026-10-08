import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { SUPPORT_ALTERNATIVE_STATUSES } from "../../features/support/types";

const allowedStatuses = sql.raw(
  SUPPORT_ALTERNATIVE_STATUSES.map((status) => `'${status}'`).join(", "),
);

export const supportAlternatives = pgTable(
  "support_alternatives",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ticketId: uuid("ticket_id").notNull(),
    proposedBy: uuid("proposed_by").notNull(),
    status: text("status").notNull().default("pending"),
    originalTitle: text("original_title").notNull(),
    originalStartAt: timestamp("original_start_at", { withTimezone: true }),
    originalEndAt: timestamp("original_end_at", { withTimezone: true }),
    originalPriceMinor: integer("original_price_minor"),
    alternativeTitle: text("alternative_title").notNull(),
    alternativeStartAt: timestamp("alternative_start_at", { withTimezone: true }),
    alternativeEndAt: timestamp("alternative_end_at", { withTimezone: true }),
    alternativePriceMinor: integer("alternative_price_minor"),
    currency: text("currency").notNull().default("EUR"),
    travelerNote: text("traveler_note"),
    proposedAt: timestamp("proposed_at", { withTimezone: true }).defaultNow().notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("support_alternatives_status_check", sql`${table.status} in (${allowedStatuses})`),
    uniqueIndex("support_alternatives_one_pending")
      .on(table.ticketId)
      .where(sql`${table.status} = 'pending'`),
  ],
);
