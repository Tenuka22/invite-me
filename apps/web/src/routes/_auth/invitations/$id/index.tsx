import { Button } from "@invite-me/ui/components/motion/button/base";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, UserPlus } from "lucide-react";

import { GuestAvatar } from "@/components/guest-avatar";
import { POLL_MS } from "@/lib/poll";
import { longDate } from "@/lib/format";
import { Skeleton } from "@/components/skeleton";
import { CardThumb } from "@/components/card-thumb";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/")({
  component: InvitationDashboard,
});

const RSVP_LABEL = { pending: "Waiting", yes: "Coming", no: "Can't come", maybe: "Maybe" } as const;

function InvitationDashboard() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // The list already holds this invitation, so the page can paint at once and refresh behind it.
  const invitation = useQuery({
    ...orpc.invitations.get.queryOptions({ input: { id } }),
    placeholderData: () =>
      queryClient.getQueryData(orpc.invitations.list.queryKey())?.find((item) => item.id === id),
  });
  const meter = useQuery({ ...orpc.meter.get.queryOptions({ input: { eventId: id } }), refetchInterval: POLL_MS });
  const parties = useQuery({ ...orpc.parties.list.queryOptions({ input: { eventId: id } }), refetchInterval: POLL_MS });
  const card = invitation.data?.card;
  const m = meter.data;
  const share = m && m.allottedSeats > 0 ? Math.round((m.confirmedSeats / m.allottedSeats) * 100) : 0;
  const guests = parties.data ?? [];

  const names = card ? [card.name1, card.name2].filter(Boolean).join(" & ") || "Untitled" : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 pt-4 pb-16">
      <h1 className="font-display text-4xl tracking-[-0.02em] text-balance">
        {names ?? <Skeleton className="h-9 w-72 max-w-full" />}
      </h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
      <Link
        to="/invitations/$id/edit"
        params={{ id }}
        aria-label="Edit the invitation card"
        className="mx-auto block w-36 self-start overflow-hidden rounded-lg shadow-xl ring-1 ring-foreground/10 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring lg:mx-0 lg:w-full"
      >
        {card ? (
          <CardThumb card={card} />
        ) : (
          <Skeleton className="aspect-[0.706] w-full rounded-none" />
        )}
      </Link>

      <div className="grid min-w-0 content-start gap-10">
        <section>
          {card ? (
            <>
              <p className="font-display text-3xl tracking-[-0.02em] text-balance">
                {card.date ? longDate(card.date) : "Date not set"}
              </p>
              <p className="mt-1.5 text-muted-foreground">
                {[card.venueName, card.city].filter(Boolean).join(", ") || "Venue not set"}
              </p>
            </>
          ) : (
            <div role="status" className="grid gap-2">
              <Skeleton className="h-8 w-72 max-w-full" />
              <Skeleton className="h-4 w-48" />
              <span className="sr-only">Loading invitation…</span>
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:flex">
            <Button
              size="lg"
              className="sm:min-w-40"
              onClick={() => navigate({ to: "/invitations/$id/edit", params: { id } })}
            >
              <Pencil className="size-4" aria-hidden />
              Edit card
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-foreground/25 sm:min-w-40"
              onClick={() => navigate({ to: "/invitations/$id/add-guest", params: { id } })}
            >
              <UserPlus className="size-4" aria-hidden />
              Add guest
            </Button>
          </div>
        </section>

        <section aria-labelledby="replies">
          <h2 id="replies" className="font-display text-xl tracking-[-0.01em]">
            Replies
          </h2>
          {m ? (
            <>
              <p className="mt-3 text-sm">
                <span className="text-2xl font-semibold tabular-nums">{m.confirmedSeats}</span>
                <span className="text-muted-foreground"> of {m.allottedSeats} seats confirmed</span>
              </p>
              <div
                role="progressbar"
                aria-label="Seats confirmed"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={share}
                className="mt-3 h-2 overflow-hidden rounded-full bg-border"
              >
                <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${share}%` }} />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {m.maybe} maybe · {m.no} declined · {m.notOpened} haven't opened · {m.notShared} not shared yet
              </p>
            </>
          ) : (
            <div role="status" className="mt-3 grid gap-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-2 w-full" />
              <span className="sr-only">Loading replies…</span>
            </div>
          )}
        </section>

        <section aria-labelledby="guests-heading">
          <div className="flex items-baseline justify-between">
            <h2 id="guests-heading" className="font-display text-xl tracking-[-0.01em]">
              Guests
            </h2>
            {parties.data ? (
              <span className="text-sm tabular-nums text-muted-foreground">{guests.length}</span>
            ) : null}
          </div>
          {!parties.data ? (
            <div role="status" className="mt-3 grid gap-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <span className="sr-only">Loading guests…</span>
            </div>
          ) : guests.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No guests yet. Add the first one to get their personal link.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {guests.map((party) => (
                <li key={party.id}>
                  <Link
                    to="/invitations/$id/guest/$partyId"
                    params={{ id, partyId: party.id }}
                    className="-mx-2 flex min-h-14 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <GuestAvatar seed={party.id} size={36} />
                    <span className="min-w-0 flex-1 truncate">{party.displayName}</span>
                    <span className="text-sm text-muted-foreground">
                      {party.revoked ? "Revoked" : RSVP_LABEL[party.rsvp]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      </div>
    </main>
  );
}
