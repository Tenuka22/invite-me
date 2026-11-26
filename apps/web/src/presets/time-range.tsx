import { type Card, formatTime } from "@invite-me/api/invites/card";

const NBSP = "\u00a0";

/**
 * "9:28 PM to 1:28 AM" in the card's one time format. Stays in sentence case even inside all-caps
 * blocks, and each time stays on one line. `lead` (for example the year) is kept with the first time.
 */
export function TimeRange({ card, lead }: { card: Pick<Card, "timeFrom" | "timeTo">; lead?: string }) {
  const from = formatTime(card.timeFrom);
  const to = formatTime(card.timeTo);
  const first = lead ? (from ? `${lead}${NBSP}·${NBSP}${from}` : lead) : from;
  if (!first) return null;
  return (
    <span style={{ textTransform: "none" }}>
      <span style={{ whiteSpace: "nowrap" }}>{first}</span>
      {to ? (
        <>
          {" to "}
          <span style={{ whiteSpace: "nowrap" }}>{to}</span>
        </>
      ) : null}
    </span>
  );
}
