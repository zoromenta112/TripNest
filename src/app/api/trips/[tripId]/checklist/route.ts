import { z } from "zod";

import { getReadinessItemsByTripId, updateReadinessItem } from "../../../../../features/readiness/repository";
import { updateReadinessItemSchema } from "../../../../../features/readiness/schemas";
import {
  buildReadinessChecklist,
  calculateReadinessProgress,
} from "../../../../../features/readiness/service";

const tripIdSchema = z.uuid();

type RouteContext = {
  params: Promise<{ tripId: string }>;
};

type ErrorCode = "INVALID_TRIP_ID" | "INVALID_BODY" | "INTERNAL_ERROR";

function errorResponse(status: number, code: ErrorCode, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

async function readTripId(context: RouteContext): Promise<string | Response> {
  const { tripId } = await context.params;
  const parsed = tripIdSchema.safeParse(tripId);

  if (!parsed.success) {
    return errorResponse(400, "INVALID_TRIP_ID", "tripId must be a valid UUID.");
  }

  return parsed.data;
}

async function checklistResponse(tripId: string) {
  const savedItems = await getReadinessItemsByTripId(tripId);
  const items = buildReadinessChecklist(savedItems);

  return Response.json({
    data: {
      items,
      progress: calculateReadinessProgress(items),
    },
  });
}

// TODO: Enforce authentication and trip ownership before production integration.
// The tripId in the path is not yet proof that the caller owns the trip.
export async function GET(_request: Request, context: RouteContext) {
  const tripId = await readTripId(context);
  if (tripId instanceof Response) {
    return tripId;
  }

  try {
    return await checklistResponse(tripId);
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Unable to load the readiness checklist.",
    );
  }
}

// TODO: Enforce authentication and trip ownership before production integration.
// The tripId in the path is not yet proof that the caller owns the trip.
export async function PATCH(request: Request, context: RouteContext) {
  const tripId = await readTripId(context);
  if (tripId instanceof Response) {
    return tripId;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_BODY", "Request body must be valid JSON.");
  }

  const parsed = updateReadinessItemSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      "INVALID_BODY",
      "itemKey must be a supported readiness item and completed must be a boolean.",
    );
  }

  try {
    await updateReadinessItem({
      tripId,
      itemKey: parsed.data.itemKey,
      completed: parsed.data.completed,
    });

    return await checklistResponse(tripId);
  } catch {
    return errorResponse(
      500,
      "INTERNAL_ERROR",
      "Unable to update the readiness checklist.",
    );
  }
}
