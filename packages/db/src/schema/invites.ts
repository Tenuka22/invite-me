import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** One row per host. Auth is `user_id`; guest links derive from the server key. */
export const client = sqliteTable(
  "client",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [uniqueIndex("client_userId_uq").on(table.userId)],
);

export const event = sqliteTable(
  "event",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id),
    eventType: text("event_type").notNull(),
    preset: text("preset").notNull(),
    /** JSON card content, validated by the API. Null means template defaults. */
    card: text("card"),
    coupleImageKey: text("couple_image_key"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [index("event_clientId_idx").on(table.clientId)],
);

export const party = sqliteTable(
  "party",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id),
    /** The invitation this guest was invited to. Null only for rows created before hosts could have several invitations. */
    eventId: text("event_id").references(() => event.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    invitedAs: text("invited_as").notNull(),
    /** teen | adult | forties | elder | family; null for parties created before age groups existed. */
    ageGroup: text("age_group"),
    seats: integer("seats").notNull(),
    seatLabel: text("seat_label"),
    rules: text("rules"),
    locale: text("locale").notNull(),
    shared: integer("shared", { mode: "boolean" }).default(false).notNull(),
    revoked: integer("revoked", { mode: "boolean" }).default(false).notNull(),
    opens: integer("opens").default(0).notNull(),
    firstOpenedAt: integer("first_opened_at", { mode: "timestamp_ms" }),
    lastOpenedAt: integer("last_opened_at", { mode: "timestamp_ms" }),
    rsvp: text("rsvp").default("pending").notNull(),
    confirmedSeats: integer("confirmed_seats").default(0).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [index("party_clientId_idx").on(table.clientId), index("party_eventId_idx").on(table.eventId)],
);

/** Fixed-window request counters for abuse limits. `bucket` is a hash; raw client addresses are never stored. */
export const rateLimits = sqliteTable("rate_limits", {
  bucket: text("bucket").primaryKey(),
  count: integer("count").notNull(),
  windowStart: integer("window_start").notNull(),
});
