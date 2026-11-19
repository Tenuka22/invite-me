const encoder = new TextEncoder();

/** Random URL-safe token. 16 bytes = 128 bits of entropy. */
export function randomToken(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let binary = "";
  for (const b of buf) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 hex of a high-entropy secret. Only this hash is stored. */
export async function hashSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Compares two equal-length hex strings without early exit. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Splits `<id>.<secret>`. Base64url has no dots, so the first dot is the separator. */
export function parseLinkToken(token: string): { id: string; secret: string } | null {
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  return { id: token.slice(0, dot), secret: token.slice(dot + 1) };
}

/**
 * Deterministic guest-link secret for one party. HMAC-SHA256 under the server
 * key, base64url. Recomputed on every request, so no per-party secret is stored
 * and the QR can be rebuilt from the list. Rotating the key revokes all links.
 */
export async function deriveLinkSecret(key: string, clientId: string, partyId: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(`${clientId}:${partyId}`));
  let binary = "";
  for (const b of new Uint8Array(mac)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
