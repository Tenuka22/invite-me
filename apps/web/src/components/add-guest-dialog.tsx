import { AGE_GROUPS, type AgeGroup, MAX_GROUP_SEATS } from "@invite-me/api/invites/party";
import type { PartyView } from "@invite-me/api/invites/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Share2, UserPlus } from "lucide-react";
import { type FormEvent, useState } from "react";

import { AGE_LABELS, AgeFigure } from "@/components/age-figure";
import { canNativeShare, guestLink, useGuestShare, whatsappUrl } from "@/components/guest-share";
import { toast } from "@/components/toaster";
import {
  Button,
  Collapsible,
  Dialog,
  DialogClose,
  DialogContent,
  Field,
  Input,
  NumberField,
  RadioGroup,
  SegmentedControl,
  buttonStyles,
} from "@/components/ui";
import { orpc } from "@/utils/orpc";

type InvitedAs = "single" | "couple" | "group";

const SEAT_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "couple", label: "Couple" },
  { value: "group", label: "Group" },
] as const;

type FieldErrors = Partial<Record<"name" | "group" | "label" | "note", string>>;

/** Server messages name the field they are about; show them next to it. */
function fieldErrors(message: string): FieldErrors {
  if (/group/i.test(message)) return { group: message };
  if (/label/i.test(message)) return { label: message };
  if (/rules|note/i.test(message)) return { note: message };
  if (/name/i.test(message)) return { name: message };
  return {};
}

/** Add a guest: a dialog (a sheet on phones). Closing unmounts the form, so it always opens empty. */
export function AddGuestDialog({ eventId, open, onOpenChange }: { eventId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AddGuestContent eventId={eventId} />
    </Dialog>
  );
}

function AddGuestContent({ eventId }: { eventId: string }) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [invitedAs, setInvitedAs] = useState<InvitedAs>("single");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [groupSize, setGroupSize] = useState(3);
  const [seatLabel, setSeatLabel] = useState("");
  const [rules, setRules] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [created, setCreated] = useState<PartyView | null>(null);

  const create = useMutation(
    orpc.parties.create.mutationOptions({
      onSuccess: async (party) => {
        toast.success("Guest added");
        setCreated(party);
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey({ input: { eventId } }) });
      },
      onError: (error) => {
        setErrors(fieldErrors(error.message));
        toast.error("Could not add guest", { description: error.message });
      },
    }),
  );

  function reset() {
    setDisplayName("");
    setInvitedAs("single");
    setAgeGroup("adult");
    setGroupSize(3);
    setSeatLabel("");
    setRules("");
    setErrors({});
    setCreated(null);
    create.reset();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrors({ name: "Enter the guest's name." });
      return;
    }
    setErrors({});
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

  if (created) return <Added eventId={eventId} party={created} onAddAnother={reset} />;

  return (
    <DialogContent
      size="lg"
      title="Add guest"
      description="Each guest gets their own private link."
      footer={
        <>
          <DialogClose render={<Button variant="secondary" />}>Cancel</DialogClose>
          <Button type="submit" form="add-guest-form" loading={create.isPending}>
            Add guest
          </Button>
        </>
      }
    >
      <form id="add-guest-form" onSubmit={onSubmit} noValidate className="grid gap-5">
        <Field label="Name" error={errors.name}>
          <Input
            placeholder="e.g. Nimal Perera"
            autoComplete="off"
            maxLength={80}
            autoFocus
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
          />
        </Field>

        <div className="grid gap-2">
          <p className="text-label font-medium" id="seats-label">
            Seats
          </p>
          <SegmentedControl aria-label="Seats" value={invitedAs} onValueChange={(v) => setInvitedAs(v as InvitedAs)} options={SEAT_OPTIONS} />
          <p className="text-label text-text-muted">
            {invitedAs === "single" ? "1 seat" : invitedAs === "couple" ? "2 seats" : "Choose how many seats"}
          </p>
          {invitedAs === "group" ? (
            <div className="grid gap-1">
              <NumberField label="Group size" value={groupSize} onValueChange={setGroupSize} min={1} max={MAX_GROUP_SEATS} />
              {errors.group ? <p className="text-label font-medium text-danger">{errors.group}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-2">
          <p className="text-label font-medium" id="who-label">
            Who are they?
          </p>
          <RadioGroup
            aria-labelledby="who-label"
            value={ageGroup}
            onValueChange={(v) => setAgeGroup(v as AgeGroup)}
            columns={3}
            options={AGE_GROUPS.map((group) => ({
              value: group,
              label: AGE_LABELS[group],
              description: group === "elder" ? "Gets larger text" : undefined,
              leading: <AgeFigure group={group} name={displayName} className="size-10 shrink-0" />,
            }))}
          />
        </div>

        <Collapsible label="More options">
          <Field label="Seat label" optional error={errors.label}>
            <Input placeholder="e.g. Table 4" maxLength={60} value={seatLabel} onChange={(e) => setSeatLabel(e.target.value)} />
          </Field>
          <Field label="Note for this guest" optional description="Shown on their invitation." error={errors.note}>
            <Input placeholder="e.g. No whites" maxLength={400} value={rules} onChange={(e) => setRules(e.target.value)} />
          </Field>
        </Collapsible>
      </form>
    </DialogContent>
  );
}

function Added({ eventId, party, onAddAnother }: { eventId: string; party: PartyView; onAddAnother: () => void }) {
  const { copy, share } = useGuestShare(eventId);
  const link = guestLink(party);
  return (
    <DialogContent
      title="Guest added"
      footer={
        <>
          <DialogClose render={<Button variant="secondary" />}>Done</DialogClose>
          <Button icon={<UserPlus className="size-5" aria-hidden />} onClick={onAddAnother}>
            Add another
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="flex items-center gap-2 font-medium text-success">
          <Check className="size-5 shrink-0" aria-hidden />
          <span className="min-w-0">{party.displayName} now has a private link.</span>
        </p>
        <p className="break-all rounded-xl bg-muted px-4 py-3 text-label text-text-muted">{link}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Copy className="size-5" aria-hidden />} onClick={() => copy(party)}>
            Copy link
          </Button>
          {canNativeShare() ? (
            <Button variant="secondary" icon={<Share2 className="size-5" aria-hidden />} onClick={() => share(party)}>
              Share
            </Button>
          ) : (
            <a href={whatsappUrl(party, link)} target="_blank" rel="noopener" className={buttonStyles({ variant: "secondary" })}>
              <Share2 className="size-5" aria-hidden /> Share on WhatsApp
            </a>
          )}
        </div>
      </div>
    </DialogContent>
  );
}
