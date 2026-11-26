import { Button } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { Card, CardContent } from "@invite-me/ui/components/motion/card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { PageTitle } from "@/components/host-shell";
import { toast } from "@/components/toaster";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { session } = Route.useRouteContext();
  const user = session.data?.user;
  const anonymous = Boolean(user?.isAnonymous);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function signOut() {
    await authClient.signOut();
    await navigate({ to: "/login" });
  }

  async function addPasskey() {
    setBusy(true);
    const { error } = await authClient.passkey.addPasskey();
    setBusy(false);
    if (error) {
      toast.error("Could not add passkey", { description: error.message });
      return;
    }
    toast.success("Passkey added");
  }

  return (
    <div className="max-w-xl">
      <PageTitle
        title="Profile"
        sub={
          anonymous
            ? "You're using Invite Me without an account. Log in to keep your invitations on any device."
            : "Your account details."
        }
      />
      <Card>
        <CardContent className="grid gap-5">
          <dl className="grid gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="text-lg">{user?.name || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="text-lg">{anonymous ? "No email (guest session)" : user?.email}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-3">
            {anonymous ? (
              <Button onClick={() => navigate({ to: "/login" })}>Log in</Button>
            ) : (
              <>
                <StatefulButton
                  variant="outline"
                  state={busy ? "loading" : "idle"}
                  loadingText="Waiting for passkey"
                  onClick={addPasskey}
                >
                  Add passkey
                </StatefulButton>
                <Button variant="ghost" onClick={signOut}>
                  Sign out
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
