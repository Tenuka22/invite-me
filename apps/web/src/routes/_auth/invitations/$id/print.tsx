import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";

import { PrintDialog } from "@/components/print-dialog";
import { BackLink } from "@/components/ui";

export const Route = createFileRoute("/_auth/invitations/$id/print")({
  validateSearch: z.object({ guest: z.string().optional() }),
  component: PrintPage,
});

function PrintPage() {
  const { id } = Route.useParams();
  const { guest } = Route.useSearch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  return (
    <div>
      <BackLink to="/invitations/$id" params={{ id }} label="Back to invitation" />
      <PrintDialog
        invitationId={id}
        guestId={guest}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) void navigate({ to: "/invitations/$id", params: { id } });
        }}
      />
    </div>
  );
}
