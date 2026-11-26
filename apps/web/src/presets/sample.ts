import { DEFAULT_CARD, type PresetId } from "@invite-me/api/invites/card";

/** Sample content for previews, labelled as such: a future date so the countdown runs, and a Colombo pin for the map. */
export function sampleCard(preset: PresetId, look: Record<string, string> = {}) {
  return {
    ...DEFAULT_CARD,
    preset,
    look,
    hostLine1: "Mr. & Mrs. Perera",
    hostLine2: "Mr. & Mrs. Silva",
    date: "2027-01-23",
    mapsUrl: "https://maps.google.com/?q=6.9295,79.8433",
    venueGeo: { lat: 6.9295, lng: 79.8433 },
  };
}

export const SAMPLE_PARTY = {
  displayName: "Silva Family",
  ageGroup: "family",
  seats: 4,
  seatLabel: "Hall B, table 4",
  rules: "Please arrive by 9.00 AM",
} as const;
