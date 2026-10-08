export const SUPPORT_TICKET_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;

export const SUPPORT_TICKET_CATEGORIES = [
  "transport",
  "accommodation",
  "booking",
  "esim",
  "activity",
  "other",
] as const;

export type SupportTicketStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export type SupportTicketCategory = (typeof SUPPORT_TICKET_CATEGORIES)[number];

export type SupportTicket = {
  id: string;
  tripId: string;
  ownerId: string;
  bookingId: string | null;
  category: SupportTicketCategory;
  message: string;
  status: SupportTicketStatus;
  resolutionNote: string | null;
  assignedAdminId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportTicketInput = {
  tripId: string;
  category: SupportTicketCategory;
  message: string;
};

export const SUPPORT_ALTERNATIVE_STATUSES = ["pending", "accepted", "rejected"] as const;

export type SupportAlternativeStatus = (typeof SUPPORT_ALTERNATIVE_STATUSES)[number];

export type SupportAlternativeDecision = "accepted" | "rejected";

export type SupportAlternative = {
  id: string;
  ticketId: string;
  proposedBy: string;
  status: SupportAlternativeStatus;
  originalTitle: string;
  originalStartAt: string | null;
  originalEndAt: string | null;
  originalPriceMinor: number | null;
  alternativeTitle: string;
  alternativeStartAt: string | null;
  alternativeEndAt: string | null;
  alternativePriceMinor: number | null;
  currency: string;
  travelerNote: string | null;
  proposedAt: string;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
