import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";

import { toast } from "@/components/toaster";
import { Button, PageHeader } from "@/components/ui";
import { authClient, clearSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { session } = Route.useRouteContext();
  const user = session.data?.user;
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      clearSession();
      await navigate({ to: "/login" });
    } catch (error) {
      setSigningOut(false);
      toast.error("Could not sign out", { description: error instanceof Error ? error.message : "Please try again." });
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Profile" description="Your account details." />
      <div className="grid gap-6 rounded-2xl border border-border bg-surface-raised p-5 shadow-raised">
        <dl className="grid gap-4">
          <div>
            <dt className="text-label text-text-muted">Name</dt>
            <dd className="break-words text-body">{user?.name || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-label text-text-muted">Email</dt>
            <dd className="break-words text-body">{user?.email}</dd>
          </div>
        </dl>
        <Button variant="secondary" size="lg" className="w-fit" loading={signingOut} icon={<LogOut className="size-5" aria-hidden />} onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
