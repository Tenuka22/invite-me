import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const email = session?.user.email ?? "";
  const name = session?.user.name || email.split("@")[0] || "";

  async function signOut() {
    await authClient.signOut();
    await navigate({ to: "/login" });
  }

  return (
    <div className="grid gap-4">
      <section className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <span
          aria-hidden
          className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/15 font-display text-2xl text-primary"
        >
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-xl">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </section>

      <button
        type="button"
        onClick={signOut}
        className="flex h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card px-5 text-left font-medium transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <LogOut className="size-5 text-muted-foreground" aria-hidden />
        Sign out
      </button>
    </div>
  );
}
