import { z } from "zod";

import {
  decideSupportAlternative,
  getSupportAlternativeForOwner,
  SupportAlternativeError,
} from "../../../../../features/support/alternative-service";
import { DEVELOPMENT_OWNER_ID } from "../../../../../features/support/development-owner";
import { decideSupportAlternativeSchema } from "../../../../../features/support/schemas";

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

// TODO: Replace DEVELOPMENT_OWNER_ID with the authenticated traveler.
export async function GET(_request: Request, context: RouteContext) {
  const ticketId = await readTicketId(context);
  if (ticketId instanceof Response) {
    return ticketId;
  }

  try {
    const alternative = await getSupportAlternativeForOwner(ticketId, DEVELOPMENT_OWNER_ID);
    if (!alternative) {
      return errorResponse(404, "NOT_FOUND", "No alternative has been proposed.");
    }
    return Response.json({ data: { alternative } });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unable to load the alternative.");
  }
}

// TODO: Replace DEVELOPMENT_OWNER_ID with the authenticated traveler.
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

  const parsed = decideSupportAlternativeSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_BODY", "decision must be accepted or rejected.");
  }

  try {
    const result = await decideSupportAlternative({
      ticketId,
      ownerId: DEVELOPMENT_OWNER_ID,
      decision: parsed.data,
    });
    return Response.json({
      data: {
        alternative: result.alternative,
        replacementExecutionRequired: result.replacementExecutionRequired,
      },
    });
  } catch (error) {
    if (error instanceof SupportAlternativeError) {
      if (error.code === "NOT_FOUND") {
        return errorResponse(404, "NOT_FOUND", error.message);
      }
      return errorResponse(409, "CONFLICT", error.message);
    }
    return errorResponse(500, "INTERNAL_ERROR", "Unable to record the decision.");
  }
}
