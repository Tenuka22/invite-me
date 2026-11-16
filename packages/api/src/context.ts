import type { Session } from "@invite-me/auth";
import type { Database } from "@invite-me/db";

export type Context = {
  session: Session | null;
  db: Database;
};
