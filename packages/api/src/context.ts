import type { Database } from "@invite-me/db";

export type Context = {
  /** Logged-in user id from the better-auth session, or null. Per-invitation access goes through `event_admin`. */
  userId: string | null;
  db: Database;
  /** Server key for deriving guest-link and admin-invite secrets. Never sent to clients. */
  inviteLinkKey: string;
  /** Caller address from the edge (`cf-connecting-ip`). Used only as a rate-limit bucket key. */
  clientIp: string;
};
