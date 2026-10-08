import { z } from "zod";

import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_STATUSES,
} from "./types";

export const supportTicketStatusSchema = z.enum(SUPPORT_TICKET_STATUSES);

export const supportTicketCategorySchema = z.enum(SUPPORT_TICKET_CATEGORIES);

export const createSupportTicketSchema = z
  .object({
    tripId: z.uuid(),
    category: supportTicketCategorySchema,
    message: z.string().trim().min(10).max(2000),
  })
  .strict();

export const updateAdminSupportTicketSchema = z
  .object({
    status: supportTicketStatusSchema.optional(),
    resolutionNote: z.union([z.string().trim().min(10).max(2000), z.null()]).optional(),
  })
  .strict();

export type UpdateAdminSupportTicketInput = z.infer<typeof updateAdminSupportTicketSchema>;

const optionalTimestamp = z.iso.datetime().nullable().optional();
const optionalPriceMinor = z.number().int().nonnegative().max(100_000_000).nullable().optional();

export const createSupportAlternativeSchema = z
  .object({
    originalTitle: z.string().trim().min(1).max(200),
    originalStartAt: optionalTimestamp,
    originalEndAt: optionalTimestamp,
    originalPriceMinor: optionalPriceMinor,
    alternativeTitle: z.string().trim().min(1).max(200),
    alternativeStartAt: optionalTimestamp,
    alternativeEndAt: optionalTimestamp,
    alternativePriceMinor: optionalPriceMinor,
    currency: z.string().trim().length(3).optional(),
  })
  .strict();

export const decideSupportAlternativeSchema = z
  .object({
    decision: z.enum(["accepted", "rejected"]),
    travelerNote: z.string().trim().max(2000).optional(),
  })
  .strict();

export type CreateSupportAlternativeInput = z.infer<typeof createSupportAlternativeSchema>;
export type DecideSupportAlternativeInput = z.infer<typeof decideSupportAlternativeSchema>;
