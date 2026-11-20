import { passkeyClient } from "@better-auth/passkey/client";
import { emailOTPClient, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ENV } from "../env.public";

export const authClient = createAuthClient({
  baseURL: `${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/api/auth`,
  plugins: [emailOTPClient(), magicLinkClient(), passkeyClient()],
});
