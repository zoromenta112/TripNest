import { eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { tripChecklist } from "../../db/schema/readiness";
import { readinessItemKeySchema } from "./schemas";
import type { ReadinessItem, ReadinessItemKey } from "./types";

export async function getReadinessItemsByTripId(
  tripId: string,
): Promise<ReadinessItem[]> {
  const rows = await db
    .select()
    .from(tripChecklist)
    .where(eq(tripChecklist.tripId, tripId));

  return rows.flatMap((row) => {
    const itemKey = readinessItemKeySchema.safeParse(row.itemKey);
    if (!itemKey.success) {
      return [];
    }

    return [
      {
        id: row.id,
        tripId: row.tripId,
        itemKey: itemKey.data,
        completedAt: row.completedAt?.toISOString() ?? null,
      },
    ];
  });
}

export async function updateReadinessItem(input: {
  tripId: string;
  itemKey: ReadinessItemKey;
  completed: boolean;
}): Promise<void> {
  const completedAt = input.completed ? sql`now()` : null;

  await db
    .insert(tripChecklist)
    .values({
      tripId: input.tripId,
      itemKey: input.itemKey,
      completedAt,
      updatedAt: sql`now()`,
    })
    .onConflictDoUpdate({
      target: [tripChecklist.tripId, tripChecklist.itemKey],
      set: {
        completedAt,
        updatedAt: sql`now()`,
      },
    });
}
