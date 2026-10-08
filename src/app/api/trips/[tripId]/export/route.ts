import { z } from "zod";

import { renderTripSummaryHtml } from "../../../../../features/trip-export/html";
import { buildTripSummary, TripExportError } from "../../../../../features/trip-export/service";

const tripIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ tripId: string }>;
};

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function GET(_request: Request, context: RouteContext) {
  const { tripId } = await context.params;
  const parsed = tripIdSchema.safeParse(tripId);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_TRIP_ID", "tripId must be a valid UUID.");
  }

  try {
    const summary = await buildTripSummary(parsed.data);
    const html = renderTripSummaryHtml(summary);
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": 'attachment; filename="tripnest-trip-summary.html"',
      },
    });
  } catch (error) {
    if (error instanceof TripExportError) {
      return errorResponse(404, "NOT_FOUND", error.message);
    }
    return errorResponse(500, "INTERNAL_ERROR", "Unable to export the trip summary.");
  }
}
