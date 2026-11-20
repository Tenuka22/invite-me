import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";

import { HostShell } from "@/components/host-header";
import { HostPageSkeleton } from "@/components/page-skeletons";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: HostLayout,
  // A hard load checks the session first; show the real top bar and a page skeleton instead of a blank screen.
  pendingComponent: HostLayoutPending,
  // Show the skeleton the moment navigation starts, and keep it up at least 250ms so it doesn't flicker.
  pendingMs: 0,
  pendingMinMs: 250,
  beforeLoad: async ({ location }) => {
    const { data, error } = await authClient.getSession();
    // A failed request (server restarting, network blip) is not a sign-out: only a confirmed empty session redirects.
    if (!data?.session && !error) {
      throw redirect({ to: "/login", search: { next: location.pathname } });
    }
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
