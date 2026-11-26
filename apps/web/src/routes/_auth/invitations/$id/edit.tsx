import { DatePicker } from "@invite-me/ui/components/motion/date-picker";
import { type Card, cardSchema } from "@invite-me/api/invites/card";
import { ORPCError } from "@orpc/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Check, CloudOff, Eye, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { MapsLinkField, TextField } from "@/components/card-fields";
import { CustomizeList } from "@/components/customize-dialogs";
import { FlowBar } from "@/components/host-shell";
import { InvitationCard } from "@/components/invitation-card";
import { NotFound } from "@/components/not-found";
import { toast } from "@/components/toaster";
import { BackLink, Button, Dialog, DialogContent, DialogTrigger, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { client, orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/edit")({
  component: CardEditor,
});

const AUTOSAVE_MS = 800;

function CardEditor() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  if (invitation.isError) {
    if (invitation.error instanceof ORPCError && invitation.error.code === "NOT_FOUND") {
      return <NotFound inline title="We can't find that invitation" description="It may have been deleted, or the link is wrong." />;
    }
    return (
      <EmptyState
        icon={CloudOff}
        title="Could not open this card"
        description={invitation.error.message}
        action={<Button variant="primary" loading={invitation.isFetching} onClick={() => invitation.refetch()}>Retry</Button>}
      />
    );
  }
  if (!invitation.data) return <EditorSkeleton />;
  return <Editor key={invitation.data.id} id={id} initial={invitation.data.card} />;
}

function EditorSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading card" className="grid gap-6">
      <Skeleton className="h-11 w-24" />
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid max-w-xl gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="hidden aspect-[9/16] w-full max-w-[22rem] rounded-2xl lg:block" />
      </div>
    </div>
  );
}

type Status = "saved" | "saving" | "invalid" | "failed";

function Editor({ id, initial }: { id: string; initial: Card }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Card>(initial);
  const [savedKey, setSavedKey] = useState(() => JSON.stringify(cardSchema.safeParse(initial).data ?? initial));
  const [failedKey, setFailedKey] = useState<string | null>(null);

  const save = useMutation(orpc.invitations.save.mutationOptions());

  const parsed = useMemo(() => cardSchema.safeParse(draft), [draft]);
  const errors = useMemo(() => {
    const out: Partial<Record<string, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        out[key] ??= friendly(key, issue.message);
      }
    }
    return out;
  }, [parsed]);
  const key = parsed.success ? JSON.stringify(parsed.data) : null;

  function patch(changes: Partial<Card>) {
    setDraft((prev) => ({ ...prev, ...changes }));
  }
  function set<K extends keyof Card>(k: K, value: Card[K]) {
    patch({ [k]: value } as Partial<Card>);
  }

  // Autosave: wait for a pause in typing, then save the valid draft. Invalid drafts are never sent.
  useEffect(() => {
    if (!parsed.success || key === null || key === savedKey || key === failedKey || save.isPending) return;
    const timer = setTimeout(() => {
      save.mutate(
        { id, card: parsed.data },
        {
          onSuccess: () => {
            setSavedKey(key);
            setFailedKey(null);
            void queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
          },
          onError: (error) => {
            setFailedKey(key);
            toast.error("Could not save card", { description: error.message });
          },
        },
      );
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [parsed, key, savedKey, failedKey, save.isPending, id, save, queryClient]);

  // Leaving within the pause must not lose the last edits.
  const latest = useRef({ key, savedKey, card: parsed.success ? parsed.data : null });
  latest.current = { key, savedKey, card: parsed.success ? parsed.data : null };
  useEffect(
    () => () => {
      const { key: k, savedKey: s, card } = latest.current;
      if (card && k !== s) {
        void client.invitations.save({ id, card }).then(() => queryClient.invalidateQueries({ queryKey: orpc.invitations.key() }));
      }
    },
    [id, queryClient],
  );

  const status: Status = !parsed.success ? "invalid" : save.isPending ? "saving" : key === failedKey ? "failed" : key === savedKey ? "saved" : "saving";

  async function onDone() {
    if (!parsed.success) {
      toast.error("Check the highlighted fields", { description: "The card can't be saved until they are fixed." });
      return;
    }
    if (key !== savedKey) {
      try {
        await save.mutateAsync({ id, card: parsed.data });
        setSavedKey(key!);
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
      } catch (error) {
        setFailedKey(key);
        toast.error("Could not save card", { description: error instanceof Error ? error.message : undefined });
        return;
      }
    }
    toast.success("Card saved");
    await navigate({ to: "/invitations/$id", params: { id } });
  }

  return (
    <div>
      <PageHeader title="Edit card" back={<BackLink to="/invitations/$id" params={{ id }} label="Back" />} />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-12">
        <div className="grid min-w-0 gap-8">
          <section aria-label="Essentials" className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="First name" placeholder="e.g. Binuri" value={draft.name1} max={40} error={errors.name1} onChange={(v) => set("name1", v)} />
              <TextField label="Second name" placeholder="e.g. Sameera" value={draft.name2} max={40} error={errors.name2} onChange={(v) => set("name2", v)} />
            </div>

            <div className="grid gap-4">
              <DatePicker label="Date" className="sm:max-w-72" error={errors.date} value={draft.date} onChange={(v) => set("date", v)} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Starts" placeholder="e.g. 9.30 AM" value={draft.timeFrom} max={20} onChange={(v) => set("timeFrom", v)} />
                <TextField label="Ends" optional placeholder="e.g. 2.30 PM" value={draft.timeTo} max={20} onChange={(v) => set("timeTo", v)} />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Venue" placeholder="e.g. The Kingsbury" value={draft.venueName} max={80} onChange={(v) => set("venueName", v)} />
                <TextField label="City" placeholder="e.g. Colombo" value={draft.city} max={60} onChange={(v) => set("city", v)} />
              </div>
              <MapsLinkField url={draft.mapsUrl} geo={draft.venueGeo} onChange={(mapsUrl, venueGeo) => patch({ mapsUrl, venueGeo })} />
            </div>
          </section>

          <section aria-labelledby="customize-title" className="grid gap-3">
            <h2 id="customize-title" className="text-section">
              Customize
            </h2>
            <CustomizeList draft={draft} set={set} patch={patch} />
          </section>
        </div>

        <aside aria-label="Live preview" className="hidden lg:sticky lg:top-[calc(var(--header-h,4rem)+1.5rem)] lg:block">
          {/* Fits the space above the action bar, so the whole card is always in view and never cut. */}
          <div className="mx-auto w-full" style={{ maxWidth: "min(100%, calc((100dvh - 12rem) * 0.5625))" }}>
            <InvitationCard card={draft} mode="print" className="rounded-2xl border border-border shadow-raised" />
          </div>
        </aside>
      </div>

      <FlowBar>
        <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3">
          <SaveIndicator status={status} onRetry={() => setFailedKey(null)} />
          <div className="ml-auto flex items-center gap-2">
            <Dialog>
              <DialogTrigger render={<Button variant="secondary" icon={<Eye className="size-5" aria-hidden />} className="lg:hidden" />}>Preview</DialogTrigger>
              <DialogContent
                title="Preview"
                hideTitle
                size="sm"
                className="max-md:h-dvh max-md:max-h-none max-md:rounded-none"
              >
                <div className="grid place-items-center">
                  <div className="w-[min(100%,calc((100dvh-9rem)*9/16))]">
                    <InvitationCard card={draft} mode="print" className="rounded-2xl border border-border shadow-raised" />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="primary" loading={save.isPending} onClick={onDone}>
              Done
            </Button>
          </div>
        </div>
      </FlowBar>
    </div>
  );
}

function friendly(key: string, message: string) {
  if (key === "name1" || key === "name2") return "Enter a name.";
  if (key === "date") return "Choose the date of the event.";
  return message;
}

/** Quiet, polite status for autosave. */
function SaveIndicator({ status, onRetry }: { status: Status; onRetry: () => void }) {
  return (
    <p aria-live="polite" className="flex min-w-0 items-center gap-2 text-label text-text-muted">
      {status === "saved" ? (
        <>
          <Check className="size-5 shrink-0 text-success" aria-hidden />
          Saved
        </>
      ) : null}
      {status === "saving" ? (
        <>
          <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
          Saving…
        </>
      ) : null}
      {status === "invalid" ? (
        <span className="flex items-center gap-2 text-warning">
          <TriangleAlert className="size-5 shrink-0" aria-hidden />
          Fix the highlighted fields to save
        </span>
      ) : null}
      {status === "failed" ? (
        <span className="flex flex-wrap items-center gap-x-2 text-danger">
          <AlertTriangle className="size-5 shrink-0" aria-hidden />
          Could not save
          <Button variant="ghost" onClick={onRetry} className="h-11 px-3">
            Retry
          </Button>
        </span>
      ) : null}
    </p>
  );
}
