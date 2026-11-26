import type { Session } from "@invite-me/auth";
import type { Database } from "@invite-me/db";

export type Context = {
  session: Session | null;
  db: Database;
  /** Server key for deriving guest-link secrets. Never sent to clients. */
  inviteLinkKey: string;
  /** Caller address from the edge (`cf-connecting-ip`). Used only as a rate-limit bucket key. */
  clientIp: string;
};
