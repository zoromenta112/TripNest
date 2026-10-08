import {
  applyAdminTicketChange,
  createSupportTicket as insertSupportTicket,
  getSupportTicketById,
  getSupportTicketsByOwnerId,
  listSupportTicketsForAdmin,
} from "./repository";
import type { UpdateAdminSupportTicketInput } from "./schemas";
import type {
  CreateSupportTicketInput,
  SupportTicket,
  SupportTicketStatus,
} from "./types";

export class SupportWorkflowError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "INVALID_TRANSITION" | "INVALID_NOTE",
    message: string,
  ) {
    super(message);
  }
}

function allowedTransitions(status: SupportTicketStatus): readonly SupportTicketStatus[] {
  switch (status) {
    case "open":
      return ["in_progress", "closed"];
    case "in_progress":
      return ["resolved", "closed"];
    case "resolved":
      return ["closed"];
    case "closed":
      return [];
    default: {
      const unreachable: never = status;
      return unreachable;
    }
  }
}

export async function createSupportTicket(input: {
  ownerId: string;
  ticket: CreateSupportTicketInput;
}): Promise<SupportTicket> {
  return insertSupportTicket({
    ownerId: input.ownerId,
    tripId: input.ticket.tripId,
    category: input.ticket.category,
    message: input.ticket.message,
  });
}

export async function listSupportTicketsForOwner(
  ownerId: string,
): Promise<SupportTicket[]> {
  return getSupportTicketsByOwnerId(ownerId);
}

export async function getSupportTicketForOwner(
  ticketId: string,
  ownerId: string,
): Promise<SupportTicket | null> {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket || ticket.ownerId !== ownerId) {
    return null;
  }

  return ticket;
}

export async function listSupportTicketsForAdminView(status?: SupportTicketStatus) {
  return listSupportTicketsForAdmin(status);
}

export async function getSupportTicketForAdmin(ticketId: string) {
  return getSupportTicketById(ticketId);
}

export async function updateSupportTicketForAdmin(input: {
  ticketId: string;
  actorId: string;
  update: UpdateAdminSupportTicketInput;
}): Promise<SupportTicket> {
  const current = await getSupportTicketById(input.ticketId);
  if (!current) {
    throw new SupportWorkflowError("NOT_FOUND", "Support ticket not found.");
  }

  const nextStatus = input.update.status ?? current.status;
  const statusChanged = nextStatus !== current.status;
  if (statusChanged && !allowedTransitions(current.status).includes(nextStatus)) {
    throw new SupportWorkflowError(
      "INVALID_TRANSITION",
      `Cannot move a ticket from ${current.status} to ${nextStatus}.`,
    );
  }

  if (current.status === "closed" && input.update.resolutionNote) {
    throw new SupportWorkflowError("INVALID_TRANSITION", "Closed tickets cannot be changed.");
  }

  const nextNote =
    typeof input.update.resolutionNote === "string"
      ? input.update.resolutionNote
      : current.resolutionNote;
  const noteChanged = nextNote !== current.resolutionNote;

  if (nextStatus === "resolved" && (!nextNote || nextNote.length < 10)) {
    throw new SupportWorkflowError(
      "INVALID_NOTE",
      "A resolution note of at least 10 characters is required to resolve a ticket.",
    );
  }

  if (!statusChanged && !noteChanged) {
    return current;
  }

  const metadata = { previousStatus: current.status, newStatus: nextStatus };
  const audits: Array<{
    actorId: string;
    action: "support_ticket_status_changed" | "support_ticket_resolution_updated";
    metadata: Record<string, string>;
  }> = [];
  if (statusChanged) {
    audits.push({
      actorId: input.actorId,
      action: "support_ticket_status_changed",
      metadata,
    });
  }
  if (noteChanged) {
    audits.push({
      actorId: input.actorId,
      action: "support_ticket_resolution_updated",
      metadata,
    });
  }

  return applyAdminTicketChange({
    ticketId: current.id,
    status: nextStatus,
    resolutionNote: nextNote,
    assignedAdminId: input.actorId,
    audits,
  });
}
