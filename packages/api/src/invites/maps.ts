export type GeoPoint = { lat: number; lng: number };

const GOOGLE_HOSTS = /(^|\.)(google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl|g\.co)$/i;

/** True for links on Google Maps hosts, including short `maps.app.goo.gl` links. */
export function isGoogleMapsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && GOOGLE_HOSTS.test(url.hostname);
  } catch {
    return false;
  }
}

function point(lat: number, lng: number): GeoPoint | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

const NUM = "(-?\\d{1,3}(?:\\.\\d+)?)";

/**
 * Reads coordinates from a full Google Maps URL. Place pins (`!3d…!4d…`) win over the
 * viewport (`@lat,lng`), which is only where the map was centred. Short links return null;
 * resolve them first with `resolveMapsUrl` on the server.
 */
export function parseGoogleMapsUrl(raw: string): GeoPoint | null {
  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    // keep the raw text
  }
  const pin = text.match(new RegExp(`!3d${NUM}!4d${NUM}`));
  if (pin) return point(Number(pin[1]), Number(pin[2]));
  try {
    const url = new URL(raw);
    for (const key of ["q", "query", "ll", "destination", "center"]) {
      const value = url.searchParams.get(key);
      const m = value?.match(new RegExp(`^\\s*${NUM}\\s*,\\s*${NUM}`));
      if (m) return point(Number(m[1]), Number(m[2]));
    }
  } catch {
    return null;
  }
  const at = text.match(new RegExp(`@${NUM},${NUM}`));
  if (at) return point(Number(at[1]), Number(at[2]));
  return null;
}

/**
 * Follows a Google Maps short link (up to five redirects, Google hosts only) and parses the
 * destination. Server-side only: browsers cannot read cross-origin redirects.
 */
export async function resolveMapsUrl(raw: string, fetchImpl: typeof fetch = fetch): Promise<GeoPoint | null> {
  let current = raw;
  for (let hop = 0; hop < 6; hop++) {
    if (!isGoogleMapsUrl(current)) return null;
    const direct = parseGoogleMapsUrl(current);
    if (direct) return direct;
    const res = await fetchImpl(current, { redirect: "manual" });
    const next = res.headers.get("location");
    if (!next) return null;
    current = new URL(next, current).toString();
  }
  return null;
}
