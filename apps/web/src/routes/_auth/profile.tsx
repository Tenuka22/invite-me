import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { sessionGate } from "@/lib/session-gate";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const email = session?.user.email ?? "";
  const name = session?.user.name || email.split("@")[0] || "";
  const role = (session?.user as { role?: string } | undefined)?.role ?? "host";
  const [planner, setPlanner] = useState(role === "planner");

  const setRole = useMutation(
    orpc.profile.setRole.mutationOptions({
      onSuccess: () => window.location.reload(),
    }),
  );

  async function signOut() {
    await authClient.signOut();
    sessionGate.clear();
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

      <PlannerToggle
        planner={planner}
        setRole={setRole}
        onToggle={(next) => {
          setPlanner(next);
          setRole.mutate({ role: next ? "planner" : "host" });
        }}
      />

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

function PlannerToggle({
  planner,
  setRole,
  onToggle,
}: {
  planner: boolean;
  setRole: ReturnType<typeof useMutation<{ role: "host" | "planner" }>>;
  onToggle: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4">
      <input
        type="checkbox"
        checked={planner}
        onChange={(e) => onToggle(e.target.checked)}
        disabled={setRole.isPending}
        className="size-5 accent-primary"
      />
      <span className="flex flex-col">
        <span className="font-medium">Event planner</span>
        <span className="text-xs text-muted-foreground">
          You create invitations for your clients
        </span>
      </span>
    </label>
  );
}
