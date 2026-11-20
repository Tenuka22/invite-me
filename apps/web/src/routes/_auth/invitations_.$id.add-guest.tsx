import { Input } from "@invite-me/ui/components/motion/input";
import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { GuestShare } from "@/components/guest-share";
import { toast } from "@/components/toaster";
import { TEXTAREA } from "@/lib/form-styles";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations_/$id/add-guest")({
  component: AddGuestPage,
});

type InvitedAs = "single" | "couple" | "group";

function AddGuestPage() {
  const { id: eventId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [invitedAs, setInvitedAs] = useState<InvitedAs>("single");
  const [groupSize, setGroupSize] = useState(2);
  const [seatLabel, setSeatLabel] = useState("");
  const [rules, setRules] = useState("");
  const [created, setCreated] = useState<{ id: string; displayName: string; guestPath: string }>();

  const create = useMutation(
    orpc.parties.create.mutationOptions({
      onSuccess: async (party) => {
        toast.success("Guest added");
        setCreated(party);
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.key() });
        await queryClient.invalidateQueries({ queryKey: orpc.meter.get.key() });
      },
      onError: (error) => toast.error("Could not add guest", { description: error.message }),
    }),
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate({
      displayName: displayName.trim(),
      eventId,
      invitedAs,
      groupSize: invitedAs === "group" ? groupSize : undefined,
      seatLabel: seatLabel.trim() || null,
      rules: rules.trim() || null,
      locale: "en",
    });
  }

  if (created) {
    return (
      <GuestShare
        note="Added. Send them their link or let them scan."
        party={created}
        onDone={() => navigate({ to: "/invitations/$id", params: { id: eventId } })}
        onAnother={() => {
          setCreated(undefined);
          setDisplayName("");
          setSeatLabel("");
          setRules("");
          setInvitedAs("single");
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Name" required placeholder="Who is this invite for?" maxLength={80} value={displayName} onChange={setDisplayName} />
        <Input label="Seat label (optional)" placeholder="e.g. Table 4" maxLength={60} value={seatLabel} onChange={setSeatLabel} />
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-[0.8125rem] font-medium">Invited as</legend>
        <RadioGroup
          value={invitedAs}
          onValueChange={(v) => setInvitedAs(v as InvitedAs)}
          orientation="horizontal"
        >
          <RadioGroupItem value="single" label="Single" />
          <RadioGroupItem value="couple" label="Couple" />
          <RadioGroupItem value="group" label="Group" />
        </RadioGroup>
      </fieldset>

      {invitedAs === "group" ? (
        <Input
          label="Group size"
          type="number"
          min={1}
          value={String(groupSize)}
          onChange={(v) => setGroupSize(Number(v))}
        />
      ) : null}

      <label className="grid gap-1.5 text-[0.8125rem] font-medium">
        Notes for this party (optional)
        <textarea
          maxLength={400}
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className={TEXTAREA}
        />
      </label>

      <div className="flex justify-end border-t border-border pt-5">
        <StatefulButton
          type="submit"
          className="w-full sm:w-auto"
          disabled={!displayName.trim()}
          state={create.isPending ? "loading" : "idle"}
          loadingText="Adding…"
        >
          Add guest
        </StatefulButton>
      </div>
    </form>
  );
}
