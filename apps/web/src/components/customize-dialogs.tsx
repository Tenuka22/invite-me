import { type Card, type PresetId, PRESETS as PRESET_IDS, hostBlock } from "@invite-me/api/invites/card";
import { cn } from "@invite-me/ui/lib/utils";
import { CalendarClock, Check, ChevronRight, HeartHandshake, type LucideIcon, MessageSquareQuote, Palette, Sparkles, Users } from "lucide-react";
import { type ReactNode, useMemo } from "react";

import { HostFields, ListEditor, TextField, WordingFields } from "@/components/card-fields";
import { InvitationCard } from "@/components/invitation-card";
import { Button, Dialog, DialogClose, DialogContent, DialogTrigger, Field, Textarea } from "@/components/ui";
import { PRESETS, presetFor } from "@/presets";
import { resolveLook } from "@/presets/look";
import { LookPicker } from "@/presets/look-picker";

type Set = <K extends keyof Card>(key: K, value: Card[K]) => void;

/** One row of the Customize list: icon, title and a one-line summary of the current value. Opens a dialog. */
function CustomizeRow({
  icon: Icon,
  title,
  summary,
  dialogTitle,
  description,
  size = "md",
  children,
}: {
  icon: LucideIcon;
  title: string;
  summary: string;
  dialogTitle?: string;
  description?: string;
  size?: "md" | "lg" | "xl";
  children: ReactNode;
}) {
  return (
    <li>
      <Dialog>
        <DialogTrigger
          render={
            <button
              type="button"
              className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-border bg-surface-raised px-4 py-3 text-left transition-colors duration-(--duration-fast) hover:bg-primary-soft"
            />
          }
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-pill bg-primary-soft text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="grid min-w-0 flex-1">
            <span className="font-semibold">{title}</span>
            <span className="text-label text-text-muted [overflow-wrap:anywhere]">{summary}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
        </DialogTrigger>
        <DialogContent
          title={dialogTitle ?? title}
          description={description}
          size={size}
          footer={<DialogClose render={<Button variant="primary" />}>Done</DialogClose>}
        >
          {children}
        </DialogContent>
      </Dialog>
    </li>
  );
}

const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const names = (s: string) => (s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s.'-])([a-z])/g, (_, a, b) => a + b.toUpperCase()) : s);

/** The Customize list: everything beyond names, date and venue lives behind these rows. */
export function CustomizeList({ draft, set, patch }: { draft: Card; set: Set; patch: (changes: Partial<Card>) => void }) {
  const preset = presetFor(draft.preset);
  const hosts = hostBlock(draft);
  const lookSummary = useMemo(() => {
    const current = resolveLook(preset.lookOptions, draft.look);
    return preset.lookOptions.map((o) => o.choices.find((c) => c.value === current[o.key])?.label).filter(Boolean).join(", ");
  }, [preset, draft.look]);
  const events = draft.subEvents.filter((e) => e.label.trim());
  const contacts = draft.rsvpContacts.filter((c) => c.name.trim() || c.phone.trim());

  return (
    <ul aria-label="Customize" className="grid gap-3">
      <CustomizeRow
        icon={HeartHandshake}
        title="Hosts"
        summary={hosts.hosts.length ? hosts.hosts.map(names).join(` ${hosts.connector ? sentence(hosts.connector) : "and"} `) : "No host named"}
        description="Who is inviting. You can leave it out entirely."
      >
        <HostFields card={draft} set={set} />
      </CustomizeRow>

      <CustomizeRow icon={MessageSquareQuote} title="Wording" summary={sentence(hosts.request)} description="The lines above the couple's names.">
        <WordingFields card={draft} set={set} />
      </CustomizeRow>

      <CustomizeRow
        icon={CalendarClock}
        title="Event schedule"
        summary={events.length ? events.map((e) => [sentence(e.label), e.time].filter(Boolean).join(" ")).join(", ") : "No other events"}
        description="A ceremony before the main event, for example. Optional."
      >
        <ListEditor
          addLabel="Add an event"
          removeLabel="Remove event"
          max={5}
          items={draft.subEvents}
          empty={{ label: "", time: "" }}
          onChange={(items) => set("subEvents", items)}
          render={(item, update) => (
            <>
              <TextField label="What" placeholder="e.g. Poruwa ceremony" value={item.label} max={60} onChange={(v) => update({ ...item, label: v })} />
              <TextField label="When" placeholder="e.g. 9.00 AM" value={item.time} max={20} onChange={(v) => update({ ...item, time: v })} />
            </>
          )}
        />
      </CustomizeRow>

      <CustomizeRow
        icon={Users}
        title="Guest greetings"
        summary={[contacts.length ? `${contacts.length} ${contacts.length === 1 ? "contact" : "contacts"}` : "", draft.rules.trim() ? "Note added" : ""].filter(Boolean).join(", ") || "No contacts or note"}
        dialogTitle="Guest greetings"
        description="Who guests can call, and a note for everyone."
      >
        <div className="grid gap-6">
          <section aria-label="Who can guests ask?" className="grid gap-3">
            <h3 className="text-label font-medium">Who can guests ask?</h3>
            <p className="-mt-2 text-label text-text-muted">They appear in the card's Contact tab.</p>
            <ListEditor
              addLabel="Add a contact"
              removeLabel="Remove contact"
              max={5}
              min={1}
              items={draft.rsvpContacts}
              empty={{ name: "", phone: "" }}
              onChange={(items) => set("rsvpContacts", items)}
              render={(item, update) => (
                <>
                  <TextField label="Name" placeholder="e.g. Nimal" value={item.name} max={40} onChange={(v) => update({ ...item, name: v })} />
                  <TextField label="Phone" type="tel" inputMode="tel" placeholder="e.g. 077 123 4567" value={item.phone} max={24} onChange={(v) => update({ ...item, phone: v })} />
                </>
              )}
            />
          </section>
          <Field label="Note for every guest" optional description="Dress code or anything else.">
            <Textarea placeholder="e.g. No whites, please" maxLength={400} value={draft.rules} onChange={(e) => set("rules", e.target.value)} />
          </Field>
        </div>
      </CustomizeRow>

      <CustomizeRow icon={Palette} title="Design" summary={preset.name} size="lg" description="Change the design any time. Your words stay the same.">
        <DesignPicker draft={draft} onPick={(id) => patch({ preset: id, look: {} })} />
      </CustomizeRow>

      {preset.lookOptions.length ? (
        <CustomizeRow icon={Sparkles} title="Look" size="xl" summary={lookSummary} dialogTitle={`Look of ${preset.name}`} description="Card colour, fonts and decorations.">
          <div className="grid gap-6 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] md:items-start md:gap-8">
            <InvitationCard card={draft} className="mx-auto w-56 rounded-2xl border border-border md:sticky md:top-0 md:w-full" />
            <LookPicker options={preset.lookOptions} look={draft.look} onChange={(look) => set("look", look)} />
          </div>
        </CustomizeRow>
      ) : null}
    </ul>
  );
}

/** Thumbnails of every design, drawn with the couple's own words. */
function DesignPicker({ draft, onPick }: { draft: Card; onPick: (id: PresetId) => void }) {
  return (
    <ul role="radiogroup" aria-label="Design" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {PRESET_IDS.map((id) => {
        const chosen = draft.preset === id;
        return (
          <li key={id}>
            <button
              type="button"
              role="radio"
              aria-checked={chosen}
              onClick={() => onPick(id)}
              className={cn(
                "grid w-full gap-2 rounded-2xl border-2 bg-surface-raised p-2 text-left transition-colors duration-(--duration-fast)",
                chosen ? "border-primary bg-primary-soft" : "border-transparent hover:border-border-strong",
              )}
            >
              <InvitationCard card={{ ...draft, preset: id, look: chosen ? draft.look : {} }} className="rounded-xl" label={`${PRESETS[id].name} preview`} />
              <span className="flex min-h-11 items-center justify-between gap-2 px-1">
                <span className="grid min-w-0">
                  <span className="font-semibold">{PRESETS[id].name}</span>
                  <span className="text-label text-text-muted">{PRESETS[id].blurb}</span>
                </span>
                {chosen ? <Check className="size-5 shrink-0 text-primary" aria-hidden /> : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
