import { type Card, type CardView, cardSchema } from "@invite-me/api/invites/card";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

import { CouplePhotoField, couplePhotoUrl } from "@/components/couple-photo-field";
import { toast } from "@/components/toaster";
import { GoldenCallerCard } from "@/presets/traditional-golden-caller/card";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id")({
  component: InvitationEditor,
});

function InvitationEditor() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  if (!invitation.data) return <p className="p-4 text-sm text-muted-foreground">Loading invitation…</p>;
  return <Editor key={JSON.stringify(invitation.data.card)} id={id} initial={invitation.data.card} />;
}

function Editor({ id, initial }: { id: string; initial: CardView }) {
  const [draft, setDraft] = useState<Card>(initial);
  const [photoKey, setPhotoKey] = useState(initial.couplePhotoKey);
  const save = useMutation(
    orpc.invitations.saveCard.mutationOptions({
      onSuccess: () => toast.success("Invitation saved"),
      onError: (error) => toast.error("Could not save invitation", { description: error.message }),
    }),
  );

  function set<K extends keyof Card>(key: K, value: Card[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function onSave() {
    const parsed = cardSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Check the card", { description: parsed.error.issues[0]?.message });
      return;
    }
    save.mutate({ id, card: parsed.data });
  }

  return (
    <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="grid content-start gap-4">
        <h2 className="font-medium">Card</h2>

        <Text label="Host line 1" value={draft.hostLine1} max={80} onChange={(v) => set("hostLine1", v)} />
        <Text label="Connector" value={draft.connector} max={40} onChange={(v) => set("connector", v)} />
        <Text label="Host line 2" value={draft.hostLine2} max={80} onChange={(v) => set("hostLine2", v)} />
        <Text label="Request line" value={draft.requestLine} max={120} onChange={(v) => set("requestLine", v)} />
        <Text label="Occasion line" value={draft.occasionLine} max={160} onChange={(v) => set("occasionLine", v)} />

        <div className="grid grid-cols-2 gap-3">
          <Text label="Name 1" value={draft.name1} max={40} onChange={(v) => set("name1", v)} />
          <Text label="Name 2" value={draft.name2} max={40} onChange={(v) => set("name2", v)} />
        </div>

        <CouplePhotoField invitationId={id} onUploaded={setPhotoKey} />

        <label className="grid gap-1 text-sm">
          Date
          <input
            type="date"
            className="rounded-md border bg-background px-3 py-2"
            value={draft.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Text label="Time from" value={draft.timeFrom} max={20} onChange={(v) => set("timeFrom", v)} />
          <Text label="Time to" value={draft.timeTo} max={20} onChange={(v) => set("timeTo", v)} />
        </div>

        <ListEditor
          title="Sub-events"
          max={5}
          items={draft.subEvents}
          empty={{ label: "", time: "" }}
          onChange={(items) => set("subEvents", items)}
          render={(item, update) => (
            <div className="grid grid-cols-2 gap-2">
              <Text label="Label" value={item.label} max={60} onChange={(v) => update({ ...item, label: v })} />
              <Text label="Time" value={item.time} max={20} onChange={(v) => update({ ...item, time: v })} />
            </div>
          )}
        />

        <Text label="Venue" value={draft.venueName} max={80} onChange={(v) => set("venueName", v)} />
        <Text label="City" value={draft.city} max={60} onChange={(v) => set("city", v)} />

        <ListEditor
          title="RSVP contacts"
          max={5}
          min={1}
          items={draft.rsvpContacts}
          empty={{ name: "", phone: "" }}
          onChange={(items) => set("rsvpContacts", items)}
          render={(item, update) => (
            <div className="grid grid-cols-2 gap-2">
              <Text label="Name" value={item.name} max={40} onChange={(v) => update({ ...item, name: v })} />
              <Text label="Phone" value={item.phone} max={24} onChange={(v) => update({ ...item, phone: v })} />
            </div>
          )}
        />

        <label className="grid gap-1 text-sm">
          Rules
          <textarea
            className="min-h-20 rounded-md border bg-background px-3 py-2"
            maxLength={400}
            value={draft.rules}
            onChange={(e) => set("rules", e.target.value)}
          />
        </label>

        <StatefulButton className="justify-self-start" onClick={onSave}>
          Save invitation
        </StatefulButton>
      </section>

      <section className="min-w-0">
        <h2 className="mb-2 font-medium">Preview</h2>
        <GoldenCallerCard card={draft} photoUrl={couplePhotoUrl(photoKey)} />
      </section>
    </div>
  );
}

function Text({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <input
        type="text"
        maxLength={max}
        className="rounded-md border bg-background px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ListEditor<T>({
  title,
  max,
  min = 0,
  items,
  empty,
  onChange,
  render,
}: {
  title: string;
  max: number;
  min?: number;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{title}</p>
      {items.map((item, i) => (
        <div key={i} className="grid gap-2 rounded-md border p-2">
          {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
          {items.length > min ? (
            <button
              type="button"
              className="justify-self-start text-sm text-muted-foreground underline"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              Remove
            </button>
          ) : null}
        </div>
      ))}
      {items.length < max ? (
        <button
          type="button"
          className="justify-self-start text-sm underline"
          onClick={() => onChange([...items, empty])}
        >
          Add
        </button>
      ) : null}
    </div>
  );
}
