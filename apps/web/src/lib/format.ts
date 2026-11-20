/** "2026-01-24" → "Saturday, 24 January 2026"; anything unparseable is returned as typed. */
export function longDate(iso: string, weekday = true) {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-GB", {
    ...(weekday ? { weekday: "long" as const } : {}),
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
