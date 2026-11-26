import { Button } from "@invite-me/ui/components/motion/button/base";
import { Card, CardContent } from "@invite-me/ui/components/motion/card";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { PageTitle } from "@/components/host-shell";
import { authClient, clearSession } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { session } = Route.useRouteContext();
  const user = session.data?.user;
  const navigate = useNavigate();

  async function signOut() {
    await authClient.signOut();
    clearSession();
    await navigate({ to: "/login" });
  }

  return (
    <div className="max-w-xl">
      <PageTitle title="Profile" sub="Your account details." />
      <Card>
        <CardContent className="grid gap-5">
          <dl className="grid gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="text-lg">{user?.name || "Not set"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="text-lg">{user?.email}</dd>
            </div>
          </dl>
          <Button size="lg" variant="outline" className="btn-xl btn-xl-outline w-fit" onClick={signOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
