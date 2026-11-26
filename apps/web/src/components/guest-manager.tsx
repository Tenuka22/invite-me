import { AnimatedBadge, type AnimatedBadgeStatus } from "@invite-me/ui/components/motion/animated-badge";
import {
  AdaptiveStepper,
  AdaptiveStepperDecrement,
  AdaptiveStepperIncrement,
  AdaptiveStepperValue,
} from "@invite-me/ui/components/motion/adaptive-stepper";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@invite-me/ui/components/motion/card";
import { Input } from "@invite-me/ui/components/motion/input";
import { Skeleton } from "@/components/skeletons";
import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { AGE_GROUPS, type AgeGroup } from "@invite-me/api/invites/party";

import { AGE_LABELS, AgeFigure } from "@/components/age-figure";
import { POLL_MS } from "@/components/host-meter";
import { toast } from "@/components/toaster";
import { orpc } from "@/utils/orpc";

type InvitedAs = "single" | "couple" | "group";

const MAX_GROUP = 50;

export function AddGuestForm({ eventId, onDone }: { eventId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [invitedAs, setInvitedAs] = useState<InvitedAs>("single");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [groupSize, setGroupSize] = useState(3);
  const [seatLabel, setSeatLabel] = useState("");
  const [rules, setRules] = useState("");

  const create = useMutation(
    orpc.parties.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Guest added");
        setDisplayName("");
        setInvitedAs("single");
        setAgeGroup("adult");
        setGroupSize(3);
        setSeatLabel("");
        setRules("");
        onDone();
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey({ input: { eventId } }) });
        await queryClient.invalidateQueries({ queryKey: orpc.meter.get.queryKey({ input: { eventId } }) });
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
      ageGroup,
      groupSize: invitedAs === "group" ? groupSize : undefined,
      seatLabel: seatLabel.trim() || null,
      rules: rules.trim() || null,
      locale: "en",
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Add guest</CardTitle>
        <CardDescription>Each guest gets their own private link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <Input
            label="Name"
            placeholder="Nimal Perera"
            autoComplete="off"
            maxLength={80}
            value={displayName}
            onChange={setDisplayName}
          />
          <RadioGroup
            value={invitedAs}
            onValueChange={(v) => setInvitedAs(v as InvitedAs)}
            aria-label="Invited as"
            className="gap-2"
          >
            <RadioGroupItem value="single" label="Single" description="1 seat" />
            <RadioGroupItem value="couple" label="Couple" description="2 seats" />
            <RadioGroupItem value="group" label="Group" description="Choose how many seats" />
          </RadioGroup>
          <fieldset className="grid gap-2">
            <legend className="px-1 text-sm font-medium">Who are they?</legend>
            <p className="px-1 text-xs text-muted-foreground">
              Sets how the invitation greets them. Elders get larger text.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {AGE_GROUPS.map((group) => (
                <Button
                  key={group}
                  type="button"
                  variant={ageGroup === group ? "primary" : "outline"}
                  aria-pressed={ageGroup === group}
                  className="h-auto flex-col gap-1 rounded-2xl px-1 pb-2 pt-3 text-xs"
                  onClick={() => setAgeGroup(group)}
                >
                  <AgeFigure group={group} name={displayName} className="size-14" />
                  {AGE_LABELS[group]}
                </Button>
              ))}
            </div>
          </fieldset>
          {invitedAs === "group" ? (
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <span className="text-sm font-medium">Group size</span>
              <AdaptiveStepper
                aria-label="Group size"
                value={groupSize}
                onValueChange={setGroupSize}
                min={1}
                max={MAX_GROUP}
              >
                <AdaptiveStepperDecrement />
                <AdaptiveStepperValue />
                <AdaptiveStepperIncrement />
              </AdaptiveStepper>
            </div>
          ) : null}
          <Input
            label="Seat label (optional)"
            placeholder="Table 4"
            maxLength={60}
            value={seatLabel}
            onChange={setSeatLabel}
          />
          <Input
            label="Note for this guest (optional)"
            placeholder="No whites"
            maxLength={400}
            value={rules}
            onChange={setRules}
          />
          <StatefulButton
            type="submit"
            className="w-full"
            disabled={!displayName.trim()}
            state={create.isPending ? "loading" : "idle"}
            loadingText="Adding"
          >
            Add guest
          </StatefulButton>
        </form>
      </CardContent>
    </Card>
  );
}

const RSVP_BADGE: Record<string, { status: AnimatedBadgeStatus; label: string }> = {
  pending: { status: "neutral", label: "No reply" },
  yes: { status: "success", label: "Attending" },
  maybe: { status: "warning", label: "Maybe" },
  no: { status: "danger", label: "Declined" },
};

export function GuestList({ eventId, onAddFirst }: { eventId: string; onAddFirst: () => void }) {
  const queryClient = useQueryClient();
  const parties = useQuery({
    ...orpc.parties.list.queryOptions({ input: { eventId } }),
    refetchInterval: POLL_MS,
  });

  const markShared = useMutation(
    orpc.parties.markShared.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey({ input: { eventId } }) }),
      onError: (error) => toast.error("Could not mark shared", { description: error.message }),
    }),
  );
  const revoke = useMutation(
    orpc.parties.revoke.mutationOptions({
      onSuccess: async () => {
        toast.success("Invitation revoked");
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey({ input: { eventId } }) });
        await queryClient.invalidateQueries({ queryKey: orpc.meter.get.queryKey({ input: { eventId } }) });
      },
      onError: (error) => toast.error("Could not revoke", { description: error.message }),
    }),
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (!parties.data) {
    return (
      <div className="grid gap-3"><Skeleton className="h-28 w-full rounded-2xl" /><Skeleton className="h-28 w-full rounded-2xl" /></div>
    );
  }
  if (parties.data.length === 0) {
    return (
      <Card>
        <CardContent className="grid justify-items-center gap-3 py-6 text-center">
          <CardTitle as="h2">No guests yet</CardTitle>
          <CardDescription>Add your first guest to get a private invitation link.</CardDescription>
          <Button onClick={onAddFirst}>
            Add guest
          </Button>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...parties.data].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ul className="grid gap-3">
      {sorted.map((party) => {
        const link = `${window.location.origin}${party.guestPath}`;
        const rsvp = party.revoked
          ? { status: "danger" as const, label: "Revoked" }
          : (RSVP_BADGE[party.rsvp] ?? RSVP_BADGE.pending);
        return (
          <li key={party.id}>
            <Card size="compact">
              <CardContent className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
                      <AgeFigure group={party.ageGroup ?? "adult"} name={party.displayName} className="size-11" />
                    </span>
                    <p className="min-w-0 truncate font-medium">{party.displayName}</p>
                  </div>
                  <AnimatedBadge status={rsvp.status} size="sm" contentKey={rsvp.label}>
                    {rsvp.label}
                  </AnimatedBadge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {party.seats} seat{party.seats === 1 ? "" : "s"}
                  {party.confirmedSeats > 0 ? ` · ${party.confirmedSeats} confirmed` : ""} · opened{" "}
                  {party.opens}×
                  {party.shared ? "" : " · not shared yet"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground" title={link}>
                  {link}
                </p>
                <div className="flex flex-wrap gap-2">
                  <StatefulButton
                    size="sm"
                    variant="outline"
                    state={copiedId === party.id ? "success" : "idle"}
                    successText="Copied"
                    disabled={party.revoked}
                    onClick={async () => {
                      await navigator.clipboard.writeText(link);
                      setCopiedId(party.id);
                      setTimeout(() => setCopiedId((id) => (id === party.id ? null : id)), 1800);
                      if (!party.shared) markShared.mutate({ id: party.id });
                    }}
                  >
                    Copy link
                  </StatefulButton>
                  {party.revoked ? null : (
                    <StatefulButton
                      size="sm"
                      variant={confirmId === party.id ? "primary" : "ghost"}
                      state={revoke.isPending && revoke.variables?.id === party.id ? "loading" : "idle"}
                      loadingText="Revoking"
                      onBlur={() => setConfirmId((id) => (id === party.id ? null : id))}
                      onClick={() => {
                        if (confirmId !== party.id) {
                          setConfirmId(party.id);
                          return;
                        }
                        setConfirmId(null);
                        revoke.mutate({ id: party.id });
                      }}
                    >
                      {confirmId === party.id ? "Confirm revoke" : "Revoke"}
                    </StatefulButton>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
