import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { HostShell } from "@/components/host-shell";
import { PageSkeleton } from "@/components/skeletons";
import { getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: AuthLayout,
  pendingComponent: () => (
    <HostShell>
      <PageSkeleton />
    </HostShell>
  ),
  beforeLoad: async () => {
    const session = await getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }
    return { session };
  },
});

function AuthLayout() {
  return (
    <HostShell>
      <Outlet />
    </HostShell>
  );
}
