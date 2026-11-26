import { ORPCError } from "@orpc/server";

import { InviteError } from "../invites/party";

/** Maps domain errors to oRPC errors; anything else propagates as a 500. */
export async function guard<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof InviteError) {
      const code = error.code === "NOT_FOUND" ? "NOT_FOUND" : "BAD_REQUEST";
      throw new ORPCError(code, { message: error.message });
    }
    throw error;
  }
}
