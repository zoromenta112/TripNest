CREATE TABLE "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"booking_id" uuid,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution_note" text,
	"assigned_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_tickets_category_check" CHECK ("support_tickets"."category" in ('transport', 'accommodation', 'booking', 'esim', 'activity', 'other')),
	CONSTRAINT "support_tickets_status_check" CHECK ("support_tickets"."status" in ('open', 'in_progress', 'resolved', 'closed'))
);
--> statement-breakpoint
CREATE INDEX "support_tickets_owner_id_idx" ON "support_tickets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "support_tickets_trip_id_idx" ON "support_tickets" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "support_tickets_status_idx" ON "support_tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets" USING btree ("created_at");