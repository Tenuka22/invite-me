import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { HostMeter, POLL_MS } from "@/components/host-meter";
import { toast } from "@/components/toaster";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/parties")({
  component: PartiesPage,
});

function PartiesPage() {
  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 p-4">
      <HostMeter />
      <CreateParty />
      <PartyList />
    </main>
  );
}

function CreateParty() {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [invitedAs, setInvitedAs] = useState<"single" | "couple" | "group">("single");
  const [groupSize, setGroupSize] = useState(2);
  const [seatLabel, setSeatLabel] = useState("");
  const [rules, setRules] = useState("");
  const invitations = useQuery(orpc.invitations.list.queryOptions());
  const [eventId, setEventId] = useState("");
  const selectedEventId = eventId || (invitations.data?.[0]?.id ?? "");

  const create = useMutation(
    orpc.parties.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Guest added");
        setDisplayName("");
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey() });
        await queryClient.invalidateQueries({ queryKey: orpc.meter.get.queryKey() });
      },
      onError: (error) => toast.error("Could not add guest", { description: error.message }),
    }),
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error("Create an invitation first");
      return;
    }
    create.mutate({
      displayName: displayName.trim(),
      eventId: selectedEventId,
      invitedAs,
      groupSize: invitedAs === "group" ? groupSize : undefined,
      seatLabel: seatLabel.trim() || null,
      rules: rules.trim() || null,
      locale: "en",
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border p-4">
      <h2 className="font-medium">Add guest</h2>
      <label className="grid gap-1 text-sm">
        Invitation
        <select
          required
          value={selectedEventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-md border bg-background px-3 py-2"
        >
          {invitations.data?.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {[inv.card.name1, inv.card.name2].filter(Boolean).join(" & ") || "Untitled"}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        Name
        <input
          required
          maxLength={80}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Invited as
        <select
          value={invitedAs}
          onChange={(e) => setInvitedAs(e.target.value as typeof invitedAs)}
          className="rounded-md border bg-background px-3 py-2"
        >
          <option value="single">Single</option>
          <option value="couple">Couple</option>
          <option value="group">Group</option>
        </select>
      </label>
      {invitedAs === "group" ? (
        <label className="grid gap-1 text-sm">
          Group size
          <input
            type="number"
            min={1}
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
            className="rounded-md border bg-background px-3 py-2"
          />
        </label>
      ) : null}
      <label className="grid gap-1 text-sm">
        Seat label (optional)
        <input
          maxLength={60}
          value={seatLabel}
          onChange={(e) => setSeatLabel(e.target.value)}
          className="rounded-md border bg-background px-3 py-2"
        />
      </label>
      <label className="grid gap-1 text-sm">
        Notes for this party (optional)
        <textarea
          maxLength={400}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className="rounded-md border bg-background px-3 py-2"
        />
      </label>
      <StatefulButton type="submit" disabled={!displayName.trim()} state={create.isPending ? "loading" : "idle"}>
        Add guest
      </StatefulButton>
    </form>
  );
}

function PartyList() {
  const queryClient = useQueryClient();
  const parties = useQuery({
    ...orpc.parties.list.queryOptions(),
    refetchInterval: POLL_MS,
  });

  const markShared = useMutation(
    orpc.parties.markShared.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey() }),
      onError: (error) => toast.error("Could not mark shared", { description: error.message }),
    }),
  );
  const revoke = useMutation(
    orpc.parties.revoke.mutationOptions({
      onSuccess: async () => {
        toast.success("Invitation revoked");
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey() });
        await queryClient.invalidateQueries({ queryKey: orpc.meter.get.queryKey() });
      },
      onError: (error) => toast.error("Could not revoke", { description: error.message }),
    }),
  );

  if (!parties.data) return <p className="text-sm text-muted-foreground">Loading guests…</p>;
  if (parties.data.length === 0) {
    return <p className="text-sm text-muted-foreground">No guests yet.</p>;
  }

  return (
    <ul className="grid gap-3">
      {parties.data.map((party) => {
        const link = `${window.location.origin}${party.guestPath}`;
        return (
          <li key={party.id} className="grid gap-2 rounded-lg border p-4 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {party.displayName}
                {party.revoked ? <span className="ml-2 text-error">revoked</span> : null}
              </p>
              <p className="text-muted-foreground">
                {party.seats} seat{party.seats === 1 ? "" : "s"} · RSVP {party.rsvp} · opened{" "}
                {party.opens}×
              </p>
            </div>
            <p className="break-all text-muted-foreground">{link}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border px-3 py-1"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  toast.success("Link copied");
                  if (!party.shared) markShared.mutate({ id: party.id });
                }}
              >
                Copy link
              </button>
              {party.revoked ? null : (
                <button
                  type="button"
                  className="rounded-md border px-3 py-1"
                  onClick={() => revoke.mutate({ id: party.id })}
                >
                  Revoke
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
