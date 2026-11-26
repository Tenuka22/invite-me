import type { GuestPartyView } from "./types";

/**
 * Who the card is for: the guest's name with their seats and table. On a printed template with
 * no guest chosen it is a blank line to write the name on by hand.
 */
export function Invited({ party, print }: { party: GuestPartyView; print?: boolean }) {
  const name = party.displayName.trim();
  if (!name && !print) return null;
  const detail = [party.seats > 1 ? `${party.seats} seats` : "", party.seatLabel ?? ""].filter(Boolean).join(" · ");
  return (
    <p className="invited">
      <span className="invited-label">Invited</span>
      {name ? (
        <span className="invited-name">
          {name}
          {detail ? <span className="invited-detail"> · {detail}</span> : null}
        </span>
      ) : (
        <span className="invited-blank" />
      )}
    </p>
  );
}
