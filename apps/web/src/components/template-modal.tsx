import type { PresetId } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { CenterMorphModal, CenterMorphModalContent } from "@invite-me/ui/components/motion/center-morph-modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useState } from "react";

import { toast } from "@/components/toaster";
import { PRESETS } from "@/presets";
import { sampleCard } from "@/presets/sample";
import { orpc } from "@/utils/orpc";

/** The still of the design: drawn instantly with no second app boot; the full design loads only in the full-page view. */
function StillPreview({ preset }: { preset: PresetId }) {
  const { Thumb } = PRESETS[preset];
  return (
    <div className="size-full">
      <div className="w-full">
        <Thumb card={sampleCard(preset)} />
      </div>
    </div>
  );
}

/**
 * Opens when a template is picked. Offers to start an invitation from it, or to look at the
 * full design in a full-page view.
 */
export function TemplateModal({
  preset,
  signedIn,
  onClose,
}: {
  preset: PresetId | null;
  signedIn: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [full, setFull] = useState(false);
  const create = useMutation(
    orpc.invitations.create.mutationOptions({
      onSuccess: async (inv) => {
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        onClose();
        await navigate({ to: "/invitations/$id/edit", params: { id: inv.id } });
      },
      onError: (error) => toast.error("Could not create the invitation", { description: error.message }),
    }),
  );
  const design = preset ? PRESETS[preset] : null;

  return (
    <>
      <CenterMorphModal open={preset !== null && !full} onOpenChange={(open) => (open ? undefined : onClose())}>
        <CenterMorphModalContent
          ariaLabel={design ? `${design.name} template` : "Template"}
          className="host-app w-full max-w-3xl rounded-[2rem] border bg-background p-5 sm:p-8"
        >
          {design && preset ? (
            <div className="grid gap-5 md:grid-cols-[minmax(0,20rem)_1fr] md:items-center md:gap-6">
              <div className="mx-auto aspect-[3/4] w-[min(100%,calc(34svh*0.75))] overflow-hidden rounded-[1.6rem] border shadow-[0_18px_40px_-18px_rgb(60_30_10/0.5)] md:w-[min(100%,calc(64svh*0.75))]">
                <StillPreview preset={preset} />
              </div>
              <div className="grid gap-6 pr-2">
                <div className="grid gap-2">
                  <h2 className="text-3xl sm:text-4xl">{design.name}</h2>
                  <p className="text-muted-foreground">{design.blurb}</p>
                  <p className="text-sm text-muted-foreground">
                    The names, dates and venue shown are sample content. Turn your phone sideways and the card
                    rearranges for landscape.
                  </p>
                </div>
                <div className="grid gap-3">
                  <StatefulButton
                    size="lg"
                    className="btn-xl"
                    state={create.isPending ? "loading" : "idle"}
                    loadingText="Creating"
                    onClick={() => (signedIn ? create.mutate({ preset }) : void navigate({ to: "/login" }))}
                  >
                    {signedIn ? "Use this design" : "Sign in to use this design"}
                  </StatefulButton>
                  <Button size="lg" variant="outline" className="btn-xl btn-xl-outline" onClick={() => setFull(true)}>
                    <Eye className="size-5" aria-hidden /> Just looking
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CenterMorphModalContent>
      </CenterMorphModal>

      <CenterMorphModal open={preset !== null && full} onOpenChange={(open) => (open ? undefined : setFull(false))}>
        <CenterMorphModalContent
          ariaLabel={design ? `${design.name} full preview` : "Full preview"}
          className="host-app h-[calc(100svh-2rem)] w-[calc(100vw-2rem)] max-w-none overflow-hidden rounded-[1.5rem] border bg-background p-0"
        >
          {design && preset ? (
            <iframe title={`${design.name}, full design`} src={`/preview/${preset}`} className="size-full border-0" />
          ) : null}
        </CenterMorphModalContent>
      </CenterMorphModal>
    </>
  );
}
