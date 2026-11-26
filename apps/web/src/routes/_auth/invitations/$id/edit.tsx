import { type Card, PRESETS as PRESET_IDS, type PresetId, cardSchema } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import {
  Card as Panel,
  CardContent,
  CardHeader,
  CardTitle,
} from "@invite-me/ui/components/motion/card";
import { Input } from "@invite-me/ui/components/motion/input";
import { EditorSkeleton } from "@/components/skeletons";
import { Tabs, TabsList, TabsTrigger } from "@invite-me/ui/components/motion/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";

import { PageTitle } from "@/components/host-shell";
import { toast } from "@/components/toaster";
import { PRESETS, presetFor } from "@/presets";
import { LookPicker } from "@/presets/look-picker";
import { orpc } from "@/utils/orpc";

/** Paste a Google Maps link; the server reads the coordinates so guests see a map. */
function MapsLinkField({
  url,
  geo,
  onChange,
}: {
  url: string;
  geo: Card["venueGeo"];
  onChange: (url: string, geo: Card["venueGeo"]) => void;
}) {
  const [text, setText] = useState(url);
  const resolve = useMutation(
    orpc.invitations.resolveMaps.mutationOptions({
      onSuccess: (point, vars) => onChange(vars.url, point),
      onError: () => onChange(text.trim(), null),
    }),
  );
  function commit() {
    const next = text.trim();
    if (next === url && geo) return;
    if (!next) return onChange("", null);
    resolve.mutate({ url: next });
  }
  const error = resolve.isError ? resolve.error.message : undefined;
  return (
    <div className="grid gap-1.5">
      <Input
        label="Google Maps link"
        type="url"
        inputMode="url"
        placeholder="https://maps.app.goo.gl/…"
        maxLength={500}
        value={text}
        onChange={setText}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        error={error}
        success={Boolean(geo) && text.trim() === url && !resolve.isPending}
      />
      <p className="px-1 text-xs text-muted-foreground">
        {resolve.isPending
          ? "Finding the place…"
          : geo
            ? `Map pinned at ${geo.lat.toFixed(4)}, ${geo.lng.toFixed(4)}. Guests can open it in Google Maps.`
            : "In Google Maps, open the venue, tap Share, then Copy link, and paste it here."}
      </p>
    </div>
  );
}

export const Route = createFileRoute("/_auth/invitations/$id/edit")({
  component: CardEditor,
});

type View = "edit" | "preview";

function CardEditor() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  if (!invitation.data) {
    return (
      <EditorSkeleton />
    );
  }
  return <Editor key={invitation.data.id} id={id} initial={invitation.data.card} />;
}

function Editor({ id, initial }: { id: string; initial: Card }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Card>(initial);
  const [view, setView] = useState<View>("edit");
  const save = useMutation(
    orpc.invitations.save.mutationOptions({
      onSuccess: async () => {
        toast.success("Card saved");
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        await navigate({ to: "/invitations/$id", params: { id } });
      },
      onError: (error) => toast.error("Could not save card", { description: error.message }),
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
  const preset = presetFor(draft.preset);

  // The preview page is the real guest page in its own window; send it the draft as it changes.
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const send = () =>
      frameRef.current?.contentWindow?.postMessage({ type: "invite-preview", card: draft }, window.location.origin);
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "invite-preview-ready") send();
    };
    window.addEventListener("message", onReady);
    send();
    return () => window.removeEventListener("message", onReady);
  }, [draft]);

  return (
    <div className="grid gap-4">
      <PageTitle back={{ to: "/invitations/$id", params: { id } }} title="Edit card" />
      <Tabs
        variant="segment"
        value={view}
        onValueChange={(v) => setView(v as View)}
        className="lg:hidden"
      >
        <TabsList aria-label="Card view" className="w-full [&>*]:flex-1">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={view === "edit" ? "grid gap-4" : "hidden gap-4 lg:grid"}>
          <Section title="Design">
            <RadioGroup
              aria-label="Design"
              value={draft.preset}
              onValueChange={(v) => setDraft((prev) => ({ ...prev, preset: v as PresetId, look: {} }))}
              className="gap-2"
            >
              {PRESET_IDS.map((id) => (
                <RadioGroupItem key={id} value={id} label={PRESETS[id].name} description={PRESETS[id].blurb} />
              ))}
            </RadioGroup>
          </Section>
          <Section title="Hosts">
            <Text label="Host line 1" value={draft.hostLine1} max={80} onChange={(v) => set("hostLine1", v)} />
            <Text label="Connector" value={draft.connector} max={40} onChange={(v) => set("connector", v)} />
            <Text label="Host line 2" value={draft.hostLine2} max={80} onChange={(v) => set("hostLine2", v)} />
            <Text label="Request line" value={draft.requestLine} max={120} onChange={(v) => set("requestLine", v)} />
            <Text label="Occasion line" value={draft.occasionLine} max={160} onChange={(v) => set("occasionLine", v)} />
          </Section>

          <Section title="Couple">
            <div className="grid gap-3 sm:grid-cols-2">
              <Text label="Name 1" value={draft.name1} max={40} onChange={(v) => set("name1", v)} />
              <Text label="Name 2" value={draft.name2} max={40} onChange={(v) => set("name2", v)} />
            </div>
          </Section>

          <Section title="When">
            <Input
              label="Date"
              type="date"
              value={draft.date}
              onChange={(v) => set("date", v)}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Text label="Time from" value={draft.timeFrom} max={20} onChange={(v) => set("timeFrom", v)} />
              <Text label="Time to" value={draft.timeTo} max={20} onChange={(v) => set("timeTo", v)} />
            </div>
            <ListEditor
              title="Sub-events"
              addLabel="Add sub-event"
              max={5}
              items={draft.subEvents}
              empty={{ label: "", time: "" }}
              onChange={(items) => set("subEvents", items)}
              render={(item, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Text label="Label" value={item.label} max={60} onChange={(v) => update({ ...item, label: v })} />
                  <Text label="Time" value={item.time} max={20} onChange={(v) => update({ ...item, time: v })} />
                </div>
              )}
            />
          </Section>

          <Section title="Where">
            <div className="grid gap-3 sm:grid-cols-2">
              <Text label="Venue" value={draft.venueName} max={80} onChange={(v) => set("venueName", v)} />
              <Text label="City" value={draft.city} max={60} onChange={(v) => set("city", v)} />
            </div>
            <MapsLinkField
              url={draft.mapsUrl}
              geo={draft.venueGeo}
              onChange={(mapsUrl, venueGeo) => setDraft((prev) => ({ ...prev, mapsUrl, venueGeo }))}
            />
          </Section>

          <Section title={`Look of ${preset.name}`}>
            <LookPicker options={preset.lookOptions} look={draft.look} onChange={(look) => set("look", look)} />
          </Section>

          <Section title="RSVP and rules">
            <ListEditor
              title="RSVP contacts"
              addLabel="Add contact"
              max={5}
              min={1}
              items={draft.rsvpContacts}
              empty={{ name: "", phone: "" }}
              onChange={(items) => set("rsvpContacts", items)}
              render={(item, update) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Text label="Name" value={item.name} max={40} onChange={(v) => update({ ...item, name: v })} />
                  <Text
                    label="Phone"
                    type="tel"
                    value={item.phone}
                    max={24}
                    onChange={(v) => update({ ...item, phone: v })}
                  />
                </div>
              )}
            />
            <Text
              label="Rules shown to every guest"
              placeholder="No whites"
              value={draft.rules}
              max={400}
              onChange={(v) => set("rules", v)}
            />
          </Section>

          <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/90 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
            <StatefulButton
              className="w-full sm:w-auto"
              state={save.isPending ? "loading" : "idle"}
              loadingText="Saving"
              onClick={onSave}
            >
              Save card
            </StatefulButton>
          </div>
        </div>

        <section
          aria-label="Preview"
          className={
            view === "preview"
              ? "min-w-0"
              : "hidden min-w-0 lg:sticky lg:top-20 lg:block lg:max-h-[calc(100svh-6rem)] lg:overflow-y-auto"
          }
        >
          <div className="mx-auto h-[78svh] w-full max-w-[26rem] overflow-hidden rounded-[1.6rem] border bg-card shadow-[0_18px_40px_-18px_rgb(60_30_10/0.5)]">
            <iframe
              ref={frameRef}
              key={draft.preset}
              title="Preview of your invitation"
              src={`/preview/${draft.preset}?lite=1`}
              className="size-full border-0"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel size="compact">
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Panel>
  );
}

function Text({
  label,
  value,
  max,
  onChange,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <Input
      label={label}
      type={type}
      placeholder={placeholder}
      maxLength={max}
      value={value}
      onChange={onChange}
    />
  );
}

function ListEditor<T>({
  title,
  addLabel,
  max,
  min = 0,
  items,
  empty,
  onChange,
  render,
}: {
  title: string;
  addLabel: string;
  max: number;
  min?: number;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <p className="px-1 text-sm font-medium">{title}</p>
      {items.map((item, i) => (
        <Panel key={i} variant="muted" size="compact">
          <CardContent className="grid gap-3">
            {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
            {items.length > min ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="justify-self-start"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                Remove
              </Button>
            ) : null}
          </CardContent>
        </Panel>
      ))}
      {items.length < max ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="justify-self-start"
          onClick={() => onChange([...items, empty])}
        >
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
