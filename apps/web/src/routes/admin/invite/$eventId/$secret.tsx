import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/invite/$eventId/$secret")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: async ({ context, params, location }) => {
    const { data } = await authClient.getSession();
    if (!data?.session) {
      throw redirect({ to: "/login", search: { next: location.pathname } });
    }
    // Signed in: take admin now, then land on the invitation.
    const claimed = await context.orpc.invitations.adminGrant.call({
      eventId: params.eventId,
      secret: params.secret,
    });
    throw redirect({ to: "/invitations/$id", params: { id: claimed.eventId } });
  },
  component: AdminInviteRedirect,
});

function AdminInviteRedirect() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <p className="text-sm text-muted-foreground">You now have admin access — redirecting…</p>
    </main>
  );
}
