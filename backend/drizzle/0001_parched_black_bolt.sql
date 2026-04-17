ALTER TABLE "notifications" ADD COLUMN "created_by" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_by" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "case_links" ADD COLUMN "updated_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "case_links" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_credentials" ADD COLUMN "created_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "portal_credentials" ADD COLUMN "updated_by" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_links" ADD CONSTRAINT "case_links_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_credentials" ADD CONSTRAINT "portal_credentials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portal_credentials" ADD CONSTRAINT "portal_credentials_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;