import {
  CONNECTORS,
  type Card,
  HOST_MODES,
  type HostMode,
  OCCASION_PHRASES,
  REQUEST_PHRASES,
} from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { Card as Panel, CardContent } from "@invite-me/ui/components/motion/card";
import { Input } from "@invite-me/ui/components/motion/input";
import { RadioGroup, RadioGroupItem } from "@invite-me/ui/components/motion/radio";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@invite-me/ui/components/motion/select";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";

import { orpc } from "@/utils/orpc";

export function Text({
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
  return <Input label={label} type={type} placeholder={placeholder} maxLength={max} value={value} onChange={onChange} />;
}

/** A labelled group inside a step. */
export function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-lg font-[Fraunces_Variable,Fraunces,Georgia,serif]">{title}</legend>
      {hint ? <p className="-mt-2 text-sm text-muted-foreground">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

const HOST_CHOICES: Record<HostMode, { label: string; hint: string }> = {
  parents: { label: "Both parents", hint: "One line for the couple's parents, like Mr. & Mrs. Perera" },
  parent: { label: "One parent", hint: "A single parent, like Mrs. Perera" },
  families: { label: "Two families", hint: "Both sides named, joined by a word like together with" },
  host: { label: "A host or family", hint: "Someone else is inviting, like The Perera Family" },
  none: { label: "No host", hint: "The card opens with the couple's names" },
};

const HOST_PLACEHOLDER: Record<HostMode, string> = {
  parents: "Mr. & Mrs. Perera",
  parent: "Mrs. Perera",
  families: "Mr. & Mrs. Silva",
  host: "The Perera Family",
  none: "",
};

/** Who is inviting. Pick the shape first; only the lines that shape needs are shown. */
export function HostFields({ card, set }: { card: Card; set: <K extends keyof Card>(key: K, value: Card[K]) => void }) {
  const mode = card.hostMode;
  return (
    <div className="grid gap-6">
      <Group title="Who is inviting?">
        <RadioGroup
          aria-label="Who is inviting"
          value={mode}
          onValueChange={(v) => set("hostMode", v as HostMode)}
          className="gap-2"
        >
          {HOST_MODES.map((m) => (
            <RadioGroupItem key={m} value={m} label={HOST_CHOICES[m].label} description={HOST_CHOICES[m].hint} />
          ))}
        </RadioGroup>
      </Group>

      {mode === "none" ? null : (
        <Group title={mode === "families" ? "Names" : "Name"}>
          <Text
            label={mode === "families" ? "First family" : HOST_CHOICES[mode].label}
            placeholder={HOST_PLACEHOLDER[mode]}
            value={card.hostLine1}
            max={80}
            onChange={(v) => set("hostLine1", v)}
          />
          {mode === "families" ? (
            <>
              <div className="grid gap-1.5">
                <p className="px-1 text-sm font-medium">Joined by</p>
                <Choice
                  value={card.connector}
                  options={[...CONNECTORS]}
                  onChange={(v) => set("connector", v)}
                  allowCustom={false}
                  label="Joining word"
                />
              </div>
              <Text
                label="Second family"
                placeholder={HOST_PLACEHOLDER.families}
                value={card.hostLine2}
                max={80}
                onChange={(v) => set("hostLine2", v)}
              />
            </>
          ) : null}
        </Group>
      )}

      <Group title="Wording" hint="Leave on Automatic and the card picks wording that fits your choice.">
        <div className="grid gap-1.5">
          <p className="px-1 text-sm font-medium">The invitation</p>
          <Choice value={card.requestLine} options={[...REQUEST_PHRASES]} onChange={(v) => set("requestLine", v)} label="Invitation wording" />
        </div>
        <div className="grid gap-1.5">
          <p className="px-1 text-sm font-medium">The occasion</p>
          <Choice value={card.occasionLine} options={[...OCCASION_PHRASES]} onChange={(v) => set("occasionLine", v)} label="Occasion wording" max={160} />
        </div>
      </Group>
    </div>
  );
}

const AUTO = "__auto";
const CUSTOM = "__custom";

/** Pick ready-made wording, leave it on automatic, or write your own. */
function Choice({
  value,
  options,
  onChange,
  label,
  max = 120,
  allowCustom = true,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  label: string;
  max?: number;
  allowCustom?: boolean;
}) {
  const matches = options.includes(value);
  const [custom, setCustom] = useState(Boolean(value) && !matches);
  const current = custom ? CUSTOM : value === "" ? AUTO : matches ? value : CUSTOM;
  const sentence = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
  return (
    <div className="grid gap-2">
      <Select
        value={current}
        onValueChange={(v) => {
          if (v === AUTO) {
            setCustom(false);
            onChange("");
          } else if (v === CUSTOM) {
            setCustom(true);
          } else {
            setCustom(false);
            onChange(v);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={AUTO}>{allowCustom ? "Automatic" : "Nothing"}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {sentence(o)}
            </SelectItem>
          ))}
          {allowCustom ? <SelectItem value={CUSTOM}>Write my own</SelectItem> : null}
        </SelectContent>
      </Select>
      {current === CUSTOM ? (
        <Input label="Your wording" maxLength={max} value={value} onChange={onChange} />
      ) : null}
    </div>
  );
}

/** Paste a Google Maps link; the server reads the coordinates so guests see a map. */
export function MapsLinkField({
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
            ? "Map pinned. Guests can open it in Google Maps."
            : "In Google Maps, open the venue, tap Share, then Copy link, and paste it here. Optional."}
      </p>
    </div>
  );
}

/** A short list the host can grow, shown as rows with one remove button each. */
export function ListEditor<T>({
  addLabel,
  max,
  min = 0,
  items,
  empty,
  onChange,
  render,
}: {
  addLabel: string;
  max: number;
  min?: number;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  render: (item: T, update: (next: T) => void) => ReactNode;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item, i) => (
        <Panel key={i} variant="muted" size="compact">
          <CardContent className="grid gap-3">
            {render(item, (next) => onChange(items.map((x, j) => (j === i ? next : x))))}
            {items.length > min ? (
              <Button type="button" size="lg" variant="ghost" className="justify-self-start" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                Remove
              </Button>
            ) : null}
          </CardContent>
        </Panel>
      ))}
      {items.length < max ? (
        <Button type="button" size="lg" variant="outline" className="btn-xl btn-xl-outline justify-self-start" onClick={() => onChange([...items, empty])}>
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}
