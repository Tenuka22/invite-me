import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { HostMeter } from "@/components/host-meter";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/")({
  component: InvitationsPage,
});

function InvitationsPage() {
  const invitations = useQuery(orpc.invitations.list.queryOptions());
  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 p-4">
      <HostMeter />
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Invitations</h1>
        <Link to="/invitations/new" className="rounded-md border px-3 py-2 text-sm hover:bg-muted">
          New invitation
        </Link>
      </div>
      {invitations.data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No invitations yet. Create one to design its card.</p>
      ) : null}
      <ul className="grid gap-2">
        {invitations.data?.map((invitation) => (
          <li key={invitation.id}>
            <Link
              to="/invitations/$id"
              params={{ id: invitation.id }}
              className="grid gap-1 rounded-lg border p-4 hover:bg-muted"
            >
              <span className="font-medium">
                {[invitation.card.name1, invitation.card.name2].filter(Boolean).join(" & ") || "Untitled"}
              </span>
              <span className="text-xs text-muted-foreground">
                {invitation.card.date || "No date yet"} · {invitation.template}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
