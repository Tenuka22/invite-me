import { Button } from "@invite-me/ui/components/motion/button/base";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

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

function InvitationsPage() {
  const navigate = useNavigate();
  const invitations = useQuery(orpc.invitations.list.queryOptions());
  const items = invitations.data ?? [];

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
        <div className="mt-10">
          <InvitationGallery items={items} />
        </div>
      )}
    </main>
  );
}
