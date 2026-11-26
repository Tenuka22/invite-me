# Changelog

## Host app redesign

### Design system
- Tokens (colour roles, radii pill/xl/2xl/3xl, shadows, type scale, motion) in `apps/web/src/styles/tokens.css`; values are the app's existing ivory / terracotta / brown / gold, named by role. Primary is 0.02 darker and muted, placeholder and gold-text roles were added for WCAG AA.
- Base UI primitives in `apps/web/src/components/ui/` (Dialog/sheet, AlertDialog, Menu, Popover, Tooltip, Tabs, Select, RadioGroup, SegmentedControl, FilterChips, Switch, Checkbox, NumberField, Field/Fieldset, Collapsible, Accordion, Progress, Avatar, Toast, Button, Badge, EmptyState, Skeleton, PageHeader). Showcase at `/design`.
- `cn` knows the custom type scale so `text-body` no longer drops text colours.

### Moved
| Was | Now |
|---|---|
| Floating dock + "+" FAB, `pt-24`/`pb-44` page hacks | One shell: top bar, tab bar below md, `FlowBar` for focused tasks; pages never pad |
| Home as template catalogue | Home shows your invitations (names, date, venue, replies, status, menu); templates are in the New invitation dialog; empty state shows templates |
| Contradictory stats | One headline ("2 of 8 seats confirmed") + progress, one status set with definitions |
| Raw URL in every guest row | Copy and Share icon buttons; link in a dialog from the row menu |
| Long add-guest form | Dialog/sheet: name, seats, who they are; "More options"; success state with link |
| 5-step edit wizard | One preview-first screen, Customize rows opening dialogs, hosts as a Select with concrete roles, autosave |
| Print page of radio cards | Print dialog (size, direction, marks, preview at paper ratio) with Download PDF (server) and Print |
| Four different card renderings | One `InvitationCard` (real artwork, scaled) everywhere; per-design thumbnail components removed |
| Guests could change the design | Only the owner changes the design |
| Card copy bugs | Shared helpers: possessives, one time format ("9:28 PM to 1:28 AM"), year kept with the date, no stray spaces before commas; deterministic, clipped decoration; soft blobs removed in print and previews |

### Known gaps
- Guests cannot be edited or removed individually: the API only has revoke. Revoke (with confirmation) is the only removal.
- Authenticated screens were checked against a mock API at 390 and 1280px, not against the live backend.
