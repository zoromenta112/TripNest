import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { READINESS_ITEM_KEYS } from "../../features/readiness/types";

const allowedItemKeys = sql.raw(
  READINESS_ITEM_KEYS.map((key) => `'${key}'`).join(", "),
);

export const tripChecklist = pgTable(
  "trip_checklist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tripId: uuid("trip_id").notNull(),
    itemKey: text("item_key").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("trip_checklist_trip_item_unique").on(table.tripId, table.itemKey),
    check(
      "trip_checklist_item_key_check",
      sql`${table.itemKey} in (${allowedItemKeys})`,
    ),
  ],
);
