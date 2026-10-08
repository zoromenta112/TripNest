CREATE TABLE "support_alternatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"proposed_by" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"original_title" text NOT NULL,
	"original_start_at" timestamp with time zone,
	"original_end_at" timestamp with time zone,
	"original_price_minor" integer,
	"alternative_title" text NOT NULL,
	"alternative_start_at" timestamp with time zone,
	"alternative_end_at" timestamp with time zone,
	"alternative_price_minor" integer,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"traveler_note" text,
	"proposed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_alternatives_status_check" CHECK ("support_alternatives"."status" in ('pending', 'accepted', 'rejected'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "support_alternatives_one_pending" ON "support_alternatives" USING btree ("ticket_id") WHERE "support_alternatives"."status" = 'pending';