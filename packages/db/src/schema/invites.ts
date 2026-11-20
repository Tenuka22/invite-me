import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { user } from "./auth";

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/** One row per logged-in host. Guest links derive from the server key. */
export const client = sqliteTable(
  "client",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [uniqueIndex("client_userId_uq").on(table.userId)],
);

/** One row per invitation. A host may have many. */
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
    createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [index("event_clientId_idx").on(table.clientId)],
);
/** Each party belongs to one invitation; the guest sees that invitation's card. Null only on rows created before invitations existed. */
export const party = sqliteTable(
  "party",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").references(() => event.id),
    clientId: text("client_id")
      .notNull()
      .references(() => client.id),
    displayName: text("display_name").notNull(),
    invitedAs: text("invited_as").notNull(),
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
  (table) => [index("party_clientId_idx").on(table.clientId)],
);

/**
 * Who holds access to an invitation. The `role="owner"` row is the creator;
 * `role="admin"` rows are brides/grooms (and other spouses) granted via an
 * admin invite link. One row per (event, user); an event has at most one owner.
 */
export const eventAdmin = sqliteTable(
  "event_admin",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    role: text("role").notNull().default("admin"),
    grantedAt: integer("granted_at", { mode: "timestamp_ms" }).default(now).notNull(),
  },
  (table) => [uniqueIndex("event_admin_event_user_uq").on(table.eventId, table.userId)],
);

/** Fixed-window request counters for abuse limits. `bucket` is a hash; raw client addresses are never stored. */
export const rateLimits = sqliteTable("rate_limits", {
  bucket: text("bucket").primaryKey(),
  count: integer("count").notNull(),
  windowStart: integer("window_start").notNull(),
});
