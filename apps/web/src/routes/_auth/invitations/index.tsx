import { createFileRoute } from "@tanstack/react-router";

import { InvitationList } from "@/components/invitation-tile";

export const Route = createFileRoute("/_auth/invitations/")({
  component: () => <InvitationList title="Invitations" />,
});
