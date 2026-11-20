import { type Card, cardSchema } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { DatePicker } from "@invite-me/ui/components/motion/date-picker";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FocusEvent, useCallback, useEffect, useRef, useState } from "react";

import {
  AccordionSection,
  Field,
  GrowControl,
  RowList,
  TextControl,
  TimeControl,
  fieldId,
} from "@/components/editor-form";
import { EditorSkeleton } from "@/components/page-skeletons";
import { toast } from "@/components/toaster";
import { GoldenCallerCard, type CardField } from "@/presets/traditional-golden-caller/card";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/edit")({
  component: InvitationEditor,
});

/** The overlay drops the page chrome, so the card can use almost the whole window. */
const LARGE_PREVIEW_MAX_WIDTH = "min(100%, calc((100svh - 8rem) * 0.706))";

/**
 * What each field says when empty. Sentence case with "e.g." so it reads as a hint, never as content.
 * (The card itself falls back to CARD_PLACEHOLDERS, drawn on the card only.)
 */
const HINT = {
  name1: "e.g. Binuri",
  name2: "e.g. Sameera",
  hostLine1: "e.g. Mr. & Mrs. Perera",
  hostLine2: "e.g. Mr. & Mrs. Silva",
  timeFrom: "e.g. 9.30 AM",
  timeTo: "e.g. 2.30 PM",
  venueName: "e.g. The Kingsbury",
  city: "e.g. Colombo",
  contactName: "e.g. Binuri",
  contactPhone: "e.g. 077 123 4567",
  subLabel: "e.g. Poruwa ceremony",
  rules: "e.g. Adults only, please. No gifts.",
} as const;

/** Wording used on the card when a field is left empty. */
const DEFAULTS = {
  connector: "Together with",
  requestLine: "Warmly request the honor of your presence",
  occasionLine: "On the occasion of the marriage of their children",
} as const;

type SectionId = "couple" | "hosts" | "message" | "when" | "where" | "rsvp" | "extras";

/** Which accordion section holds each card part, and which input to focus when the card part is tapped. */
const CARD_TARGET: Record<CardField, { section: SectionId; focus: string }> = {
  name1: { section: "couple", focus: fieldId("name1") },
  name2: { section: "couple", focus: fieldId("name2") },
  hostLine1: { section: "hosts", focus: fieldId("hostLine1") },
  connector: { section: "hosts", focus: fieldId("connector") },
  hostLine2: { section: "hosts", focus: fieldId("hostLine2") },
  requestLine: { section: "message", focus: fieldId("requestLine") },
  occasionLine: { section: "message", focus: fieldId("occasionLine") },
  date: { section: "when", focus: `${fieldId("date")} button` },
  timeFrom: { section: "when", focus: fieldId("timeFrom") },
  venueName: { section: "where", focus: fieldId("venueName") },
  city: { section: "where", focus: fieldId("city") },
  rsvpContacts: { section: "rsvp", focus: fieldId("rsvp-0-name") },
  subEvents: { section: "extras", focus: fieldId("sub-0-label") },
  rules: { section: "extras", focus: fieldId("rules") },
};

const COUNTED_SECTIONS: SectionId[] = ["couple", "hosts", "message", "when", "where", "rsvp"];

const filled = (value: string) => value.trim().length > 0;

function InvitationEditor() {
  const { id } = Route.useParams();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));

  if (invitation.isPending) return <EditorSkeleton />;
  if (invitation.isError) {
    return (
      <div className="grid max-w-md justify-items-start gap-3 py-8">
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Couldn't load this invitation</h2>
        <p className="text-sm text-muted-foreground">
          The connection dropped or the invitation is no longer here.
        </p>
        <Button variant="outline" size="sm" onClick={() => void invitation.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  return (
    <Editor key={JSON.stringify(invitation.data.card)} id={id} initial={invitation.data.card} />
  );
}

function Editor({ id, initial }: { id: string; initial: Card }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Card>(initial);
  /** What the server has, so autosave knows there is something to write. */
  const savedSnapshot = useRef(JSON.stringify(initial));
  const [savedOnce, setSavedOnce] = useState(false);
  const save = useMutation(
    orpc.invitations.saveCard.mutationOptions({
      onError: (error) => toast.error("Could not save invitation", { description: error.message }),
    }),
  );

  const persist = useCallback(
    (card: Card, then?: () => void) => {
      save.mutate(
        { id, card },
        {
          onSuccess: () => {
            savedSnapshot.current = JSON.stringify(card);
            setSavedOnce(true);
            then?.();
          },
        },
      );
    },
    [id, save.mutate],
  );

  // Autosave: once typing settles, valid drafts are written without asking. Invalid ones wait.
  useEffect(() => {
    if (JSON.stringify(draft) === savedSnapshot.current) return;
    const parsed = cardSchema.safeParse(draft);
    if (!parsed.success) return;
    const timer = window.setTimeout(() => persist(parsed.data), 900);
    return () => window.clearTimeout(timer);
  }, [draft, persist]);

  const dirty = JSON.stringify(draft) !== savedSnapshot.current;

  // Unsaved-changes guard for closing the tab while edits are still waiting.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Required fields only complain once the host has been in them, so a fresh card isn't a wall of red. */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));
  const missingNames = !filled(draft.name1) || !filled(draft.name2);
  const missingDate = !filled(draft.date);
  const incomplete = missingNames || missingDate;

  function set<K extends keyof Card>(key: K, value: Card[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  const [openSection, setOpenSection] = useState<SectionId | null>("couple");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [activeField, setActiveField] = useState<CardField | null>(null);

  const done: Record<SectionId, boolean> = {
    couple: !missingNames,
    hosts: filled(draft.hostLine1),
    message: true,
    when: !missingDate,
    where: filled(draft.venueName) && filled(draft.city),
    rsvp: draft.rsvpContacts.some((c) => filled(c.name) && filled(c.phone)),
    extras: draft.subEvents.length > 0 || filled(draft.rules),
  };
  const doneCount = COUNTED_SECTIONS.filter((s) => done[s]).length;

  const summaries: Record<SectionId, string> = {
    couple: [draft.name1, draft.name2].filter(filled).join(" & ") || "Add both names",
    hosts: [draft.hostLine1, draft.hostLine2].filter(filled).join(" · ") || "Who is inviting",
    message:
      filled(draft.requestLine) || filled(draft.occasionLine)
        ? "Custom wording"
        : "Standard wording",
    when:
      [
        draft.date &&
          new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(
            new Date(`${draft.date}T00:00:00Z`),
          ),
        draft.timeFrom && (draft.timeTo ? `${draft.timeFrom} – ${draft.timeTo}` : draft.timeFrom),
      ]
        .filter(Boolean)
        .join(" · ") || "Pick the date",
    where: [draft.venueName, draft.city].filter(filled).join(", ") || "Venue and city",
    rsvp:
      draft.rsvpContacts
        .filter((c) => filled(c.name) || filled(c.phone))
        .map((c) => c.name || c.phone)
        .join(", ") || "Who guests call",
    extras:
      [
        draft.subEvents.length > 0 &&
          `${draft.subEvents.length} extra event${draft.subEvents.length > 1 ? "s" : ""}`,
        filled(draft.rules) && "Rules",
      ]
        .filter(Boolean)
        .join(" · ") || "Nothing added",
  };

  function jumpTo(field: CardField) {
    const target = CARD_TARGET[field];
    setTab("edit");
    setOpenSection(target.section);
    // Wait a frame so the section is open and the edit pane is visible before focusing.
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`#${target.focus}`);
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        document
          .getElementById(`section-${target.section}`)
          ?.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  function onFormFocus(event: FocusEvent<HTMLElement>) {
    const owner = (event.target as HTMLElement).closest<HTMLElement>("[data-card-field]");
    setActiveField((owner?.dataset.cardField as CardField | undefined) ?? null);
  }

  function finish() {
    if (incomplete) {
      const first: SectionId = missingNames ? "couple" : "when";
      setTouched((prev) => ({ ...prev, name1: true, name2: true, date: true }));
      setTab("edit");
      setOpenSection(first);
      toast.error("Add both names and the date first");
      return;
    }
    const parsed = cardSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Check the card", { description: parsed.error.issues[0]?.message });
      return;
    }
    const leave = () => void navigate({ to: "/invitations/$id", params: { id } });
    if (dirty) persist(parsed.data, leave);
    else leave();
  }

  function saveNow() {
    const parsed = cardSchema.safeParse(draft);
    if (!parsed.success) {
      toast.error("Check the card", { description: parsed.error.issues[0]?.message });
      return;
    }
    persist(parsed.data);
  }

  const toggle = (s: SectionId) => setOpenSection((cur) => (cur === s ? null : s));
  const section = (s: SectionId) => ({
    id: `section-${s}`,
    open: openSection === s,
    done: done[s],
    summary: summaries[s],
    onToggle: () => toggle(s),
  });

  const status = (
    <SaveStatus
      pending={save.isPending}
      failed={save.isError}
      dirty={dirty}
      saved={savedOnce}
      onSave={saveNow}
      incomplete={incomplete}
    />
  );
  const progress = (
    <div className="grid min-w-0 gap-1">
      <p className="text-xs font-medium">
        {doneCount} of {COUNTED_SECTIONS.length} sections done
      </p>
      <div
        role="progressbar"
        aria-label="Sections done"
        aria-valuemin={0}
        aria-valuemax={COUNTED_SECTIONS.length}
        aria-valuenow={doneCount}
        className="h-1 w-full max-w-40 overflow-hidden rounded-full bg-foreground/10"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
          style={{ width: `${(doneCount / COUNTED_SECTIONS.length) * 100}%` }}
        />
      </div>
    </div>
  );
  const doneButton = (
    <Button variant="primary" onClick={finish} disabled={save.isPending}>
      {save.isPending ? "Saving…" : "Done"}
    </Button>
  );

  return (
    <div className="grid gap-4 pb-24 lg:pb-0">
      {/* Desktop: progress, save state and the primary action stay in view. */}
      <div className="sticky top-0 z-20 -mx-6 hidden items-center justify-between gap-4 border-b border-foreground/10 bg-background/95 px-6 py-2.5 backdrop-blur lg:flex">
        {progress}
        <div className="flex items-center gap-4">
          {status}
          {doneButton}
        </div>
      </div>

      {/* Mobile: one pane at a time. */}
      <div
        role="tablist"
        aria-label="Editor view"
        className="grid h-11 grid-cols-2 gap-1 rounded-full bg-muted p-1 lg:hidden"
      >
        {(["edit", "preview"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
              tab === t ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "edit" ? "Edit" : "Preview"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,min(calc((100svh-12.5rem)*0.706),40vw))] lg:gap-10">
        <form
          noValidate
          onSubmit={(e) => e.preventDefault()}
          onFocus={onFormFocus}
          onBlur={() => setActiveField(null)}
          className={tab === "edit" ? "min-w-0" : "hidden min-w-0 lg:block"}
        >
          <AccordionSection
            {...section("couple")}
            title="Couple"
            affects="The two names shown large on the card."
          >
            <div className="grid grid-cols-2 gap-2">
              <Field
                id={fieldId("name1")}
                label="First name"
                required
                error={touched.name1 && !filled(draft.name1) ? "Add a name" : undefined}
              >
                <TextControl
                  id={fieldId("name1")}
                  card="name1"
                  value={draft.name1}
                  max={40}
                  placeholder={HINT.name1}
                  invalid={touched.name1 && !filled(draft.name1)}
                  onBlur={() => touch("name1")}
                  onChange={(v) => set("name1", v)}
                />
              </Field>
              <Field
                id={fieldId("name2")}
                label="Second name"
                required
                error={touched.name2 && !filled(draft.name2) ? "Add a name" : undefined}
              >
                <TextControl
                  id={fieldId("name2")}
                  card="name2"
                  value={draft.name2}
                  max={40}
                  placeholder={HINT.name2}
                  invalid={touched.name2 && !filled(draft.name2)}
                  onBlur={() => touch("name2")}
                  onChange={(v) => set("name2", v)}
                />
              </Field>
            </div>
          </AccordionSection>

          <AccordionSection
            {...section("hosts")}
            title="Hosts"
            affects="Who is inviting, at the top of the card."
          >
            <Field
              id={fieldId("hostLine1")}
              label="First host"
              hint="Parents or family of one side."
            >
              <TextControl
                id={fieldId("hostLine1")}
                card="hostLine1"
                value={draft.hostLine1}
                max={80}
                placeholder={HINT.hostLine1}
                onChange={(v) => set("hostLine1", v)}
              />
            </Field>
            <Field
              id={fieldId("connector")}
              label="Joined by"
              hint={
                filled(draft.connector) ? undefined : `Using the default: “${DEFAULTS.connector}”.`
              }
              action={
                filled(draft.connector) ? (
                  <ResetButton onClick={() => set("connector", "")} />
                ) : (
                  <DefaultBadge />
                )
              }
            >
              <TextControl
                id={fieldId("connector")}
                card="connector"
                value={draft.connector}
                max={40}
                placeholder={DEFAULTS.connector}
                onChange={(v) => set("connector", v)}
              />
            </Field>
            <Field
              id={fieldId("hostLine2")}
              label="Second host"
              hint="Parents or family of the other side."
            >
              <TextControl
                id={fieldId("hostLine2")}
                card="hostLine2"
                value={draft.hostLine2}
                max={80}
                placeholder={HINT.hostLine2}
                onChange={(v) => set("hostLine2", v)}
              />
            </Field>
            <div className="rounded-md bg-muted/60 px-3 py-2 text-center text-xs uppercase leading-5 tracking-[0.06em]">
              <span className="mb-1 block text-[0.65rem] normal-case tracking-normal text-muted-foreground">
                How it reads on the card
              </span>
              <Preview3 first={draft.hostLine1} joiner={draft.connector} second={draft.hostLine2} />
            </div>
          </AccordionSection>

          <AccordionSection
            {...section("message")}
            title="Invitation message"
            affects="The two sentences around the names. Pre-filled; change only if you want different wording."
          >
            <WordingField
              id="requestLine"
              label="Invitation wording"
              hint="Printed under the hosts."
              value={draft.requestLine}
              fallback={DEFAULTS.requestLine}
              max={120}
              onChange={(v) => set("requestLine", v)}
            />
            <WordingField
              id="occasionLine"
              label="Occasion"
              hint="Printed above the names."
              value={draft.occasionLine}
              fallback={DEFAULTS.occasionLine}
              max={160}
              onChange={(v) => set("occasionLine", v)}
            />
          </AccordionSection>

          <AccordionSection
            {...section("when")}
            title="When"
            affects="The date block and the time line."
          >
            <div id={fieldId("date")} data-card-field="date" className="grid gap-1">
              <DatePicker
                label="Date"
                value={draft.date}
                placeholder="Pick the date"
                error={touched.date && missingDate ? "Pick the date" : undefined}
                onClose={() => touch("date")}
                onChange={(v) => set("date", v)}
              />
              <p className="text-xs text-muted-foreground">
                Required. Month and weekday are filled in for you.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field id={fieldId("timeFrom")} label="Starts">
                <TimeControl
                  id={fieldId("timeFrom")}
                  card="timeFrom"
                  value={draft.timeFrom}
                  placeholder={HINT.timeFrom}
                  onChange={(v) => set("timeFrom", v)}
                />
              </Field>
              <Field id={fieldId("timeTo")} label="Ends">
                <TimeControl
                  id={fieldId("timeTo")}
                  card="timeFrom"
                  value={draft.timeTo}
                  placeholder={HINT.timeTo}
                  onChange={(v) => set("timeTo", v)}
                />
              </Field>
            </div>
          </AccordionSection>

          <AccordionSection
            {...section("where")}
            title="Where"
            affects="The venue and city under the time."
          >
            <div className="grid grid-cols-2 gap-2">
              <Field id={fieldId("venueName")} label="Venue">
                <TextControl
                  id={fieldId("venueName")}
                  card="venueName"
                  value={draft.venueName}
                  max={80}
                  placeholder={HINT.venueName}
                  onChange={(v) => set("venueName", v)}
                />
              </Field>
              <Field id={fieldId("city")} label="City">
                <TextControl
                  id={fieldId("city")}
                  card="city"
                  value={draft.city}
                  max={60}
                  placeholder={HINT.city}
                  onChange={(v) => set("city", v)}
                />
              </Field>
            </div>
          </AccordionSection>

          <AccordionSection
            {...section("rsvp")}
            title="RSVP contacts"
            affects="Who guests call to reply, at the bottom of the card. Up to 5."
          >
            <RowList
              addLabel="Add contact"
              max={5}
              min={1}
              items={draft.rsvpContacts}
              empty={{ name: "", phone: "" }}
              onChange={(items) => set("rsvpContacts", items)}
              render={(item, i, update) => (
                <>
                  <Field id={fieldId(`rsvp-${i}-name`)} label="Name">
                    <TextControl
                      id={fieldId(`rsvp-${i}-name`)}
                      card="rsvpContacts"
                      value={item.name}
                      max={40}
                      placeholder={HINT.contactName}
                      onChange={(v) => update({ ...item, name: v })}
                    />
                  </Field>
                  <Field id={fieldId(`rsvp-${i}-phone`)} label="Phone">
                    <TextControl
                      id={fieldId(`rsvp-${i}-phone`)}
                      card="rsvpContacts"
                      value={item.phone}
                      max={24}
                      placeholder={HINT.contactPhone}
                      onChange={(v) => update({ ...item, phone: v })}
                    />
                  </Field>
                </>
              )}
            />
          </AccordionSection>

          <AccordionSection
            {...section("extras")}
            title="Extra details"
            affects="Other events and small print. Both optional."
          >
            <RowList
              addLabel="Add an extra event"
              max={5}
              items={draft.subEvents}
              empty={{ label: "", time: "" }}
              onChange={(items) => set("subEvents", items)}
              render={(item, i, update) => (
                <>
                  <Field id={fieldId(`sub-${i}-label`)} label="Event">
                    <TextControl
                      id={fieldId(`sub-${i}-label`)}
                      card="subEvents"
                      value={item.label}
                      max={60}
                      placeholder={HINT.subLabel}
                      onChange={(v) => update({ ...item, label: v })}
                    />
                  </Field>
                  <Field id={fieldId(`sub-${i}-time`)} label="Time">
                    <TimeControl
                      id={fieldId(`sub-${i}-time`)}
                      card="subEvents"
                      value={item.time}
                      placeholder={HINT.timeFrom}
                      onChange={(v) => update({ ...item, time: v })}
                    />
                  </Field>
                </>
              )}
            />
            <Field
              id={fieldId("rules")}
              label="Rules or notes"
              hint="Printed in small text at the bottom of the card."
            >
              <GrowControl
                id={fieldId("rules")}
                card="rules"
                value={draft.rules}
                max={400}
                placeholder={HINT.rules}
                onChange={(v) => set("rules", v)}
              />
            </Field>
          </AccordionSection>
        </form>

        <Preview
          card={draft}
          activeField={activeField}
          onFieldClick={jumpTo}
          visibleOnMobile={tab === "preview"}
        />
      </div>

      {/* Mobile: the primary action stays under the thumb. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-foreground/10 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="grid min-w-0 gap-1">
          {progress}
          {status}
        </div>
        {doneButton}
      </div>
    </div>
  );
}

function DefaultBadge() {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
      Default
    </span>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-sm text-xs text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      Reset to default
    </button>
  );
}

/** A pre-filled sentence: shows the default while empty, offers a reset once edited. */
function WordingField({
  id,
  label,
  hint,
  value,
  fallback,
  max,
  onChange,
}: {
  id: "requestLine" | "occasionLine";
  label: string;
  hint: string;
  value: string;
  fallback: string;
  max: number;
  onChange: (value: string) => void;
}) {
  const custom = filled(value);
  return (
    <Field
      id={fieldId(id)}
      label={label}
      hint={custom ? hint : `${hint} Using the default wording.`}
      action={custom ? <ResetButton onClick={() => onChange("")} /> : <DefaultBadge />}
    >
      <GrowControl
        id={fieldId(id)}
        card={id}
        value={value}
        max={max}
        placeholder={fallback}
        onChange={onChange}
      />
    </Field>
  );
}

/** The three host lines as stacked on the card; empty ones show the card's own wording, muted. */
function Preview3({ first, joiner, second }: { first: string; joiner: string; second: string }) {
  const line = (value: string, fallback: string) =>
    filled(value) ? (
      <span className="block">{value}</span>
    ) : (
      <span className="block text-muted-foreground/70">{fallback}</span>
    );
  return (
    <>
      {line(first, "Mr. & Mrs. Perera")}
      {line(joiner, DEFAULTS.connector)}
      {line(second, "Mr. & Mrs. Silva")}
    </>
  );
}

/** Autosave is the primary path; this only reports it and offers a manual retry when needed. */
function SaveStatus({
  pending,
  failed,
  dirty,
  saved,
  onSave,
  incomplete,
}: {
  pending: boolean;
  failed: boolean;
  dirty: boolean;
  saved: boolean;
  onSave: () => void;
  incomplete: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      {pending ? (
        "Saving…"
      ) : failed ? (
        <>
          Not saved
          <Button variant="ghost" size="sm" onClick={onSave}>
            Try again
          </Button>
        </>
      ) : incomplete ? (
        "Add both names and the date to save"
      ) : dirty ? (
        <>
          Unsaved changes
          <Button variant="ghost" size="sm" onClick={onSave}>
            Save now
          </Button>
        </>
      ) : saved ? (
        "Saved"
      ) : (
        "Saves automatically"
      )}
    </div>
  );
}

/**
 * The card beside the form on desktop, a tab on phones, and a full-screen view from either.
 * Tapping a part of the card jumps to the field that controls it.
 */
function Preview({
  card,
  activeField,
  onFieldClick,
  visibleOnMobile,
}: {
  card: Card;
  activeField: CardField | null;
  onFieldClick: (field: CardField) => void;
  visibleOnMobile: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <section
        aria-label="Card preview"
        className={`min-w-0 lg:sticky lg:top-20 lg:block lg:self-start lg:max-h-[calc(100svh-6rem)] ${visibleOnMobile ? "" : "hidden"}`}
      >
        <div className="mx-auto flex w-full max-w-[34rem] items-center justify-between gap-4 lg:max-w-none">
          <h2 className="font-display text-base font-semibold tracking-[-0.01em]">Preview</h2>
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
            View larger
          </Button>
        </div>
        <div className="mx-auto mt-2 w-full max-w-[34rem] rounded-lg shadow-[0_18px_40px_-16px_oklch(0.26_0.035_40/0.45)] lg:max-w-none">
          <GoldenCallerCard
            card={card}
            forceOpen
            maxWidth="100%"
            activeField={activeField}
            onFieldClick={onFieldClick}
            hideUnpicked
          />
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Tap any part of the card to edit it.
        </p>
      </section>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Invitation preview"
          className="fixed inset-0 z-50"
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setOpen(false)}
            className="absolute inset-0 w-full cursor-default bg-foreground/50 backdrop-blur-[2px]"
          />
          <div className="pointer-events-none absolute inset-0 grid place-items-center p-4 sm:p-8">
            <div className="pointer-events-auto grid w-full max-w-[min(94vw,42rem)] gap-3">
              <div className="flex items-center gap-3 text-background">
                <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <span className="text-sm font-medium">Preview</span>
              </div>
              <div className="grid place-items-center overflow-y-auto rounded-lg shadow-2xl">
                <GoldenCallerCard card={card} forceOpen maxWidth={LARGE_PREVIEW_MAX_WIDTH} hideUnpicked />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
