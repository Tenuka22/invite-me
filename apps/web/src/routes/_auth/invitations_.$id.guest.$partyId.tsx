import { Button } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { Input } from "@invite-me/ui/components/motion/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@invite-me/ui/components/motion/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { GuestShare } from "@/components/guest-share";
import { Skeleton } from "@/components/skeleton";
import { toast } from "@/components/toaster";
import { TEXTAREA } from "@/lib/form-styles";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations_/$id/guest/$partyId")({
  component: GuestPage,
});

function GuestPage() {
  const { partyId } = Route.useParams();
  const party = useQuery(orpc.parties.get.queryOptions({ input: { id: partyId } }));

  if (party.isPending) {
    return (
      <div role="status" className="grid gap-4">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
        <span className="sr-only">Loading guest…</span>
      </div>
    );
  }
  if (party.isError) {
    return (
      <div className="grid justify-items-start gap-3 rounded-2xl border border-border bg-card p-6">
        <p className="font-medium">We couldn't find this guest.</p>
        <p className="text-sm text-muted-foreground">They may have been deleted.</p>
        <Button variant="outline" onClick={() => void party.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // Remount on a saved change so the form shows what the server holds.
  return <GuestDetail key={`${party.data.displayName}|${party.data.seatLabel}|${party.data.rules}`} party={party.data} />;
}

/** The fields of a guest this page shows. */
interface Detail {
  id: string;
  displayName: string;
  seatLabel: string | null;
  rules: string | null;
  guestPath: string;
  revoked: boolean;
  seats: number;
  rsvp: string;
  opens: number;
}

function GuestDetail({ party }: { party: Detail }) {
  const { id: eventId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState(party.displayName);
  const [seatLabel, setSeatLabel] = useState(party.seatLabel ?? "");
  const [rules, setRules] = useState(party.rules ?? "");
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: orpc.parties.list.key() });
    await queryClient.invalidateQueries({ queryKey: orpc.parties.get.key() });
    await queryClient.invalidateQueries({ queryKey: orpc.meter.get.key() });
  };

  const save = useMutation(
    orpc.parties.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Saved");
        setEditing(false);
        await refresh();
      },
      onError: (error) => toast.error("Could not save", { description: error.message }),
    }),
  );
  const revoke = useMutation(
    orpc.parties.revoke.mutationOptions({
      onSuccess: async () => {
        toast.success("Link turned off");
        await refresh();
      },
      onError: (error) => toast.error("Could not turn the link off", { description: error.message }),
    }),
  );
  const remove = useMutation(
    orpc.parties.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Guest deleted");
        await navigate({ to: "/invitations/$id", params: { id: eventId } });
        queryClient.removeQueries({ queryKey: orpc.parties.get.key() });
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.key() });
        await queryClient.invalidateQueries({ queryKey: orpc.meter.get.key() });
      },
      onError: (error) => toast.error("Could not delete", { description: error.message }),
    }),
  );

  const changed =
    name.trim() !== party.displayName ||
    seatLabel.trim() !== (party.seatLabel ?? "") ||
    rules.trim() !== (party.rules ?? "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate({
      id: party.id,
      displayName: name.trim(),
      seatLabel: seatLabel.trim() || null,
      rules: rules.trim() || null,
    });
  }

  return (
    <div className="grid gap-6">
      {party.revoked ? (
        <p className="rounded-2xl border border-destructive/40 bg-card p-4 text-sm text-destructive">
          This link is turned off. Anyone opening it sees that the invitation is closed.
        </p>
      ) : null}

      <GuestShare
        party={party}
        note={`${party.seats} ${party.seats === 1 ? "seat" : "seats"} · ${party.rsvp} · opened ${party.opens}×`}
      />

      <section className="grid divide-y divide-border rounded-2xl border border-border bg-card">
        <GuestAction
          title="Edit details"
          text={[party.seatLabel, party.rules].filter(Boolean).join(" · ") || "Name, seat label, notes"}
          action="Edit"
          onClick={() => setEditing(true)}
        />
        {party.revoked ? null : (
          <GuestAction
            title="Turn link off"
            text="The guest stays on your list and the count keeps their reply."
            action="Turn off"
            onClick={() => revoke.mutate({ id: party.id })}
          />
        )}
        <GuestAction
          title="Delete guest"
          text="Remove them for good."
          action="Delete"
          danger
          onClick={() => setConfirming(true)}
        />
      </section>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <form onSubmit={onSubmit} className="grid gap-5">
            <DialogTitle className="font-display text-2xl tracking-[-0.02em]">Edit details</DialogTitle>
            <Input label="Name" required maxLength={80} value={name} onChange={setName} />
            <Input
              label="Seat label (optional)"
              placeholder="e.g. Table 4"
              maxLength={60}
              value={seatLabel}
              onChange={setSeatLabel}
            />
            <label className="grid gap-1.5 text-[0.8125rem] font-medium">
              Notes for this party (optional)
              <textarea
                maxLength={400}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                className={TEXTAREA}
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-border pt-5">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <StatefulButton
                type="submit"
                disabled={!changed || !name.trim()}
                state={save.isPending ? "loading" : "idle"}
                loadingText="Saving…"
              >
                Save changes
              </StatefulButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <div className="grid gap-5">
            <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
              Delete {party.displayName}?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Their link stops working and their reply is lost. This can't be undone.
            </DialogDescription>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Keep guest
              </Button>
              <Button
                className="bg-destructive text-white hover:bg-destructive/90"
                disabled={remove.isPending}
                onClick={() => remove.mutate({ id: party.id })}
              >
                {remove.isPending ? "Deleting…" : "Delete guest"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GuestAction({
  title,
  text,
  action,
  danger,
  onClick,
}: {
  title: string;
  text: string;
  action: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="truncate text-sm text-muted-foreground">{text}</p>
      </div>
      <Button
        variant="outline"
        className={danger ? "shrink-0 border-destructive/50 text-destructive" : "shrink-0"}
        onClick={onClick}
      >
        {action}
      </Button>
    </div>
  );
}
