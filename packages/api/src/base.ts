import { os } from "@orpc/server";

import type { Context } from "./context";

// Leaf module: routers import this at module scope, so nothing here may import
// a router — otherwise the bundled worker can initialize routers before `o`
// is set (circular import: server → routers → index → routers → …).
export const o = os.$context<Context>();

export const publicProcedure = o;
