import { DEVELOPMENT_OWNER_ID } from "../../../features/support/development-owner";
import { createSupportTicketSchema } from "../../../features/support/schemas";
import {
  createSupportTicket,
  listSupportTicketsForOwner,
} from "../../../features/support/service";

type ErrorCode = "INVALID_BODY" | "INTERNAL_ERROR";

function errorResponse(status: number, code: ErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

// TODO: Replace DEVELOPMENT_OWNER_ID with the authenticated user before production.
export async function GET() {
  try {
    const tickets = await listSupportTicketsForOwner(DEVELOPMENT_OWNER_ID);
    return Response.json({ data: { tickets } });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unable to load support tickets.");
  }
}

// TODO: Replace DEVELOPMENT_OWNER_ID with the authenticated user before production.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Request body must be valid JSON.");
  }

  const parsed = createSupportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      "INVALID_BODY",
      "tripId must be a UUID, category must be supported, and message must be 10 to 2000 characters.",
    );
  }

  try {
    const ticket = await createSupportTicket({
      ownerId: DEVELOPMENT_OWNER_ID,
      ticket: parsed.data,
    });

    return Response.json({ data: { ticket } }, { status: 201 });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unable to create the support ticket.");
  }
}
