import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { toast } from "@/components/toaster";
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
      onSuccess: (invitation) => navigate({ to: "/invitations/$id", params: { id: invitation.id } }),
      onError: (error) => toast.error("Could not create invitation", { description: error.message }),
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
    <main className="mx-auto grid w-full max-w-xl gap-6 p-4">
      <h1 className="text-lg font-semibold">New invitation</h1>
      <fieldset className="grid gap-2 text-sm">
        <legend className="mb-1 font-medium">Template</legend>
        {templates.data?.map((template) => (
          <label key={template.id} className="flex items-center gap-3 rounded-md border p-3">
            <input
              type="radio"
              name="template"
              value={template.id}
              checked={selected === template.id}
              onChange={() => setPicked(template.id)}
            />
            {template.name}
          </label>
        ))}
      </fieldset>
      <div className="flex items-center gap-4">
        <StatefulButton onClick={onCreate}>Create invitation</StatefulButton>
        <Link to="/invitations" className="text-sm underline">
          Cancel
        </Link>
      </div>
    </main>
  );
}
