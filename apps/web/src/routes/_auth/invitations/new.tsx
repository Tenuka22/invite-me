import { PRESETS as PRESET_IDS, type PresetId } from "@invite-me/api/invites/card";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { FlowBar } from "@/components/host-shell";
import { useCreateInvitation } from "@/components/invitation-tile";
import { TemplatePicker } from "@/components/new-invitation-dialog";
import { BackLink, Button, PageHeader } from "@/components/ui";

export const Route = createFileRoute("/_auth/invitations/new")({
  validateSearch: z.object({ preset: z.enum(PRESET_IDS).optional() }),
  component: NewInvitation,
});

function NewInvitation() {
  const search = Route.useSearch();
  const [picked, setPicked] = useState<PresetId>(search.preset ?? PRESET_IDS[0]);
  const create = useCreateInvitation();
  return (
    <>
      <PageHeader
        back={<BackLink to="/invitations" label="Invitations" />}
        title="New invitation"
        description="Pick a design. You can change every word on it afterwards."
      />
      <TemplatePicker value={picked} onChange={setPicked} />
      <FlowBar>
        <Button size="lg" loading={create.isPending} onClick={() => create.mutate({ preset: picked })}>
          Use this design
        </Button>
      </FlowBar>
    </>
  );
}
