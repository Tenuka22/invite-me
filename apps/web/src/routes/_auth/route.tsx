import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: HostLayout,
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data?.session) throw redirect({ to: "/login" });
  },
});

function HostLayout() {
  const navigate = useNavigate();
  async function logOut() {
    await authClient.signOut();
    await navigate({ to: "/login" });
  }
  return (
    <div className="min-h-svh">
      <nav className="flex items-center gap-4 border-b p-4 text-sm">
        <span className="font-semibold">InviteMe</span>
        <Link to="/invitations" className="hover:underline" activeProps={{ className: "font-semibold" }}>
          Invitations
        </Link>
        <Link to="/parties" className="hover:underline" activeProps={{ className: "font-semibold" }}>
          Guests
        </Link>
        <button type="button" onClick={logOut} className="ml-auto hover:underline">
          Log out
        </button>
      </nav>
      <Outlet />
    </div>
  );
}
