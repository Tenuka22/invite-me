import type { Card } from "@invite-me/api/invites/card";

function icsEscape(text: string) {
  return text.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
}

/** All-day calendar file: the card's times are free text, so they go in the description rather than guessed into a start time. */
export function downloadCalendar(card: Card) {
  const day = card.date.replaceAll("-", "");
  const next = new Date(`${card.date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replaceAll("-", "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//InviteMe//EN",
    "BEGIN:VEVENT",
    `UID:${day}-${card.name1}-${card.name2}@inviteme`.replace(/\s/g, ""),
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEscape(`${card.name1} & ${card.name2}`)}`,
    `LOCATION:${icsEscape(`${card.venueName}, ${card.city}`)}`,
    `DESCRIPTION:${icsEscape(`From ${card.timeFrom} to ${card.timeTo}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "invitation.ics" });
  a.click();
  URL.revokeObjectURL(url);
}

/** Link that opens the venue in Google Maps: the host's own link when given, else a search. */
export function mapsLinkFor(card: Card): string {
  if (card.mapsUrl) return card.mapsUrl;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${card.venueName}, ${card.city}`)}`;
}
