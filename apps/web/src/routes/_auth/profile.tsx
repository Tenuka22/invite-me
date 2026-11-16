import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { createFileRoute } from "@tanstack/react-router";

import { toast } from "@/components/toaster";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { session } = Route.useRouteContext();
  const user = session.data?.user;

  async function addPasskey() {
    const { error } = await authClient.passkey.addPasskey();
    if (error) {
      toast.error("Could not add passkey", { description: error.message });
      return;
    }
    toast.success("Passkey added");
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <section className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Profile</h2>
        <dl className="grid gap-2">
          <div>
            <dt className="text-muted-foreground text-sm">Name</dt>
            <dd>{user?.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-sm">Email</dt>
            <dd>{user?.email}</dd>
          </div>
        </dl>
        <StatefulButton variant="outline" className="mt-4" onClick={addPasskey}>
          Add passkey
        </StatefulButton>
      </section>
    </div>
  );
}
