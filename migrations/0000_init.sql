CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "comparisons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"country_codes" varchar(3)[] NOT NULL,
	"indicator_code" varchar(64) NOT NULL,
	"year_from" integer,
	"year_to" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparisons_name_check" CHECK (char_length("comparisons"."name") >= 1),
	CONSTRAINT "comparisons_country_codes_check" CHECK (cardinality("comparisons"."country_codes") between 2 and 6),
	CONSTRAINT "comparisons_indicator_code_check" CHECK (char_length("comparisons"."indicator_code") >= 1),
	CONSTRAINT "comparisons_year_from_check" CHECK ("comparisons"."year_from" between 1960 and 2100),
	CONSTRAINT "comparisons_year_to_check" CHECK ("comparisons"."year_to" between 1960 and 2100),
	CONSTRAINT "comparisons_year_range_check" CHECK ("comparisons"."year_from" is null or "comparisons"."year_to" is null or "comparisons"."year_from" <= "comparisons"."year_to")
);
--> statement-breakpoint
CREATE TABLE "country_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"body" varchar(5000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "country_notes_country_code_check" CHECK ("country_notes"."country_code" ~ '^[A-Z0-9]{3}$'),
	CONSTRAINT "country_notes_body_check" CHECK (char_length("country_notes"."body") >= 1)
);
--> statement-breakpoint
CREATE TABLE "favorite_countries" (
	"user_id" text NOT NULL,
	"country_code" varchar(3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_countries_user_id_country_code_pk" PRIMARY KEY("user_id","country_code"),
	CONSTRAINT "favorite_countries_country_code_check" CHECK ("favorite_countries"."country_code" ~ '^[A-Z0-9]{3}$')
);
--> statement-breakpoint
CREATE TABLE "saved_indicators" (
	"user_id" text NOT NULL,
	"indicator_code" varchar(64) NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_indicators_user_id_indicator_code_pk" PRIMARY KEY("user_id","indicator_code"),
	CONSTRAINT "saved_indicators_indicator_code_check" CHECK (char_length("saved_indicators"."indicator_code") >= 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp with time zone,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_notes" ADD CONSTRAINT "country_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_countries" ADD CONSTRAINT "favorite_countries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_indicators" ADD CONSTRAINT "saved_indicators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comparisons_user_created_idx" ON "comparisons" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "country_notes_user_country_idx" ON "country_notes" USING btree ("user_id","country_code","created_at" DESC NULLS LAST);