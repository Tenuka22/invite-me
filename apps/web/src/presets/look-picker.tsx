import { Fieldset, RadioGroup } from "@/components/ui";

import { type Look, type LookOption, resolveLook } from "./look";

/** Renders every look option a preset declares; nothing here is preset-specific. */
export function LookPicker({
  options,
  look,
  onChange,
}: {
  options: readonly LookOption[];
  look: Look | undefined;
  onChange: (next: Look) => void;
}) {
  const current = resolveLook(options, look);
  return (
    <div className="grid gap-6">
      {options.map((option) => (
        <Fieldset key={option.key} legend={option.label} description={option.hint}>
          <RadioGroup
            aria-label={option.label}
            columns={2}
            value={current[option.key]!}
            onValueChange={(value) => onChange({ ...current, [option.key]: value })}
            options={option.choices.map((c) => ({ value: c.value, label: c.label }))}
          />
        </Fieldset>
      ))}
    </div>
  );
}
