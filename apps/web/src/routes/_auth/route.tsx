import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";

import { HostShell } from "@/components/host-header";
import { HostPageSkeleton } from "@/components/page-skeletons";
import { authClient } from "@/lib/auth-client";
import { sessionGate } from "@/lib/session-gate";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: HostLayout,
  // A hard load checks the session first; show the real top bar and a page skeleton instead of a blank screen.
  pendingComponent: HostLayoutPending,
  // Only show the skeleton when a page is actually slow; a quick change shouldn't flash a placeholder.
  pendingMs: 400,
  pendingMinMs: 300,
  beforeLoad: async ({ location }) => {
    if (sessionGate.isFresh()) return;
    const { data, error } = await authClient.getSession();
    // A failed request (server restarting, network blip) is not a sign-out: only a confirmed empty session redirects.
    if (!data?.session && !error) {
      sessionGate.clear();
      throw redirect({ to: "/login", search: { next: location.pathname } });
    }
    if (data?.session) sessionGate.confirm();
  },
});

function HostLayout() {
  return (
    <HostShell>
      <Outlet />
    </HostShell>
  );
}

function HostLayoutPending() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <HostShell>
      <HostPageSkeleton pathname={pathname} />
    </HostShell>
  );
}
