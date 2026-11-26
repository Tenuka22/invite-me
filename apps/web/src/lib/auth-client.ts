import { createAuthClient } from "better-auth/react";

import { ENV } from "../env.public";

export const authClient = createAuthClient({
  baseURL: `${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/api/auth`,
});

type SessionResult = ReturnType<typeof authClient.getSession>;
let cached: { at: number; result: SessionResult } | null = null;

/**
 * The session, fetched at most once a minute. Every route guard asks for it, and each ask is a
 * round trip to the server, so repeat asks within a navigation reuse the first answer.
 */
export function getSession(): SessionResult {
  if (!cached || Date.now() - cached.at > 60_000) {
    const result = authClient.getSession();
    cached = { at: Date.now(), result };
    // A failed lookup must not stick around for a minute.
    void result.then((r) => {
      if (!r.data && cached?.result === result) cached = null;
    });
  }
  return cached.result;
}

export function clearSession() {
  cached = null;
}
