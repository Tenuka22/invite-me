import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@invite-me/db";
import * as schema from "@invite-me/db/schema/auth";
import { betterAuth } from "better-auth";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

/** Which providers have credentials on this deployment, so the login page offers only those that can work. */
export function signInMethods(env: AuthConfig) {
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
  };
}

export function createAuth(
  env: AuthConfig,
  database: Database,
  desktopOrigins: readonly string[] = [],
) {
  return betterAuth({
    database: drizzleAdapter(database, { provider: "sqlite", schema }),
    trustedOrigins: [env.CORS_ORIGIN, ...desktopOrigins],
    // Hosts stay signed in for a month; the sliding window refreshes once a day.
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },
    // A provider is enabled only when both of its values are set.
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {}),
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
        ? { github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET } }
        : {}),
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
