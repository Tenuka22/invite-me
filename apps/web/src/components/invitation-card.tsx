import type { Card } from "@invite-me/api/invites/card";
import { cardDateParts } from "@invite-me/api/invites/card";
import { Link } from "@tanstack/react-router";

import { presetFor } from "@/presets";

/** Title the host sees for an invitation: the couple's names. */
export function invitationTitle(card: Card) {
  return `${titleCase(card.name1)} & ${titleCase(card.name2)}`;
}

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

export function invitationDate(card: Card) {
  const d = cardDateParts(card.date);
  return `${titleCase(d.weekday)}, ${d.day} ${titleCase(d.month)} ${d.year}`;
}

/** A design's still with its name beneath; links to the invitation. */
export function InvitationCard({ id, card }: { id: string; card: Card }) {
  const { Thumb } = presetFor(card.preset);
  return (
    <Link to="/invitations/$id" params={{ id }} className="group grid gap-3">
      <div className="overflow-hidden rounded-2xl shadow-[0_12px_28px_-14px_rgb(60_30_10/0.45)] transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-[0.99]">
        <Thumb card={card} />
      </div>
      <div>
        <p className="font-[Fraunces_Variable,Fraunces,Georgia,serif] text-xl leading-tight">{invitationTitle(card)}</p>
        <p className="text-sm text-muted-foreground">{invitationDate(card)}</p>
      </div>
    </Link>
  );
}
