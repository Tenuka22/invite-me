import { cardSchema } from "@invite-me/api/invites/card";
import type { Context } from "hono";
import { z } from "zod";

import { ENV } from "./env.server";
import { createAuth } from "./services";

const partySchema = z.object({
  displayName: z.string().max(200),
  ageGroup: z.string().nullable(),
  seats: z.number().int().min(0).max(100),
  seatLabel: z.string().max(200).nullable(),
  rules: z.string().max(2000).nullable(),
});

const MAX_SHEETS = 300;

const printSchema = z.object({
  size: z.enum(["a6", "a5", "a4"]),
  landscape: z.boolean(),
  marks: z.boolean(),
  card: cardSchema,
  parties: z.array(partySchema.nullable()).min(1).max(MAX_SHEETS),
});

function base64Url(text: string): string {
  let binary = "";
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Makes the invitation PDF in a headless browser: it opens the web app's `/print-sheet` page,
 * which draws the sheets at their real millimetre size, and prints it with the page's own
 * `@page` size, so the paper size never depends on the visitor's print dialog.
 */
export async function printPdf(c: Context): Promise<Response> {
  const session = await (await createAuth()).api.getSession({ headers: c.req.raw.headers });
  if (!session) return c.json({ message: "Sign in to download a PDF" }, 401);

  const parsed = printSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ message: "That print job is not valid" }, 400);

  const origin = String(ENV.CORS_ORIGIN).replace(/\/$/, "");
  const response = await ENV.BROWSER.quickAction("pdf", {
    url: `${origin}/print-sheet#${base64Url(JSON.stringify(parsed.data))}`,
    viewport: { width: 1280, height: 900 },
    gotoOptions: { waitUntil: "networkidle0", timeout: 30_000 },
    waitForSelector: { selector: "body[data-ready]", timeout: 45_000 },
    cacheTTL: 0,
    pdfOptions: { printBackground: true, preferCSSPageSize: true, timeout: 60_000 },
  });
  if (!response.ok) {
    console.error("pdf render failed", response.status, await response.text());
    return c.json({ message: "The PDF could not be made right now. Try again, or print from the browser." }, 502);
  }
  return new Response(response.body, {
    headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store" },
  });
}
