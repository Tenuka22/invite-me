import type { PresetId } from "@invite-me/api/invites/card";
import { cn } from "@invite-me/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";

import { InvitationCard } from "@/components/invitation-card";
import { toast } from "@/components/toaster";
import { Button, Dialog, DialogContent } from "@/components/ui";
import { PRESETS } from "@/presets";
import { SAMPLE_PARTY, sampleCard } from "@/presets/sample";
import { orpc } from "@/utils/orpc";

/** The designs are bundled with the app, so listing them needs no request. */
const IDS = Object.keys(PRESETS) as PresetId[];

/** Large previews of every design, drawn with sample content. Pick one. */
export function TemplatePicker({ value, onChange, className }: { value: PresetId | null; onChange: (id: PresetId) => void; className?: string }) {
  const cards = useMemo(() => IDS.map((id) => ({ id, card: sampleCard(id) })), []);
  return (
    <ul role="radiogroup" aria-label="Design" className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {cards.map(({ id, card }) => {
        const chosen = value === id;
        return (
          <li key={id}>
            <button
              type="button"
              role="radio"
              aria-checked={chosen}
              onClick={() => onChange(id)}
              className={cn(
                "group relative grid w-full gap-2 rounded-2xl border-2 bg-surface-raised p-2 text-left transition-colors duration-(--duration-fast)",
                chosen ? "border-primary bg-primary-soft" : "border-transparent hover:border-border-strong",
              )}
            >
              <InvitationCard card={card} party={SAMPLE_PARTY} className="rounded-xl" label={`${PRESETS[id].name} preview`} />
              <span className="flex min-h-11 items-center justify-between gap-2 px-1">
                <span className="grid">
                  <span className="font-semibold">{PRESETS[id].name}</span>
                  <span className="text-label text-text-muted">{PRESETS[id].blurb}</span>
                </span>
                {chosen ? <Check className="size-5 shrink-0 text-primary" aria-hidden /> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Starts an invitation: pick a design, then edit its words. Signed-out visitors can browse and
 * preview every design; creating one asks them to sign in.
 */
export function NewInvitationDialog({ open, onOpenChange, signedIn }: { open: boolean; onOpenChange: (open: boolean) => void; signedIn: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<PresetId | null>(IDS[0] ?? null);
  const create = useMutation(
    orpc.invitations.create.mutationOptions({
      onSuccess: async (inv) => {
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        onOpenChange(false);
        toast.success("Invitation created");
        await navigate({ to: "/invitations/$id/edit", params: { id: inv.id } });
      },
      onError: (error) => toast.error("Could not create the invitation", { description: error.message }),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="xl"
        title="New invitation"
        description="Pick a design. You can change every word on it afterwards."
        footer={
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={create.isPending}
              disabled={!picked}
              onClick={() => (signedIn ? picked && create.mutate({ preset: picked }) : void navigate({ to: "/login" }))}
            >
              {signedIn ? "Use this design" : "Sign in to use this design"}
            </Button>
          </>
        }
      >
        <TemplatePicker value={picked} onChange={setPicked} />
      </DialogContent>
    </Dialog>
  );
}
