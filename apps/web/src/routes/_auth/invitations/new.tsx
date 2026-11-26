import { PRESETS as PRESET_IDS, type PresetId } from "@invite-me/api/invites/card";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { PageTitle } from "@/components/host-shell";
import { toast } from "@/components/toaster";
import { PRESETS } from "@/presets";
import { orpc } from "@/utils/orpc";
import { DEFAULT_CARD } from "@invite-me/api/invites/card";

export const Route = createFileRoute("/_auth/invitations/new")({
  validateSearch: z.object({ preset: z.enum(PRESET_IDS).optional() }),
  component: NewInvitation,
});

function NewInvitation() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<PresetId>(search.preset ?? PRESET_IDS[0]);
  const create = useMutation(
    orpc.invitations.create.mutationOptions({
      onSuccess: async (inv) => {
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        await navigate({ to: "/invitations/$id/edit", params: { id: inv.id } });
      },
      onError: (error) => toast.error("Could not create the invitation", { description: error.message }),
    }),
  );
  return (
    <div className="max-w-3xl">
      <PageTitle back={{ to: "/invitations" }} title="New invitation" sub="Pick a design. You can change every word on it afterwards." />
      <ul className="grid gap-4 sm:grid-cols-2">
        {PRESET_IDS.map((id) => {
          const { Thumb, name, blurb } = PRESETS[id];
          const on = picked === id;
          return (
            <li key={id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(id)}
                className={`relative grid w-full grid-cols-[7.5rem_1fr] items-center gap-4 rounded-3xl border bg-card p-3 text-left transition-colors ${
                  on ? "border-primary ring-2 ring-primary/30" : "hover:border-foreground/30"
                }`}
              >
                <span className="overflow-hidden rounded-2xl">
                  <Thumb card={{ ...DEFAULT_CARD, preset: id }} />
                </span>
                <span className="grid gap-1 pr-8">
                  <span className="font-[Fraunces_Variable,Fraunces,Georgia,serif] text-xl leading-tight">{name}</span>
                  <span className="text-sm text-muted-foreground">{blurb}</span>
                </span>
                {on ? (
                  <span className="absolute right-4 top-4 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-4" aria-hidden />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <StatefulButton
        size="lg"
        className="btn-xl mt-6"
        state={create.isPending ? "loading" : "idle"}
        loadingText="Creating"
        onClick={() => create.mutate({ preset: picked })}
      >
        Create invitation
      </StatefulButton>
    </div>
  );
}
