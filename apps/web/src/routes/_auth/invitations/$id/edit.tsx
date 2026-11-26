import { type Card, PRESETS as PRESET_IDS, type PresetId, cardSchema } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { DatePicker } from "@invite-me/ui/components/motion/date-picker";
import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";
import { Tabs, TabsList, TabsTrigger } from "@invite-me/ui/components/motion/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Group, HostFields, ListEditor, MapsLinkField, OPTION_ROW, Text } from "@/components/card-fields";
import { PageTitle } from "@/components/host-shell";
import { NotFound } from "@/components/not-found";
import { EditorSkeleton } from "@/components/skeletons";
import { toast } from "@/components/toaster";
import { PRESETS, presetFor } from "@/presets";
import { LookPicker } from "@/presets/look-picker";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/edit")({
  component: CardEditor,
});

const STEPS = [
  { id: "hosts", label: "Hosts", title: "Who is inviting?", blurb: "Choose how the card introduces the hosts. You can leave it out entirely." },
  { id: "couple", label: "Couple", title: "The couple and the day", blurb: "Names as you want them printed, and when it starts." },
  { id: "place", label: "Place", title: "Where is it?", blurb: "The venue name guests will see. Add a Google Maps link and they get a map." },
  { id: "guests", label: "Guests", title: "What guests might need", blurb: "Who to call, other events that day, and any note for everyone." },
  { id: "design", label: "Design", title: "Pick the look", blurb: "Change the design any time. Your words stay the same." },
] as const;
type StepId = (typeof STEPS)[number]["id"];

function CardEditor() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  if (invitation.isError) {
    return <NotFound inline title="We can't find that invitation" description="It may have been deleted, or the link is wrong." />;
  }
  if (!invitation.data) return <EditorSkeleton />;
  return <Editor key={invitation.data.id} id={id} initial={invitation.data.card} />;
}

function Editor({ id, initial }: { id: string; initial: Card }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Card>(initial);
  const [step, setStep] = useState<StepId>("hosts");
  const [showPreview, setShowPreview] = useState(false);
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
      const issue = parsed.error.issues[0];
      toast.error("Check the card", { description: issue ? `${issue.path.join(" ")}: ${issue.message}` : undefined });
      return;
    }
    save.mutate({ id, card: parsed.data });
  }

  const index = STEPS.findIndex((s) => s.id === step);
  const preset = presetFor(draft.preset);

  // The preview is the real guest page in its own window; send it the draft as it changes.
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
  }, [draft, showPreview]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 pb-28">
      <PageTitle back={{ to: "/invitations/$id", params: { id } }} title="Edit card" />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="mx-auto grid w-full min-w-0 max-w-2xl grid-cols-[minmax(0,1fr)] gap-6 lg:mx-0">
          <Tabs variant="pill" value={step} onValueChange={(v) => setStep(v as StepId)}>
            <TabsList aria-label="Card sections" className="w-full bg-muted/60 p-1 [&_[role=tab]]:flex-1 [&_[role=tab]]:justify-center max-sm:[&_[role=tab]]:!px-2.5">
              {STEPS.map((s) => (
                <TabsTrigger key={s.id} value={s.id}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <header className="grid gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Step {index + 1} of {STEPS.length}
            </p>
            <h2 className="text-3xl">{STEPS[index]!.title}</h2>
            <p className="text-base text-muted-foreground">{STEPS[index]!.blurb}</p>
          </header>

          <div className={showPreview ? "hidden lg:grid" : "grid gap-8"}>
            {step === "hosts" ? <HostFields card={draft} set={set} /> : null}

            {step === "couple" ? (
              <div className="grid gap-8">
                <Group title="The couple">
                  <Text label="First name" value={draft.name1} max={40} onChange={(v) => set("name1", v)} />
                  <Text label="Second name" value={draft.name2} max={40} onChange={(v) => set("name2", v)} />
                </Group>
                <Group title="The day">
                  <DatePicker label="Date" value={draft.date} onChange={(v) => set("date", v)} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Text label="Starts" placeholder="9.30 AM" value={draft.timeFrom} max={20} onChange={(v) => set("timeFrom", v)} />
                    <Text label="Ends (optional)" placeholder="2.30 PM" value={draft.timeTo} max={20} onChange={(v) => set("timeTo", v)} />
                  </div>
                </Group>
              </div>
            ) : null}

            {step === "place" ? (
              <Group title="The venue">
                <Text label="Venue" placeholder="The Kingsbury" value={draft.venueName} max={80} onChange={(v) => set("venueName", v)} />
                <Text label="City" placeholder="Colombo" value={draft.city} max={60} onChange={(v) => set("city", v)} />
                <MapsLinkField
                  url={draft.mapsUrl}
                  geo={draft.venueGeo}
                  onChange={(mapsUrl, venueGeo) => setDraft((prev) => ({ ...prev, mapsUrl, venueGeo }))}
                />
              </Group>
            ) : null}

            {step === "guests" ? (
              <div className="grid gap-8">
                <Group title="Who can guests ask?" hint="They appear in the card's Contact tab.">
                  <ListEditor
                    addLabel="Add another contact"
                    max={5}
                    min={1}
                    items={draft.rsvpContacts}
                    empty={{ name: "", phone: "" }}
                    onChange={(items) => set("rsvpContacts", items)}
                    render={(item, update) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Text label="Name" value={item.name} max={40} onChange={(v) => update({ ...item, name: v })} />
                        <Text label="Phone" type="tel" value={item.phone} max={24} onChange={(v) => update({ ...item, phone: v })} />
                      </div>
                    )}
                  />
                </Group>
                <Group title="Other events that day" hint="A ceremony before the main event, for example. Optional.">
                  <ListEditor
                    addLabel="Add an event"
                    max={5}
                    items={draft.subEvents}
                    empty={{ label: "", time: "" }}
                    onChange={(items) => set("subEvents", items)}
                    render={(item, update) => (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Text label="What" placeholder="Poruwa ceremony" value={item.label} max={60} onChange={(v) => update({ ...item, label: v })} />
                        <Text label="When" placeholder="9.00 AM" value={item.time} max={20} onChange={(v) => update({ ...item, time: v })} />
                      </div>
                    )}
                  />
                </Group>
                <Group title="Note for every guest" hint="Dress code or anything else. Optional.">
                  <Text label="Note" placeholder="No whites, please" value={draft.rules} max={400} onChange={(v) => set("rules", v)} />
                </Group>
              </div>
            ) : null}

            {step === "design" ? (
              <div className="grid gap-8">
                <Group title="Design">
                  <RadioGroup
                    aria-label="Design"
                    value={draft.preset}
                    onValueChange={(v) => setDraft((prev) => ({ ...prev, preset: v as PresetId, look: {} }))}
                    className="gap-2"
                  >
                    {PRESET_IDS.map((p) => (
                      <RadioGroupItem key={p} value={p} label={PRESETS[p].name} description={PRESETS[p].blurb} className={OPTION_ROW} />
                    ))}
                  </RadioGroup>
                </Group>
                {preset.lookOptions.length ? (
                  <Group title={`Look of ${preset.name}`}>
                    <div className="[&_legend]:text-base [&_legend]:font-semibold [&_fieldset>p]:text-sm [&_[role=radiogroup]]:gap-3 [&_[role=radiogroup]>label]:min-h-14 [&_[role=radiogroup]>label]:gap-3 [&_[role=radiogroup]>label]:rounded-full [&_[role=radiogroup]>label]:border [&_[role=radiogroup]>label]:border-foreground/25 [&_[role=radiogroup]>label]:bg-card [&_[role=radiogroup]>label]:px-5 [&_[role=radiogroup]>label]:text-base [&_[role=radio]]:size-6">
                      <LookPicker options={preset.lookOptions} look={draft.look} onChange={(look) => set("look", look)} />
                    </div>
                  </Group>
                ) : null}
              </div>
            ) : null}
          </div>

          <section
            aria-label="Preview"
            className={showPreview ? "mx-auto w-full max-w-[26rem] lg:hidden" : "hidden"}
          >
            <div className="h-[72svh] overflow-hidden rounded-[1.6rem] border bg-card shadow-[0_18px_40px_-18px_rgb(60_30_10/0.5)]">
              {showPreview ? (
                <iframe
                  ref={frameRef}
                  key={`m-${draft.preset}`}
                  title="Preview of your invitation"
                  src={`/preview/${draft.preset}?lite=1`}
                  className="size-full border-0"
                />
              ) : null}
            </div>
          </section>
        </div>

        <section aria-label="Live preview" className="hidden lg:sticky lg:top-20 lg:block">
          <div className="mx-auto h-[calc(100svh-12rem)] max-h-[46rem] min-h-[28rem] w-full max-w-[24rem] overflow-hidden rounded-[1.6rem] border bg-card shadow-[0_18px_40px_-18px_rgb(60_30_10/0.5)]">
            <iframe
              ref={showPreview ? undefined : frameRef}
              key={`d-${draft.preset}`}
              title="Live preview of your invitation"
              src={`/preview/${draft.preset}?lite=1`}
              className="size-full border-0"
            />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto grid w-full max-w-6xl grid-flow-col auto-cols-fr gap-2 px-4 sm:flex sm:gap-3 sm:px-5">
          <Button
            size="lg"
            variant="outline"
            className="btn-xl btn-xl-outline max-sm:!px-2 text-base sm:flex-none"
            disabled={index === 0}
            onClick={() => setStep(STEPS[index - 1]!.id)}
          >
            Back
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="btn-xl btn-xl-outline max-sm:!px-2 text-base lg:hidden"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Edit" : "Preview"}
          </Button>
          {index < STEPS.length - 1 ? (
            <Button size="lg" variant="outline" className="btn-xl btn-xl-outline max-sm:!px-2 text-base sm:flex-none" onClick={() => setStep(STEPS[index + 1]!.id)}>
              Next
            </Button>
          ) : null}
          <StatefulButton
            size="lg"
            className="btn-xl max-sm:!px-2 text-base sm:ml-auto sm:min-w-40"
            state={save.isPending ? "loading" : "idle"}
            loadingText="Saving"
            onClick={onSave}
          >
            Save
          </StatefulButton>
        </div>
      </div>
    </div>
  );
}
