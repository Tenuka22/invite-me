export type GeoPoint = { lat: number; lng: number };

const GOOGLE_HOSTS = /(^|\.)(google\.[a-z.]+|share\.google|goo\.gl|maps\.app\.goo\.gl|g\.co)$/i;

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

/** Text of a place search in a Google link (`q` or `query`), when it is a name rather than coordinates. */
function placeQuery(raw: string): string | null {
  try {
    const url = new URL(raw);
    for (const key of ["q", "query"]) {
      const value = url.searchParams.get(key)?.trim();
      if (value && !new RegExp(`^${NUM}\\s*,\\s*${NUM}`).test(value)) return value;
    }
  } catch {
    // not a URL
  }
  return null;
}

/** Looks a place name up on OpenStreetMap's Nominatim (free, no key). Used when a link names a place but carries no pin. */
export async function geocodePlace(query: string, fetchImpl: typeof fetch = fetch): Promise<GeoPoint | null> {
  try {
    const res = await fetchImpl(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { "user-agent": "InviteMe/1.0 (wedding invitations)", accept: "application/json" },
    });
    if (!res.ok) return null;
    const hit = ((await res.json()) as { lat?: string; lon?: string }[])[0];
    return hit?.lat && hit.lon ? point(Number(hit.lat), Number(hit.lon)) : null;
  } catch {
    return null;
  }
}

/**
 * Follows a Google Maps link (short links and `share.google` too; up to five redirects, Google
 * hosts only) and reads the pin. A link that only names a place (a Google search for "The
 * Kingsbury Colombo") is looked up by name. Server-side only: browsers cannot read cross-origin redirects.
 */
export async function resolveMapsUrl(raw: string, fetchImpl: typeof fetch = fetch): Promise<GeoPoint | null> {
  let current = raw;
  let named: string | null = null;
  for (let hop = 0; hop < 6; hop++) {
    if (!isGoogleMapsUrl(current)) break;
    const direct = parseGoogleMapsUrl(current);
    if (direct) return direct;
    named = placeQuery(current) ?? named;
    const res = await fetchImpl(current, { redirect: "manual" });
    const next = res.headers.get("location");
    if (!next) break;
    current = new URL(next, current).toString();
  }
  return named ? geocodePlace(named, fetchImpl) : null;
}
