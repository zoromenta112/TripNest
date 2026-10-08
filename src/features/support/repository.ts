import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "../../db";
import { auditEvents } from "../../db/schema/audit";
import { supportTickets } from "../../db/schema/support";
import {
  supportTicketCategorySchema,
  supportTicketStatusSchema,
} from "./schemas";
import type {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
} from "./types";

function toSupportTicket(row: typeof supportTickets.$inferSelect): SupportTicket | null {
  const category = supportTicketCategorySchema.safeParse(row.category);
  const status = supportTicketStatusSchema.safeParse(row.status);
  if (!category.success || !status.success) {
    return null;
  }

  return {
    id: row.id,
    tripId: row.tripId,
    ownerId: row.ownerId,
    bookingId: row.bookingId,
    category: category.data,
    message: row.message,
    status: status.data,
    resolutionNote: row.resolutionNote,
    assignedAdminId: row.assignedAdminId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createSupportTicket(input: {
  tripId: string;
  ownerId: string;
  category: SupportTicketCategory;
  message: string;
}): Promise<SupportTicket> {
  const [row] = await db
    .insert(supportTickets)
    .values({
      tripId: input.tripId,
      ownerId: input.ownerId,
      category: input.category,
      message: input.message,
      status: "open",
    })
    .returning();

  const ticket = row ? toSupportTicket(row) : null;
  if (!ticket) {
    throw new Error("Unable to create support ticket");
  }

  return ticket;
}

export async function getSupportTicketsByOwnerId(
  ownerId: string,
): Promise<SupportTicket[]> {
  const rows = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.ownerId, ownerId))
    .orderBy(desc(supportTickets.createdAt));

  return rows.flatMap((row) => {
    const ticket = toSupportTicket(row);
    return ticket ? [ticket] : [];
  });
}

export async function getSupportTicketById(
  ticketId: string,
): Promise<SupportTicket | null> {
  const [row] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  return row ? toSupportTicket(row) : null;
}

export async function listSupportTicketsForAdmin(
  status?: SupportTicketStatus,
): Promise<SupportTicket[]> {
  const rows = await db
    .select()
    .from(supportTickets)
    .where(status ? eq(supportTickets.status, status) : undefined)
    .orderBy(desc(supportTickets.createdAt));

  return rows.flatMap((row) => {
    const ticket = toSupportTicket(row);
    return ticket ? [ticket] : [];
  });
}

export async function applyAdminTicketChange(input: {
  ticketId: string;
  status: SupportTicketStatus;
  resolutionNote: string | null;
  assignedAdminId: string;
  audits: Array<{
    actorId: string;
    action: "support_ticket_status_changed" | "support_ticket_resolution_updated";
    metadata: Record<string, string>;
  }>;
}): Promise<SupportTicket> {
  const ticketUpdate = db
    .update(supportTickets)
    .set({
      status: input.status,
      resolutionNote: input.resolutionNote,
      assignedAdminId: input.assignedAdminId,
      updatedAt: sql`now()`,
    })
    .where(and(eq(supportTickets.id, input.ticketId)))
    .returning();

  const auditWrites = input.audits.map((audit) =>
    db.insert(auditEvents).values({
      actorId: audit.actorId,
      action: audit.action,
      entityType: "support_ticket",
      entityId: input.ticketId,
      metadata: audit.metadata,
    }),
  );

  const [updatedRows] = await db.batch([ticketUpdate, ...auditWrites]);
  const ticket = updatedRows[0] ? toSupportTicket(updatedRows[0]) : null;
  if (!ticket) {
    throw new Error("Unable to update support ticket");
  }

  return ticket;
}
