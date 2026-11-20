import { passkey } from "@better-auth/passkey";
import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import type { Database } from "@invite-me/db";
import * as schema from "@invite-me/db/schema/auth";
import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { magicLink } from "better-auth/plugins/magic-link";

import { type EmailConfig, sendEmail } from "./email";

export type AuthConfig = EmailConfig & {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
};

/** Which sign-in methods this deployment can really offer. Email needs a sender; the console mock only counts on localhost. */
export function signInMethods(env: AuthConfig) {
  const local = ["localhost", "127.0.0.1"].includes(new URL(env.BETTER_AUTH_URL).hostname);
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    github: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    email: (env.EMAIL_PROVIDER || "console") !== "console" || local,
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
    emailAndPassword: { enabled: true },
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
    plugins: [
      ...(signInMethods(env).email
        ? [
            emailOTP({
              async sendVerificationOTP({ email, otp, type }) {
                const subject = type === "sign-in" ? "Your sign-in code" : "Your verification code";
                await sendEmail(env, {
                  to: email,
                  subject,
                  text: `Your code is ${otp}. It expires in 5 minutes.`,
                });
              },
            }),
            magicLink({
              async sendMagicLink({ email, url }) {
                await sendEmail(env, {
                  to: email,
                  subject: "Your sign-in link",
                  text: `Sign in here: ${url}`,
                });
              },
            }),
          ]
        : []),
      passkey({
        rpID: new URL(env.CORS_ORIGIN).hostname,
        rpName: "Invite Me",
        origin: env.CORS_ORIGIN,
      }),
    ],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
