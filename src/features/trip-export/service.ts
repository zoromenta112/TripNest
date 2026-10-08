import { getReadinessItemsByTripId } from "../readiness/repository";
import {
  buildReadinessChecklist,
  calculateReadinessProgress,
} from "../readiness/service";
import { DEVELOPMENT_OWNER_ID } from "../support/development-owner";
import { listSupportTicketsForOwner } from "../support/service";
import { SUPPORT_TICKET_STATUSES, type SupportTicketStatus } from "../support/types";

const statusLabels: Record<SupportTicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};
import { findDevelopmentTrip } from "./development-trip";
import type { TripSummary } from "./types";

export class TripExportError extends Error {
  constructor(public readonly code: "NOT_FOUND", message: string) {
    super(message);
  }
}

export async function buildTripSummary(tripId: string): Promise<TripSummary> {
  const trip = findDevelopmentTrip(tripId);
  if (!trip) {
    throw new TripExportError("NOT_FOUND", "Trip summary was not found.");
  }

  const savedItems = await getReadinessItemsByTripId(tripId);
  const checklist = buildReadinessChecklist(savedItems);
  const progress = calculateReadinessProgress(checklist);
  const tickets = (await listSupportTicketsForOwner(DEVELOPMENT_OWNER_ID)).filter(
    (ticket) => ticket.tripId === tripId,
  );

  return {
    tripName: trip.name,
    origin: trip.origin,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelerCount: trip.travelerCount,
    currency: trip.currency,
    bookingReferences: trip.bookingReferences,
    readiness: {
      completed: progress.completed,
      total: progress.total,
      percentage: progress.percentage,
    },
    support: {
      total: tickets.length,
      byStatus: SUPPORT_TICKET_STATUSES.map((status) => ({
        status,
        label: statusLabels[status],
        count: tickets.filter((ticket) => ticket.status === status).length,
      })),
    },
  };
}
