import { sql } from "drizzle-orm";

import type { Database } from "@invite-me/db";
import { rateLimits } from "@invite-me/db/schema/invites";

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Fixed-window counter in D1. Returns false once `limit` requests have landed in the current window.
 * The window resets atomically inside the upsert, so concurrent requests cannot both reset it.
 */
export async function allowRequest(
  db: Database,
  bucket: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): Promise<boolean> {
  const key = await sha256Hex(bucket);
  const windowStart = now - windowMs;
  const [row] = await db
    .insert(rateLimits)
    .values({ bucket: key, count: 1, windowStart: now })
    .onConflictDoUpdate({
      target: rateLimits.bucket,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} <= ${windowStart} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimits.windowStart} <= ${windowStart} THEN ${now} ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning({ count: rateLimits.count });
  if (!row) throw new Error("Rate limit write returned no row");
  return row.count <= limit;
}
