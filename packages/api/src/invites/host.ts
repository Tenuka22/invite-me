import { eq } from "drizzle-orm";

import type { Database } from "@invite-me/db";
import { client } from "@invite-me/db/schema/invites";

import { randomToken } from "./token";

/** Returns the client id for a logged-in user, creating the row on first use. */
export async function clientIdForUser(db: Database, userId: string): Promise<string> {
  await db
    .insert(client)
    .values({ id: randomToken(), userId })
    .onConflictDoNothing({ target: client.userId });
  const [row] = await db
    .select({ id: client.id })
    .from(client)
    .where(eq(client.userId, userId))
    .limit(1);
  if (!row) throw new Error("client row missing after insert");
  return row.id;
}
