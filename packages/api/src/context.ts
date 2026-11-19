import type { Database } from "@invite-me/db";

export type Context = {
  /** Logged-in user id from the better-auth session, or null. Resolved to a client id by `hostProcedure`. */
  userId: string | null;
  db: Database;
  /** Server key for deriving guest-link secrets. Never sent to clients. */
  inviteLinkKey: string;
  /** Caller address from the edge (`cf-connecting-ip`). Used only as a rate-limit bucket key. */
  clientIp: string;
};
