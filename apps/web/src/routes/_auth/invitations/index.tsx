import { Button } from "@invite-me/ui/components/motion/button/base";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { InvitationGallery } from "@/components/invitation-gallery";
import { InvitationsSkeleton } from "@/components/page-skeletons";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/")({
  // Fetch before the page mounts so the list paints with data, or the skeleton shows while it loads.
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.orpc.invitations.list.queryOptions()),
  pendingComponent: InvitationsSkeleton,
  component: InvitationsPage,
});

/** Brides and grooms ranked across your invitations by their responses. */
function Leaderboard() {
  const leaderboard = useQuery(orpc.leaderboard.get.queryOptions());
  const entries = leaderboard.data ?? [];

  if (leaderboard.isPending) {
    return (
      <section className="mt-14 grid gap-4">
        <h2 className="font-display text-2xl tracking-[-0.01em]">Leaderboard</h2>
        <ol className="grid gap-3">
          <li className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
        </ol>
        <span className="sr-only">Loading leaderboard…</span>
      </section>
    );
  }
  if (entries.length === 0) {
    return (
      <section className="mt-14 grid gap-4">
        <h2 className="font-display text-2xl tracking-[-0.01em]">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">Add guests to their invitations and start building the rankings.</p>
      </section>
    );
  }

  return (
    <section className="mt-14 grid gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-2xl tracking-[-0.01em]">Leaderboard</h2>
        <p className="text-sm text-muted-foreground">Couples ranked by confirmed RSVPs, opens, maybe and no replies.</p>
      </div>
      <ol className="grid gap-3">
        {entries.map((couple, i) => (
          <li key={couple.eventId} className="rounded-2xl border border-border bg-card px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <span className="text-lg font-semibold text-muted-foreground tabular-nums">#{i + 1}</span>
              <Link
                to="/invitations/$id"
                params={{ id: couple.eventId }}
                className="font-display text-xl leading-tight tracking-[-0.02em] text-balance"
              >
                {couple.coupleName}
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[couple.venue, couple.city].filter(Boolean).join(", ")}
            </p>
            <p className="mt-1.5 text-sm">
              <span className="font-semibold">{couple.confirmedSeats}</span>
              <span className="text-muted-foreground"> confirmed · {couple.maybe} maybe · {couple.no} no · {couple.opens} opened</span>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function InvitationsPage() {
  const navigate = useNavigate();
  const invitations = useQuery(orpc.invitations.list.queryOptions());
  const items = invitations.data ?? [];
  // Show the last 3–4 to keep the gallery light.
  const gallery = items.slice(-4);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-8 md:pt-12">
      <h1 className="font-display text-4xl tracking-[-0.03em] md:text-5xl">Invitations</h1>
      {invitations.isSuccess && (
        <p className="mt-2 text-sm text-muted-foreground">
          {items.length === 1 ? "1 invitation" : `${items.length} invitations`}
        </p>
      )}

      {invitations.isError ? (
        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <p className="font-medium">We couldn't load your invitations.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection, then try again.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => invitations.refetch()}>
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-start gap-3 border-t border-border pt-12">
          <p className="font-display text-2xl">Nothing to send yet.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Start with a template, fill in the names and details, and share a link your guests can open.
          </p>
          <Button variant="primary" size="sm" className="mt-2" onClick={() => navigate({ to: "/invitations/new" })}>
            Create your first invitation
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-8">
          <InvitationGallery items={gallery} />
          <Leaderboard />
        </div>
      )}
    </main>
  );
}
