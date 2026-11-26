import { createAuth as createConfiguredAuth } from "@invite-me/auth";
import { type Database, createDb } from "@invite-me/db";

import { ENV } from "./env.server";

// The bindings and secrets never change inside one isolate, so the database handle and the auth
// instance are built once and reused. Building better-auth on every request was pure overhead.
let db: Database | undefined;
let auth: ReturnType<typeof createConfiguredAuth> | undefined;

export function getDb(): Database {
  return (db ??= createDb(ENV.DB));
}

export async function createAuth(database?: Database) {
  if (database) return createConfiguredAuth(ENV, database);
  return (auth ??= createConfiguredAuth(ENV, getDb()));
}
