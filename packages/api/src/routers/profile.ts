import { eq } from "drizzle-orm";
import { user } from "@invite-me/db/schema/auth";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { publicProcedure } from "../index";

/** Profile-page settings. The planner toggle makes a user an event planner. */
export const profileRouter = {
  setRole: publicProcedure
    .input(z.object({ role: z.enum(["host", "planner"]) }))
    .handler(async ({ context, input }) => {
      if (!context.userId) throw new ORPCError("UNAUTHORIZED", { message: "Log in first" });
      await context.db.update(user).set({ role: input.role }).where(eq(user.id, context.userId));
      return { role: input.role };
    }),
};
