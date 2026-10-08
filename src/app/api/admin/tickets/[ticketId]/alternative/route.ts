import { z } from "zod";

import { DEVELOPMENT_ADMIN_ID } from "../../../../../../features/support/development-admin";
import {
  getSupportAlternativeForAdmin,
  proposeSupportAlternative,
  SupportAlternativeError,
} from "../../../../../../features/support/alternative-service";
import { createSupportAlternativeSchema } from "../../../../../../features/support/schemas";

const ticketIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ ticketId: string }>;
};

type ErrorCode = "INVALID_TICKET_ID" | "INVALID_BODY" | "CONFLICT" | "NOT_FOUND" | "INTERNAL_ERROR";

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

function workflowResponse(error: SupportAlternativeError) {
  if (error.code === "NOT_FOUND") {
    return errorResponse(404, "NOT_FOUND", error.message);
  }
  return errorResponse(409, "CONFLICT", error.message);
}

// TODO: Replace DEVELOPMENT_ADMIN_ID with an authenticated admin role check.
export async function GET(_request: Request, context: RouteContext) {
  const ticketId = await readTicketId(context);
  if (ticketId instanceof Response) {
    return ticketId;
  }

  try {
    const alternative = await getSupportAlternativeForAdmin(ticketId);
    if (!alternative) {
      return errorResponse(404, "NOT_FOUND", "No alternative has been proposed.");
    }
    return Response.json({ data: { alternative } });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unable to load the alternative.");
  }
}

// TODO: Replace DEVELOPMENT_ADMIN_ID with an authenticated admin role check.
export async function POST(request: Request, context: RouteContext) {
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

  const parsed = createSupportAlternativeSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_BODY", "Original and alternative titles are required.");
  }

  try {
    const alternative = await proposeSupportAlternative({
      ticketId,
      proposedBy: DEVELOPMENT_ADMIN_ID,
      proposal: parsed.data,
    });
    return Response.json({ data: { alternative } }, { status: 201 });
  } catch (error) {
    if (error instanceof SupportAlternativeError) {
      return workflowResponse(error);
    }
    return errorResponse(500, "INTERNAL_ERROR", "Unable to propose the alternative.");
  }
}
