import { z } from "zod";

const line = (max: number) => z.string().max(max);

/** Who is named as inviting: both parents together, one parent, two families, a single host or family, or nobody. */
export const HOST_MODES = ["parents", "parent", "families", "host", "none"] as const;
export type HostMode = (typeof HOST_MODES)[number];

export const PRESETS = ["traditional-golden-caller", "beira-dusk", "ceylon-block-print", "sanni-tiles"] as const;
export type PresetId = (typeof PRESETS)[number];

/** Card content for one wedding event. Text is stored as typed; layout handles case. */
export const cardSchema = z.object({
  hostMode: z.enum(HOST_MODES).default("families"),
  hostLine1: line(80),
  connector: line(40),
  hostLine2: line(80),
  requestLine: line(120),
  occasionLine: line(160),
  name1: z.string().min(1).max(40),
  name2: z.string().min(1).max(40),
  /** ISO calendar date, `YYYY-MM-DD`. Month and weekday are derived from it. */
  date: z.iso.date(),
  timeFrom: line(20),
  timeTo: line(20),
  subEvents: z.array(z.object({ label: line(60), time: line(20) })).max(5),
  venueName: line(80),
  city: line(60),
  rsvpContacts: z.array(z.object({ name: line(40), phone: line(24) })).min(1).max(5),
  rules: line(400),
  /** Preset-defined appearance choices (option key to choice value). The preset validates them; the API only stores them. */
  look: z.record(z.string().max(32), z.string().max(32)).default({}),
  /** Which preset renders the guest page. */
  preset: z.enum(PRESETS).default("traditional-golden-caller"),
  /** Whether guests may switch to another design for themselves; it never changes what the host chose. */
  allowGuestDesign: z.boolean().default(true),
  /** The Google Maps link the host pasted, kept so guests can open it in Google Maps. */
  mapsUrl: z.string().max(500).default(""),
  /** Venue coordinates resolved from `mapsUrl`; null when no link or it could not be read. */
  venueGeo: z
    .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
    .nullable()
    .default(null),
});

export type Card = z.infer<typeof cardSchema>;

/** Template copy from `docs/invite-v1-01.png`, used until the host edits. */
export const DEFAULT_CARD: Card = {
  hostMode: "families",
  hostLine1: "MR. XXX & MRS. XXXX",
  connector: "TOGETHER WITH",
  hostLine2: "MR. & MRS. XXXX",
  requestLine: "WARMLY REQUEST THE HONOR OF YOUR PRESENCE",
  occasionLine: "ON THE OCCASION OF THE MARRIAGE OF THEIR CHILDREN",
  name1: "BINURI",
  name2: "SAMEERA",
  date: "2026-01-24",
  timeFrom: "9.30 AM",
  timeTo: "2.30 PM",
  subEvents: [{ label: "PORUWA CEREMONY", time: "9.00 AM" }],
  venueName: "THE KINGSBURY",
  city: "COLOMBO",
  rsvpContacts: [{ name: "BINURI", phone: "077 1234 567" }],
  rules: "",
  look: {},
  preset: "traditional-golden-caller",
  allowGuestDesign: true,
  mapsUrl: "",
  venueGeo: null,
};

/** Month, day, weekday and year for the date line, in English and UTC so no timezone shifts it. */
export function cardDateParts(iso: string): { month: string; day: string; weekday: string; year: string } {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    month: d.toLocaleString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase(),
    day: String(d.getUTCDate()),
    weekday: d.toLocaleString("en-US", { weekday: "long", timeZone: "UTC" }).toUpperCase(),
    year: String(d.getUTCFullYear()),
  };
}

/** Wording the editor offers, and the fallbacks used when a line is left blank. */
export const REQUEST_PHRASES = [
  "WARMLY REQUEST THE HONOR OF YOUR PRESENCE",
  "JOYFULLY INVITE YOU",
  "REQUEST THE PLEASURE OF YOUR COMPANY",
] as const;
export const OCCASION_PHRASES = [
  "ON THE OCCASION OF THE MARRIAGE OF THEIR CHILDREN",
  "ON THE OCCASION OF THE MARRIAGE OF THEIR SON",
  "ON THE OCCASION OF THE MARRIAGE OF THEIR DAUGHTER",
  "TO CELEBRATE THE WEDDING OF",
] as const;
export const CONNECTORS = ["TOGETHER WITH", "AND", "WITH"] as const;

/**
 * The lines of the host block, ready to print. Blank lines are dropped, and a card with no host
 * (or one whose host lines are all blank) falls back to a wording that reads right without one.
 */
export function hostBlock(card: Pick<Card, "hostMode" | "hostLine1" | "hostLine2" | "connector" | "requestLine" | "occasionLine">) {
  const one = card.hostLine1.trim();
  const two = card.hostLine2.trim();
  const names = card.hostMode === "none" ? [] : card.hostMode === "families" ? [one, two].filter(Boolean) : [one].filter(Boolean);
  const hosted = names.length > 0;
  return {
    hosts: names,
    connector: card.hostMode === "families" && names.length === 2 ? card.connector.trim() : "",
    request: card.requestLine.trim() || (hosted ? REQUEST_PHRASES[0] : "WARMLY INVITE YOU"),
    occasion: card.occasionLine.trim() || (hosted ? OCCASION_PHRASES[0] : OCCASION_PHRASES[3]),
  };
}

/** "9.30 AM to 2.30 PM", or just the start when no end time is given. */
export function timeRange(card: Pick<Card, "timeFrom" | "timeTo">): string {
  return [card.timeFrom.trim(), card.timeTo.trim()].filter(Boolean).join(" to ");
}
