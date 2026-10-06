// Postgres schema. Generate a migration after editing: pnpm db:generate
//
// App-table properties are snake_case on purpose: rows are returned from the
// API as-is, and the client already speaks that shape (see lib/domain/library.ts).
//
// There is no row level security: every query in lib/server/repositories/* scopes by user_id.

import { sql } from "drizzle-orm"
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"
import type { AdapterAccountType } from "next-auth/adapters"

// Relative, so drizzle-kit (which loads this file outside Next) resolves them.
import { COMPARISON_NAME_MAX, MAX_COMPARE, MIN_COMPARE, NOTE_BODY_MAX } from "../../domain/library"
import { YEAR_MAX, YEAR_MIN } from "../../domain/year"

// Auth.js ------------------------------------------------------------------
// Property names are what @auth/drizzle-adapter expects. Sessions are JWTs, and
// Google is the only provider, so the session and verification-token tables
// are not needed.

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date", withTimezone: true }),
  image: text("image"),
})

// Only the link between a Google account and a user. The app never calls Google
// APIs, so OAuth tokens are deliberately not stored (see lib/server/auth/adapter.ts).
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]
)

// Library ------------------------------------------------------------------

const userId = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
/** A constant inlined into check SQL as a literal (not a bind parameter). */
const lit = (value: number) => sql.raw(String(value))

const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())

export const favoriteCountries = pgTable(
  "favorite_countries",
  {
    user_id: userId(),
    country_code: varchar("country_code", { length: 3 }).notNull(),
    created_at: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.country_code] }),
    check("favorite_countries_country_code_check", sql`${t.country_code} ~ '^[A-Z0-9]{3}$'`),
  ]
)

export const savedIndicators = pgTable(
  "saved_indicators",
  {
    user_id: userId(),
    indicator_code: varchar("indicator_code", { length: 64 }).notNull(),
    position: integer("position").notNull().default(0),
    created_at: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.user_id, t.indicator_code] }),
    check("saved_indicators_indicator_code_check", sql`char_length(${t.indicator_code}) >= 1`),
  ]
)

export const comparisons = pgTable(
  "comparisons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    name: varchar("name", { length: COMPARISON_NAME_MAX }).notNull(),
    country_codes: varchar("country_codes", { length: 3 }).array().notNull(),
    indicator_code: varchar("indicator_code", { length: 64 }).notNull(),
    year_from: integer("year_from"),
    year_to: integer("year_to"),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [
    index("comparisons_user_created_idx").on(t.user_id, t.created_at.desc()),
    check("comparisons_name_check", sql`char_length(${t.name}) >= 1`),
    check("comparisons_country_codes_check", sql`cardinality(${t.country_codes}) between ${lit(MIN_COMPARE)} and ${lit(MAX_COMPARE)}`),
    check("comparisons_indicator_code_check", sql`char_length(${t.indicator_code}) >= 1`),
    check("comparisons_year_from_check", sql`${t.year_from} between ${lit(YEAR_MIN)} and ${lit(YEAR_MAX)}`),
    check("comparisons_year_to_check", sql`${t.year_to} between ${lit(YEAR_MIN)} and ${lit(YEAR_MAX)}`),
    check(
      "comparisons_year_range_check",
      sql`${t.year_from} is null or ${t.year_to} is null or ${t.year_from} <= ${t.year_to}`
    ),
  ]
)

export const countryNotes = pgTable(
  "country_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: userId(),
    country_code: varchar("country_code", { length: 3 }).notNull(),
    body: varchar("body", { length: NOTE_BODY_MAX }).notNull(),
    created_at: createdAt(),
    updated_at: updatedAt(),
  },
  (t) => [
    index("country_notes_user_country_idx").on(t.user_id, t.country_code, t.created_at.desc()),
    check("country_notes_country_code_check", sql`${t.country_code} ~ '^[A-Z0-9]{3}$'`),
    check("country_notes_body_check", sql`char_length(${t.body}) >= 1`),
  ]
)
