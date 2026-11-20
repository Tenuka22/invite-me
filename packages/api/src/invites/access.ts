import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";

import type { Database } from "@invite-me/db";
import { eventAdmin } from "@invite-me/db/schema/invites";

/** Owner or admin — everyone who may read the invitation. Admins share control; owners have more permissions. */
export type AccessRole = "owner" | "admin";

/** Loads the caller's row for an invitation, so routers can scope and check permissions. */
export async function loadAccess(
  db: Database,
  eventId: string,
  userId: string | null,
): Promise<{ eventId: string; role: AccessRole }> {
  if (!userId) throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
  const rows = await db
    .select({ role: eventAdmin.role })
    .from(eventAdmin)
    .where(and(eq(eventAdmin.eventId, eventId), eq(eventAdmin.userId, userId)))
    .limit(1);
  if (!rows[0]) throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
  return { eventId, role: rows[0].role as AccessRole };
}

/** `admin` or higher; owners pass, non-members fail. */
export async function requireAccess(db: Database, eventId: string, userId: string | null): Promise<AccessRole> {
  const { role } = await loadAccess(db, eventId, userId);
  return role;
}

/** Owner-only. Brides/grooms and planners read; the owner writes. */
export async function requireOwner(db: Database, eventId: string, userId: string | null): Promise<"owner"> {
  const { role } = await loadAccess(db, eventId, userId);
  if (role !== "owner") {
    throw new ORPCError("FORBIDDEN", { message: "Only the owner can manage this invitation" });
  }
  return "owner";
}
