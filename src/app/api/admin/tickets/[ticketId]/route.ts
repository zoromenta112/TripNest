import { z } from "zod";

import { DEVELOPMENT_ADMIN_ID } from "../../../../../features/support/development-admin";
import { updateAdminSupportTicketSchema } from "../../../../../features/support/schemas";
import {
  getSupportTicketForAdmin,
  SupportWorkflowError,
  updateSupportTicketForAdmin,
} from "../../../../../features/support/service";

const ticketIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

type ErrorCode = "INVALID_TICKET_ID" | "INVALID_BODY" | "INVALID_TRANSITION" | "NOT_FOUND" | "INTERNAL_ERROR";

function errorResponse(status: number, code: ErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

async function readTicketId(context: RouteContext) {
  const { ticketId } = await context.params;
  const parsed = ticketIdSchema.safeParse(ticketId);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_TICKET_ID", "ticketId must be a valid UUID.");
  }
  return parsed.data;
}

// TODO: Replace DEVELOPMENT_ADMIN_ID with an authenticated admin role check.
// This route is not production-secure.
export async function GET(_request: Request, context: RouteContext) {
  const ticketId = await readTicketId(context);
  if (ticketId instanceof Response) {
    return ticketId;
  }

  try {
    const ticket = await getSupportTicketForAdmin(ticketId);
    if (!ticket) {
      return errorResponse(404, "NOT_FOUND", "Support ticket not found.");
    }
    return Response.json({ data: { ticket } });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unable to load the support ticket.");
  }
}

// TODO: Replace DEVELOPMENT_ADMIN_ID with an authenticated admin role check.
// This route is not production-secure.
export async function PATCH(request: Request, context: RouteContext) {
  const ticketId = await readTicketId(context);
  if (ticketId instanceof Response) {
    return ticketId;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Request body must be valid JSON.");
  }

  const parsed = updateAdminSupportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      "INVALID_BODY",
      "status must be a supported value and a resolution note must be 10 to 2000 characters.",
    );
  }

  try {
    const ticket = await updateSupportTicketForAdmin({
      ticketId,
      actorId: DEVELOPMENT_ADMIN_ID,
      update: parsed.data,
    });
    return Response.json({ data: { ticket } });
  } catch (error) {
    if (error instanceof SupportWorkflowError) {
      if (error.code === "NOT_FOUND") {
        return errorResponse(404, "NOT_FOUND", error.message);
      }
      if (error.code === "INVALID_TRANSITION") {
        return errorResponse(409, "INVALID_TRANSITION", error.message);
      }
      return errorResponse(400, "INVALID_BODY", error.message);
    }
    return errorResponse(500, "INTERNAL_ERROR", "Unable to update the support ticket.");
  }
}
