import { describe, expect, test } from "bun:test";

import type { Database } from "@invite-me/db";

import { InviteError } from "./party";
import { COUPLE_KEY, PHOTO_MAX_BYTES, isWebp, storeCouplePhoto } from "./photo";

const encoder = new TextEncoder();
const webp = new Uint8Array([...encoder.encode("RIFF"), 0, 0, 0, 0, ...encoder.encode("WEBP"), 1, 2]);
const bucket = { put: async () => undefined };
// Validation throws before any database access, so the database is never touched here.
const unusedDb = {} as Database;

describe("couple photo validation", () => {
  test("accepts a RIFF container with a WEBP form type", () => {
    expect(isWebp(webp)).toBe(true);
  });

  test("rejects JPEG bytes and buffers too short to hold the header", () => {
    expect(isWebp(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
    expect(isWebp(webp.subarray(0, 8))).toBe(false);
  });

  test("storeCouplePhoto rejects oversize and non-WebP input as InviteError", async () => {
    await expect(
      storeCouplePhoto(unusedDb, bucket, "client1", "event1", new Uint8Array(PHOTO_MAX_BYTES + 1)),
    ).rejects.toBeInstanceOf(InviteError);
    await expect(
      storeCouplePhoto(unusedDb, bucket, "client1", "event1", new Uint8Array(64)),
    ).rejects.toBeInstanceOf(InviteError);
  });

  test("served key pattern accepts generated keys and rejects path traversal", () => {
    expect(COUPLE_KEY.test("couple/AbC_9-x/tok-en_1.webp")).toBe(true);
    expect(COUPLE_KEY.test("couple/../secret/x.webp")).toBe(false);
    expect(COUPLE_KEY.test("couple/c/x.webp.exe")).toBe(false);
  });
});
