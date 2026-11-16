import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/profile")({
  component: ProfileComponent,
});

function ProfileComponent() {
  const { session } = Route.useRouteContext();
  const user = session.data?.user;

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
      </section>
    </div>
  );
}
