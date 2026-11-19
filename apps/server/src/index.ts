import { clientIdForUser } from "@invite-me/api/invites/host";
import { InviteError } from "@invite-me/api/invites/party";
import { COUPLE_KEY, PHOTO_MAX_BYTES, storeCouplePhoto } from "@invite-me/api/invites/photo";
import { appRouter } from "@invite-me/api/routers/index";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { createAuth } from "./services";

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

/** CSRF: auth and host cookies are SameSite=None, so cross-site requests carry them. Mutations must come from our web origin. */
const requireWebOrigin: MiddlewareHandler = async (c, next) => {
  if (c.req.method === "GET" || c.req.method === "OPTIONS") return next();
  if (c.req.header("origin") !== ENV.CORS_ORIGIN) {
    return c.json({ message: "Cross-site request blocked" }, 403);
  }
  return next();
};
app.use("/rpc/*", requireWebOrigin);
app.use("/api/*", requireWebOrigin);

app.on(["POST", "GET"], "/api/auth/*", async (c) => (await createAuth()).handler(c.req.raw));

/** Host uploads the processed couple photo as raw WebP bytes for one invitation the host owns. */
app.post("/api/photo/couple", async (c) => {
  const context = await createContext({ context: c });
  if (!context.userId) return c.json({ message: "Log in first" }, 401);
  const clientId = await clientIdForUser(context.db, context.userId);
  const eventId = c.req.query("invitation");
  if (!eventId) return c.json({ message: "Missing invitation" }, 400);
  if (Number(c.req.header("content-length") ?? 0) > PHOTO_MAX_BYTES) {
    return c.json({ message: "Photo must be under 2 MB" }, 413);
  }
  const bytes = new Uint8Array(await c.req.arrayBuffer());
  try {
    const key = await storeCouplePhoto(context.db, ENV.PHOTOS, clientId, eventId, bytes);
    return c.json({ key });
  } catch (error) {
    if (error instanceof InviteError) return c.json({ message: error.message }, 400);
    throw error;
  }
});

/** Public couple photo. Keys carry a random id and change on re-upload, so responses are immutable. */
app.get("/photos/couple/:clientId/:file", async (c) => {
  const key = `couple/${c.req.param("clientId")}/${c.req.param("file")}`;
  if (!COUPLE_KEY.test(key)) return c.notFound();
  const object = await ENV.PHOTOS.get(key);
  if (!object) return c.notFound();
  return new Response(object.body, {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
  });
});

export const apiHandler = new OpenAPIHandler(appRouter, {
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

app.use("/*", async (c, next) => {
  const context = await createContext({ context: c });

  const rpcResult = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: context,
  });

  if (rpcResult.matched) {
    return c.newResponse(rpcResult.response.body, rpcResult.response);
  }

  const apiResult = await apiHandler.handle(c.req.raw, {
    prefix: "/api-reference",
    context: context,
  });

  if (apiResult.matched) {
    return c.newResponse(apiResult.response.body, apiResult.response);
  }

  await next();
});

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
