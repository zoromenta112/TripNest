import {
  decideSupportAlternativeRow,
  getLatestSupportAlternative,
  insertSupportAlternative,
} from "./alternative-repository";
import { getSupportTicketById } from "./repository";
import type { CreateSupportAlternativeInput, DecideSupportAlternativeInput } from "./schemas";
import type { SupportAlternative } from "./types";

export class SupportAlternativeError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

function isPendingConflict(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("support_alternatives_one_pending");
}

export async function proposeSupportAlternative(input: {
  ticketId: string;
  proposedBy: string;
  proposal: CreateSupportAlternativeInput;
}): Promise<SupportAlternative> {
  const ticket = await getSupportTicketById(input.ticketId);
  if (!ticket) {
    throw new SupportAlternativeError("NOT_FOUND", "Support ticket not found.");
  }
  if (ticket.status === "closed") {
    throw new SupportAlternativeError("CONFLICT", "Alternatives cannot be proposed for a closed ticket.");
  }

  const current = await getLatestSupportAlternative(ticket.id);
  if (current?.status === "pending") {
    throw new SupportAlternativeError("CONFLICT", "This ticket already has a pending alternative.");
  }

  try {
    return await insertSupportAlternative({
      ticketId: ticket.id,
      proposedBy: input.proposedBy,
      originalTitle: input.proposal.originalTitle,
      originalStartAt: input.proposal.originalStartAt,
      originalEndAt: input.proposal.originalEndAt,
      originalPriceMinor: input.proposal.originalPriceMinor,
      alternativeTitle: input.proposal.alternativeTitle,
      alternativeStartAt: input.proposal.alternativeStartAt,
      alternativeEndAt: input.proposal.alternativeEndAt,
      alternativePriceMinor: input.proposal.alternativePriceMinor,
      currency: (input.proposal.currency ?? "EUR").toUpperCase(),
    });
  } catch (error) {
    if (isPendingConflict(error)) {
      throw new SupportAlternativeError("CONFLICT", "This ticket already has a pending alternative.");
    }
    throw error;
  }
}

export async function getSupportAlternativeForAdmin(ticketId: string) {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket) {
    return null;
  }
  return getLatestSupportAlternative(ticketId);
}

export async function getSupportAlternativeForOwner(ticketId: string, ownerId: string) {
  const ticket = await getSupportTicketById(ticketId);
  if (!ticket || ticket.ownerId !== ownerId) {
    return null;
  }
  return getLatestSupportAlternative(ticketId);
}

export async function decideSupportAlternative(input: {
  ticketId: string;
  ownerId: string;
  decision: DecideSupportAlternativeInput;
}): Promise<{ alternative: SupportAlternative; replacementExecutionRequired: boolean }> {
  const ticket = await getSupportTicketById(input.ticketId);
  if (!ticket || ticket.ownerId !== input.ownerId) {
    throw new SupportAlternativeError("NOT_FOUND", "Support ticket not found.");
  }

  const current = await getLatestSupportAlternative(ticket.id);
  if (!current) {
    throw new SupportAlternativeError("NOT_FOUND", "No alternative has been proposed.");
  }
  if (current.status !== "pending") {
    throw new SupportAlternativeError("CONFLICT", "This alternative has already been decided.");
  }

  const updated = await decideSupportAlternativeRow({
    alternativeId: current.id,
    actorId: input.ownerId,
    decision: input.decision.decision,
    travelerNote: input.decision.travelerNote ?? null,
  });
  if (!updated) {
    throw new SupportAlternativeError("CONFLICT", "This alternative has already been decided.");
  }

  return {
    alternative: updated,
    replacementExecutionRequired: updated.status === "accepted",
  };
}
