CREATE TABLE "program_call_stats" (
	"address" text NOT NULL,
	"block_slot" text NOT NULL,
	"calls_number" integer DEFAULT 0 NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"program_address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "program_call_stats_program_address_address_unique" UNIQUE("program_address","address")
);
--> statement-breakpoint
CREATE TABLE "program_stats" (
	"calling_programs_count" integer DEFAULT 0 NOT NULL,
	"program_address" text NOT NULL,
	"transaction_references_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "program_stats_program_address_unique" UNIQUE("program_address")
);
