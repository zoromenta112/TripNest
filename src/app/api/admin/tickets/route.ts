import { supportTicketStatusSchema } from "../../../../features/support/schemas";
import { listSupportTicketsForAdminView } from "../../../../features/support/service";

type ErrorCode = "INVALID_STATUS" | "INTERNAL_ERROR";

function errorResponse(status: number, code: ErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

// TODO: Replace DEVELOPMENT_ADMIN_ID with an authenticated admin role check.
// This route is not production-secure.
export async function GET(request: Request) {
  const statusParam = new URL(request.url).searchParams.get("status");
  const parsedStatus = statusParam === null ? null : supportTicketStatusSchema.safeParse(statusParam);
  if (parsedStatus && !parsedStatus.success) {
    return errorResponse(400, "INVALID_STATUS", "status must be open, in_progress, resolved, or closed.");
  }

  try {
    const tickets = await listSupportTicketsForAdminView(parsedStatus?.data);
    return Response.json({ data: { tickets } });
  } catch {
    return errorResponse(500, "INTERNAL_ERROR", "Unable to load support tickets.");
  }
}
