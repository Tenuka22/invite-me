import { createFileRoute } from "@tanstack/react-router";
import { Copy, Inbox, MoreHorizontal, Pencil, Printer, Share2, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";

import { toast } from "@/components/toaster";
import {
  Accordion,
  AccordionItem,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
  Avatar,
  Badge,
  Button,
  Checkbox,
  Collapsible,
  Dialog,
  DialogContent,
  DialogTrigger,
  EmptyState,
  Field,
  Fieldset,
  FilterChips,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  NumberField,
  PageHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  SegmentedControl,
  Select,
  Skeleton,
  Switch,
  Tab,
  Tabs,
  TabsList,
  TabsPanel,
  Textarea,
  Tooltip,
  TooltipProvider,
} from "@/components/ui";

/** Every primitive in every state. Not linked from the app; here for review and regression checks. */
export const Route = createFileRoute("/design")({
  ssr: false,
  head: () => ({ meta: [{ title: "Design system" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: DesignPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-border pt-6">
      <h2 className="text-section">{title}</h2>
      {children}
    </section>
  );
}

function DesignPage() {
  const [size, setSize] = useState("a5");
  const [who, setWho] = useState("couple");
  const [seats, setSeats] = useState(2);
  const [on, setOn] = useState(true);
  const [checked, setChecked] = useState(false);
  const [filter, setFilter] = useState("all");
  const [pick, setPick] = useState<string | null>(null);
  const [radio, setRadio] = useState("adult");
  return (
    <TooltipProvider>
      <div className="host-app min-h-dvh">
        <main className="mx-auto grid w-full max-w-3xl gap-8 px-4 py-8">
          <PageHeader title="Design system" description="Tokens and primitives, in every state." />

          <Section title="Colour roles">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {["background", "surface", "surface-raised", "border", "primary", "accent-gold", "success", "warning", "danger"].map((c) => (
                <div key={c} className="grid gap-1 text-label">
                  <div className="h-12 rounded-xl border border-border" style={{ background: `var(--${c})` }} />
                  {c}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Type">
            <h1 className="text-display">Page title, Fraunces</h1>
            <h2 className="text-section">Section title, Fraunces</h2>
            <p>Body text is Inter at 16px or larger, with comfortable line height for every age.</p>
            <p className="text-label font-medium">Label, 14px medium</p>
            <p className="text-text-muted">Muted text keeps 4.5:1 on the ivory background.</p>
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" icon={<Share2 className="size-5" aria-hidden />}>With icon</Button>
              <Button variant="primary" loading>Saving</Button>
              <Button variant="secondary" disabled>Disabled</Button>
              <Tooltip content="Copy link">
                <Button variant="secondary" size="icon" aria-label="Copy link"><Copy className="size-5" aria-hidden /></Button>
              </Tooltip>
            </div>
          </Section>

          <Section title="Badges">
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Confirmed</Badge>
              <Badge tone="warning">Maybe</Badge>
              <Badge tone="danger">Declined</Badge>
              <Badge tone="info">Awaiting reply</Badge>
              <Badge tone="neutral">Not opened</Badge>
            </div>
          </Section>

          <Section title="Fields">
            <Field label="Name" description="As you would write it on the envelope."><Input placeholder="e.g. Nimal Perera" /></Field>
            <Field label="Seat label" optional><Input placeholder="e.g. Table 4" /></Field>
            <Field label="Date" error="Choose a date that has not passed."><Input defaultValue="2020-01-01" /></Field>
            <Field label="Note" optional><Textarea placeholder="e.g. No whites" /></Field>
            <Fieldset legend="Who are they?">
              <RadioGroup aria-label="Who are they?" value={radio} onValueChange={setRadio} columns={2} options={[
                { value: "teen", label: "Teen" }, { value: "adult", label: "Adult" }, { value: "elder", label: "Elder", description: "Larger text on their page" }, { value: "family", label: "Family" },
              ]} />
            </Fieldset>
            <Select aria-label="Hosts" value={pick} onValueChange={setPick} placeholder="Who is hosting?" options={[
              { value: "parents", label: "Both families" }, { value: "bride", label: "Bride's parents" }, { value: "groom", label: "Groom's parents" },
            ]} />
            <SegmentedControl aria-label="Paper size" value={size} onValueChange={setSize} options={[{ value: "a6", label: "A6" }, { value: "a5", label: "A5" }, { value: "a4", label: "A4" }]} />
            <SegmentedControl aria-label="Seats" value={who} onValueChange={setWho} options={[{ value: "single", label: "Single" }, { value: "couple", label: "Couple" }, { value: "group", label: "Group" }]} />
            <NumberField label="Seats" value={seats} onValueChange={setSeats} min={1} max={50} />
            <Switch checked={on} onCheckedChange={setOn} label="Bleed and crop marks" description="For print shops that ask for them." />
            <Checkbox checked={checked} onCheckedChange={setChecked} label="Remember this choice" />
            <FilterChips aria-label="Filter guests" value={filter} onValueChange={setFilter} options={[{ value: "all", label: "All" }, { value: "yes", label: "Confirmed" }, { value: "wait", label: "Awaiting" }]} />
          </Section>

          <Section title="Overlays">
            <div className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger render={<Button variant="secondary" />}>Dialog / sheet</DialogTrigger>
                <DialogContent title="Add guest" description="A sheet on phones, a dialog from tablet up." footer={<><Button variant="ghost">Cancel</Button><Button variant="primary">Add guest</Button></>}>
                  <div className="grid gap-4"><Field label="Name"><Input placeholder="e.g. Nimal Perera" /></Field></div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="danger" icon={<Trash2 className="size-5" aria-hidden />} />}>Delete</AlertDialogTrigger>
                <AlertDialogContent title="Delete this invitation?" description="Its guest links stop working. This cannot be undone." confirmLabel="Delete invitation" onConfirm={() => toast.success("Deleted")} />
              </AlertDialog>
              <Menu>
                <MenuTrigger render={<Button variant="secondary" size="icon" aria-label="More actions" />}><MoreHorizontal className="size-5" aria-hidden /></MenuTrigger>
                <MenuContent>
                  <MenuItem><Pencil className="size-5" aria-hidden />Edit</MenuItem>
                  <MenuItem><Printer className="size-5" aria-hidden />Print or PDF</MenuItem>
                  <MenuSeparator />
                  <MenuItem danger><Trash2 className="size-5" aria-hidden />Delete</MenuItem>
                </MenuContent>
              </Menu>
              <Popover>
                <PopoverTrigger render={<Button variant="secondary" />}>Popover</PopoverTrigger>
                <PopoverContent title="Link"><p className="text-label break-all">https://example.com/i/abc</p></PopoverContent>
              </Popover>
              <Button variant="secondary" onClick={() => toast.success("Saved", { description: "Your changes are safe." })}>Toast</Button>
              <Button variant="secondary" onClick={() => toast.success("Guest removed", { action: { label: "Undo", onClick: () => toast.info("Restored") } })}>Undo toast</Button>
              <Button variant="secondary" onClick={() => toast.error("Could not save", { description: "Check your connection and try again." })}>Error toast</Button>
            </div>
          </Section>

          <Section title="Disclosure and navigation">
            <Tabs defaultValue="a">
              <TabsList className="w-full"><Tab value="a">Details</Tab><Tab value="b">Schedule</Tab></TabsList>
              <TabsPanel value="a" className="pt-3">Details panel</TabsPanel>
              <TabsPanel value="b" className="pt-3">Schedule panel</TabsPanel>
            </Tabs>
            <Collapsible label="More options"><Field label="Seat label" optional><Input placeholder="e.g. Table 4" /></Field></Collapsible>
            <Accordion>
              <AccordionItem value="1" title="What does Awaiting reply mean?">The guest opened the link but has not answered.</AccordionItem>
              <AccordionItem value="2" title="What does Not opened mean?">The link was shared but never opened.</AccordionItem>
            </Accordion>
          </Section>

          <Section title="Status and feedback">
            <Progress value={2} max={5} label="Seats confirmed"><p className="font-semibold">2 of 5 seats confirmed</p></Progress>
            <div className="flex items-center gap-3"><Avatar name="Nimal Perera" /><Avatar name="Sanduni" size={56} /></div>
            <Skeleton className="h-16 w-full" />
            <EmptyState icon={Inbox} title="No guests yet" description="Add your first guest to get their personal link." action={<Button variant="primary">Add guest</Button>} />
            <EmptyState title="We could not load this" description="Check your connection, then try again." action={<Button variant="secondary">Retry</Button>} />
          </Section>
        </main>
      </div>
    </TooltipProvider>
  );
}
