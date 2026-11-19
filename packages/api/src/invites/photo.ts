import type { Database } from "@invite-me/db";

import { InviteError } from "./party";
import { setCouplePhotoKey } from "./store";
import { randomToken } from "./token";

/** Largest accepted upload. The browser crops to an 800px square, so real uploads are far smaller. */
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

/** Keys are `couple/<clientId>/<random>.webp`. A re-upload gets a new key, so served objects never change. */
export const COUPLE_KEY = /^couple\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+\.webp$/;

/** The one R2 call the API makes. Structural, so the Worker binding fits without importing workers types. */
export type PhotoBucket = {
  put(key: string, value: Uint8Array, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
};

const decoder = new TextDecoder();

/** RIFF container with a WEBP form type. Rejects anything else before it reaches R2. */
export function isWebp(bytes: Uint8Array): boolean {
  return bytes.length >= 12 && decoder.decode(bytes.subarray(0, 4)) === "RIFF" && decoder.decode(bytes.subarray(8, 12)) === "WEBP";
}

/** Validates, writes the object, and records its key on the given invitation. Returns the key. */
export async function storeCouplePhoto(
  db: Database,
  bucket: PhotoBucket,
  clientId: string,
  eventId: string,
  bytes: Uint8Array,
): Promise<string> {
  if (bytes.byteLength === 0 || bytes.byteLength > PHOTO_MAX_BYTES) {
    throw new InviteError("INVALID_INPUT", "Photo must be under 2 MB");
  }
  if (!isWebp(bytes)) throw new InviteError("INVALID_INPUT", "Photo must be WebP");
  const key = `couple/${clientId}/${randomToken()}.webp`;
  await bucket.put(key, bytes, { httpMetadata: { contentType: "image/webp" } });
  await setCouplePhotoKey(db, clientId, eventId, key);
  return key;
}
