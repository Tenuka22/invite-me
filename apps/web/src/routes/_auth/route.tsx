import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { HostShell } from "@/components/host-shell";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
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
