import { z } from "zod";

const line = (max: number) => z.string().max(max);

/** Card content for one wedding event. Text is stored as typed; layout handles case. */
export const cardSchema = z.object({
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
  rsvpContacts: z
    .array(z.object({ name: line(40), phone: line(24) }))
    .min(1)
    .max(5),
  rules: line(400),
});

export type Card = z.infer<typeof cardSchema>;

/** Template copy from `docs/invite-v1-01.png`, used until the host edits. */
export const DEFAULT_CARD: Card = {
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
};

/** What a new invitation starts as: nothing is filled in for the host. */
export const EMPTY_CARD: Card = {
  hostLine1: "",
  connector: "",
  hostLine2: "",
  requestLine: "",
  occasionLine: "",
  name1: "",
  name2: "",
  date: "",
  timeFrom: "",
  timeTo: "",
  subEvents: [],
  venueName: "",
  city: "",
  rsvpContacts: [{ name: "", phone: "" }],
  rules: "",
};

/** Hints shown in empty fields and, for display only, in empty parts of the card. */
export const CARD_PLACEHOLDERS = {
  hostLine1: "MR. XXX & MRS. XXXX",
  connector: "TOGETHER WITH",
  hostLine2: "MR. & MRS. XXXX",
  requestLine: "WARMLY REQUEST THE HONOR OF YOUR PRESENCE",
  occasionLine: "ON THE OCCASION OF THE MARRIAGE OF THEIR CHILDREN",
  name1: "Name",
  name2: "Name",
  date: "2026-01-24",
  timeFrom: "9.30 AM",
  timeTo: "2.30 PM",
  venueName: "VENUE",
  city: "CITY",
  contactName: "NAME",
  contactPhone: "077 000 0000",
} as const;

/** The card as it is drawn: empty text falls back to its placeholder. Never saved. */
export function withPlaceholders(card: Card): Card {
  const fill = (value: string, placeholder: string) => (value.trim() ? value : placeholder);
  return {
    ...card,
    hostLine1: fill(card.hostLine1, CARD_PLACEHOLDERS.hostLine1),
    connector: fill(card.connector, CARD_PLACEHOLDERS.connector),
    hostLine2: fill(card.hostLine2, CARD_PLACEHOLDERS.hostLine2),
    requestLine: fill(card.requestLine, CARD_PLACEHOLDERS.requestLine),
    occasionLine: fill(card.occasionLine, CARD_PLACEHOLDERS.occasionLine),
    name1: fill(card.name1, CARD_PLACEHOLDERS.name1),
    name2: fill(card.name2, CARD_PLACEHOLDERS.name2),
    date: Number.isNaN(new Date(`${card.date}T00:00:00Z`).getTime()) ? CARD_PLACEHOLDERS.date : card.date,
    timeFrom: fill(card.timeFrom, CARD_PLACEHOLDERS.timeFrom),
    timeTo: fill(card.timeTo, CARD_PLACEHOLDERS.timeTo),
    venueName: fill(card.venueName, CARD_PLACEHOLDERS.venueName),
    city: fill(card.city, CARD_PLACEHOLDERS.city),
    rsvpContacts: card.rsvpContacts.map((c) => ({
      name: fill(c.name, CARD_PLACEHOLDERS.contactName),
      phone: fill(c.phone, CARD_PLACEHOLDERS.contactPhone),
    })),
  };
}

/** Month, day, weekday and year for the date line, in English and UTC so no timezone shifts it. */
export function cardDateParts(iso: string): {
  month: string;
  day: string;
  weekday: string;
  year: string;
} {
  const d = new Date(`${iso}T00:00:00Z`);
  return {
    month: d.toLocaleString("en-US", { month: "long", timeZone: "UTC" }).toUpperCase(),
    day: String(d.getUTCDate()),
    weekday: d.toLocaleString("en-US", { weekday: "long", timeZone: "UTC" }).toUpperCase(),
    year: String(d.getUTCFullYear()),
  };
}
