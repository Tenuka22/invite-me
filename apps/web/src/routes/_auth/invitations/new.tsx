import { DEFAULT_CARD } from "@invite-me/api/invites/card";
import { Check } from "lucide-react";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Skeleton } from "@/components/skeleton";
import { toast } from "@/components/toaster";
import { CardThumb } from "@/components/card-thumb";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/new")({
  component: NewInvitationPage,
});

function NewInvitationPage() {
  const navigate = useNavigate();
  const templates = useQuery(orpc.invitations.templates.queryOptions());
  const [picked, setPicked] = useState("");
  const selected = picked || (templates.data?.[0]?.id ?? "");

  const create = useMutation(
    orpc.invitations.create.mutationOptions({
      onSuccess: (invitation) =>
        navigate({ to: "/invitations/$id", params: { id: invitation.id } }),
      onError: (error) =>
        toast.error("Could not create invitation", { description: error.message }),
    }),
  );

  function onCreate() {
    const template = templates.data?.find((t) => t.id === selected);
    if (!template) {
      toast.error("Choose a template");
      return;
    }
    create.mutate({ template: template.id });
  }

  return (
    <div>
      <fieldset className="grid gap-4">
        <legend className="sr-only">Template</legend>
        {templates.isPending ? (
          <div role="status" className="grid gap-4">
            {[0, 1].map((row) => (
              <Skeleton key={row} className="h-48 rounded-xl" />
            ))}
            <span className="sr-only">Loading templates…</span>
          </div>
        ) : (
          templates.data?.map((template) => (
            <label
              key={template.id}
              className="group flex cursor-pointer items-center gap-5 rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ring"
            >
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selected === template.id}
                onChange={() => setPicked(template.id)}
                className="sr-only"
              />
              <div className="pointer-events-none w-36 shrink-0 overflow-hidden rounded-lg shadow-lg ring-2 ring-transparent transition-shadow group-has-[:checked]:ring-primary sm:w-40" aria-hidden="true">
                <CardThumb card={DEFAULT_CARD} />
              </div>
              <span className="grid gap-1">
                <span className="font-display text-xl tracking-[-0.01em]">{template.name}</span>
                <span className="text-sm text-muted-foreground">
                  Ivory paper with a gold mandala frame.
                </span>
              </span>
              <span className="ml-auto grid size-6 shrink-0 place-items-center self-start rounded-full border border-border bg-background">
                {selected === template.id ? (
                  <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                ) : null}
              </span>
            </label>
          ))
        )}
      </fieldset>

      <StatefulButton
        className="mt-8 w-full sm:w-auto"
        onClick={onCreate}
        disabled={!selected}
        state={create.isPending ? "loading" : "idle"}
        loadingText="Creating…"
      >
        Create invitation
      </StatefulButton>
    </div>
  );
}
