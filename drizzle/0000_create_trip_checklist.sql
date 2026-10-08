CREATE TABLE "trip_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"item_key" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_checklist_trip_item_unique" UNIQUE("trip_id","item_key"),
	CONSTRAINT "trip_checklist_item_key_check" CHECK ("trip_checklist"."item_key" in ('travel_documents', 'flight_confirmation', 'accommodation', 'esim', 'local_transport', 'emergency_information'))
);
