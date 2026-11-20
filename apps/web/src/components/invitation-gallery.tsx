import type { InvitationView } from "@invite-me/api/invites/store";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { CardThumb } from "@/components/card-thumb";
import { longDate } from "@/lib/format";

/** Invitations as the cards guests will see, with a tile at the end to start another. */
export function InvitationGallery({ items }: { items: InvitationView[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((invitation) => {
        const names = [invitation.card.name1, invitation.card.name2].filter(Boolean).join(" & ");
        return (
          <li key={invitation.id}>
            <Link
              to="/invitations/$id"
              params={{ id: invitation.id }}
              className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-foreground/10 transition-transform duration-200 group-hover:-translate-y-1">
                <CardThumb card={invitation.card} />
              </div>
              <p className="mt-4 font-display text-xl leading-tight tracking-[-0.02em] text-balance">
                {names || "Untitled"}
              </p>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {invitation.card.date ? longDate(invitation.card.date, false) : "No date yet"}
              </p>
            </Link>
          </li>
        );
      })}
      <li>
        <Link
          to="/invitations/new"
          className="group flex aspect-[1075/1523] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-foreground/20 text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="grid size-12 place-items-center rounded-full bg-muted transition-colors group-hover:bg-primary/10">
            <Plus className="size-6" aria-hidden />
          </span>
          <span className="font-medium">New invitation</span>
        </Link>
      </li>
    </ul>
  );
}
