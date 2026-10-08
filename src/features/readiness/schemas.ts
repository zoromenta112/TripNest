import { z } from "zod";

import { READINESS_ITEM_KEYS } from "./types";

export const readinessItemKeySchema = z.enum(READINESS_ITEM_KEYS);

export const updateReadinessItemSchema = z.object({
  itemKey: readinessItemKeySchema,
  completed: z.boolean(),
});

export type UpdateReadinessItemInput = z.infer<
  typeof updateReadinessItemSchema
>;