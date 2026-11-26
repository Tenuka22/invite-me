import type { PresetId } from "@invite-me/api/invites/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { HostShell } from "@/components/host-shell";
import { InvitationList } from "@/components/invitation-tile";
import { TemplatePicker } from "@/components/new-invitation-dialog";
import { PageSkeleton } from "@/components/skeletons";
import { PageHeader, buttonStyles } from "@/components/ui";
import { getSession } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  component: HomePage,
  pendingComponent: () => (
    <HostShell>
      <PageSkeleton />
    </HostShell>
  ),
  ssr: false,
  // Public page: visitors can browse and preview every design. Only the visitor's own invitations
  // and "Use this design" need an account.
  beforeLoad: async ({ context }) => {
    // If the account service cannot be reached, the visitor can still browse the designs.
    let signedIn = false;
    try {
      signedIn = Boolean((await getSession()).data);
    } catch {
      // browse as a visitor
    }
    if (signedIn) void context.queryClient.prefetchQuery(orpc.invitations.list.queryOptions());
    return { signedIn };
  },
});

function HomePage() {
  const { signedIn } = Route.useRouteContext();
  return (
    <HostShell signedIn={signedIn}>{signedIn ? <InvitationList title="Your invitations" /> : <Browse />}</HostShell>
  );
}

/** Signed-out visitors: look at every design, sign in to use one. */
function Browse() {
  const [picked, setPicked] = useState<PresetId | null>(null);
  return (
    <>
      <PageHeader
        title="Invitations, made simple"
        description="Browse the designs and see how each looks. Sign in when you want to make one."
      />
      <div className="grid gap-5">
        <TemplatePicker value={picked} onChange={setPicked} />
        <div>
          <Link to="/login" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Sign in to use this design
          </Link>
        </div>
      </div>
    </>
  );
}
