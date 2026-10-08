import { z } from "zod";

import { DEVELOPMENT_OWNER_ID } from "../../../../features/support/development-owner";
import { getSupportTicketForOwner } from "../../../../features/support/service";

const ticketIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

type ErrorCode = "INVALID_TICKET_ID" | "NOT_FOUND" | "INTERNAL_ERROR";

function errorResponse(status: number, code: ErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

// TODO: Replace DEVELOPMENT_OWNER_ID with the authenticated user before production.
// A ticket owned by someone else is treated as not found.
export async function GET(_request: Request, context: RouteContext) {
  const { ticketId } = await context.params;
  const parsed = ticketIdSchema.safeParse(ticketId);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_TICKET_ID", "ticketId must be a valid UUID.");
  }

  try {
    const ticket = await getSupportTicketForOwner(parsed.data, DEVELOPMENT_OWNER_ID);
    if (!ticket) {
      return errorResponse(404, "NOT_FOUND", "Support ticket not found.");
    }

    return Response.json({ data: { ticket } });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unable to load the support ticket.");
  }
}
