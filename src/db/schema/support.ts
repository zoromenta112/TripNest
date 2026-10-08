import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
} from "../../features/support/types";

const allowedCategories = sql.raw(
  SUPPORT_TICKET_CATEGORIES.map((category) => `'${category}'`).join(", "),
);

const allowedStatuses = sql.raw(
  SUPPORT_TICKET_STATUSES.map((status) => `'${status}'`).join(", "),
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id").notNull(),
    ownerId: uuid("owner_id").notNull(),
    bookingId: uuid("booking_id"),
    category: text("category").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"),
    resolutionNote: text("resolution_note"),
    assignedAdminId: uuid("assigned_admin_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "support_tickets_category_check",
      sql`${table.category} in (${allowedCategories})`,
    ),
    check(
      "support_tickets_status_check",
      sql`${table.status} in (${allowedStatuses})`,
    ),
    index("support_tickets_owner_id_idx").on(table.ownerId),
    index("support_tickets_trip_id_idx").on(table.tripId),
    index("support_tickets_status_idx").on(table.status),
    index("support_tickets_created_at_idx").on(table.createdAt),
  ],
);
