import { Button } from "@invite-me/ui/components/motion/button/base";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { longDate } from "@/lib/format";
import { InvitationsSkeleton } from "@/components/page-skeletons";
import { CardThumb } from "@/components/card-thumb";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/")({
  // Fetch before the page mounts so the list paints with data, or the skeleton shows while it loads.
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.orpc.invitations.list.queryOptions()),
  pendingComponent: InvitationsSkeleton,
  pendingMs: 0,
  pendingMinMs: 250,
  component: InvitationsPage,
});

function InvitationsPage() {
  const navigate = useNavigate();
  const invitations = useQuery(orpc.invitations.list.queryOptions());
  const items = invitations.data ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-8 md:pt-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl tracking-[-0.03em] md:text-5xl">Invitations</h1>
          {invitations.isSuccess && (
            <p className="mt-2 text-sm text-muted-foreground">
              {items.length === 1 ? "1 invitation" : `${items.length} invitations`}
            </p>
          )}
        </div>
      </div>

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
        <ul className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
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
        </ul>
      )}
    </main>
  );
}
