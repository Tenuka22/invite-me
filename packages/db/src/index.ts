import { type DrizzleD1Database, drizzle } from "drizzle-orm/d1";

import { relations } from "./relations";

export type Database = DrizzleD1Database<typeof relations>;

// `d1` is the Worker's D1 binding (`env.DB`). Constructing the client is
// free: no connection is opened, so it is safe to build per request.
export function createDb(d1: D1Database): Database {
  return drizzle(d1, { relations });
}
