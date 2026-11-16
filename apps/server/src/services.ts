import { createAuth as createConfiguredAuth } from "@invite-me/auth";
import { type Database, createDb } from "@invite-me/db";

import { ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV.DB);
}
export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()));
}
