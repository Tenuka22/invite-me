import { Database as SqliteDatabase } from "bun:sqlite";
import { describe, expect, test } from "bun:test";

import type { Database } from "@invite-me/db";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { allowRequest } from "./rate-limit";

function memoryDb() {
  const sqlite = new SqliteDatabase(":memory:");
  sqlite.run("CREATE TABLE rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, window_start INTEGER NOT NULL)");
  return drizzle({ client: sqlite }) as unknown as Database;
}

describe("allowRequest", () => {
  test("allows up to the limit in one window, then denies", async () => {
    const db = memoryDb();
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await allowRequest(db, "resolve:1.2.3.4", 3, 60_000, 1_000));
    expect(results).toEqual([true, true, true, false]);
  });

  test("resets once the window has elapsed", async () => {
    const db = memoryDb();
    await allowRequest(db, "rsvp:ip", 1, 60_000, 0);
    expect(await allowRequest(db, "rsvp:ip", 1, 60_000, 30_000)).toBe(false);
    expect(await allowRequest(db, "rsvp:ip", 1, 60_000, 60_000)).toBe(true);
  });

  test("keeps buckets independent", async () => {
    const db = memoryDb();
    await allowRequest(db, "resolve:a", 1, 60_000, 0);
    expect(await allowRequest(db, "resolve:b", 1, 60_000, 0)).toBe(true);
  });
});
