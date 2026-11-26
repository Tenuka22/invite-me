import { ButtonLink } from "@invite-me/ui/components/motion/button/base";
import { ListSkeleton } from "@/components/skeletons";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PageTitle } from "@/components/host-shell";
import { InvitationCard } from "@/components/invitation-card";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/")({
  component: InvitationsPage,
});

function InvitationsPage() {
  const list = useQuery(orpc.invitations.list.queryOptions());
  return (
    <div>
      <PageTitle title="Invitations" sub="Open one to add guests and see who is coming." />
      {!list.data ? (
        <ListSkeleton />
      ) : list.data.length === 0 ? (
        <div className="grid justify-items-start gap-4">
          <p className="text-muted-foreground">You have no invitations yet.</p>
          <ButtonLink href="/invitations/new">Create your first invitation</ButtonLink>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {list.data.map((inv) => (
            <li key={inv.id}>
              <InvitationCard id={inv.id} card={inv.card} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
