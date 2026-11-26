# InviteMe UI audit

Method: walked every route at 375x667 (mobile), 768x1024 (tablet), 1440x900 (desktop) against a local stack (Vite web on :3001, the server Worker on :3000 under `wrangler dev` with local D1). Screenshots: `before/`, `after/`, and `prod/` (deployed build).

## 0. Deployed build is not this repo

`https://invite-me-web-prod-…workers.dev` serves a different app: `/` is a marketing page, login is Google/GitHub only, and `/dashboard`, `/parties`, `/card` return "Page not found". The repo has anonymous start, email-code login, passkeys, dashboard, guests, card. **Redeploy before judging prod.** Prod also showed a skeleton for ~6 s on `/login` before content, and its `/prototype/golden-caller` was public.

## 1. Route and option map

| Route | Who | Options / states |
|---|---|---|
| `/` | anyone | Creates an anonymous session, redirects to `/dashboard`. |
| `/login` | anyone | Log in / Create account toggle. Email code (send, verify, "use a different email"), Google, passkey (login only). Sign-up asks for a name, then creates a passkey. |
| `/dashboard` | host | Meter (confirmed/allotted, opened, maybe, no, not opened, not shared), links to Guests and Card. |
| `/parties` | host | Add guest: name, Single (1) / Couple (2) / Group (1-50), seat label, note. List: RSVP state, seats, opens, link, Copy link, Revoke. |
| `/card` | host | Hosts lines, names, date, times, sub-events (max 5), venue, city, RSVP contacts (1-5), rules, live preview, Save. |
| `/profile` | host | Name, email, add passkey, sign out / log in. |
| `/i/:client/:token` | guest | Closed cover with OPEN seal, opened card, Close card, RSVP Yes / Maybe / No with head count, seat, rules. Bad or revoked token shows "not available". |
| `/prototype/golden-caller` | dev | Design scratchpad. |

## 2. Findings and status

| # | Type | Finding | Status |
|---|---|---|---|
| 1 | Bug | Parallel tabs on a fresh browser: `/` showed "Anonymous users cannot sign in again anonymously". | Fixed: re-reads the session; friendly error otherwise |
| 2 | Inconsistency | Router and Query devtools shipped to every visitor, including guests. | Fixed: dev only |
| 3 | Inconsistency | Page title "My App". | Fixed: "InviteMe" / "You're invited" |
| 4 | Inconsistency | Raw `<input>`, `<select>`, `<textarea>`, `<button>`, `<progress>`, `<a>` in all host pages and the guest RSVP, not BEUI. | Fixed: BEUI Input, RadioGroup, AdaptiveStepper, Button/StatefulButton, Tabs, Card, AnimatedNumber, AnimatedBadge, Alert, Loader, Toast |
| 5 | Layout | `/card` overflowed horizontally on mobile (390 vs 375): two-column input grids. | Fixed |
| 6 | Wasted space | Dashboard meter: 4+2 orphan grid at tablet, tiny numbers, no "large meter" from the product doc. | Fixed: large number, bar, 5-up stats |
| 7 | Wasted space | Guests: add form pushed the list below the fold; narrow 768px column on 1440. | Fixed: two columns on desktop, Guests / Add tabs on mobile |
| 8 | Wasted space | Card editor on mobile: preview 2000 px below the form. | Fixed: Edit / Preview tabs; sticky preview on desktop; sticky Save bar on mobile |
| 9 | UX | Guest list oldest-first; new guest landed below. | Fixed: newest first |
| 10 | UX | Add form kept seat label, notes, group size after submit. | Fixed: resets |
| 11 | Validation | Group size accepted 9999 (server rejected with toast); RSVP count accepted 0 or over the limit. | Fixed: steppers clamp |
| 12 | Bug | Guest RSVP used the seat label as the head-count field label ("Hall B"). | Fixed: "Seat: Hall B" shown separately |
| 13 | UX | RSVP: no selected state, raw "(now: maybe)", ambiguous toast. | Fixed: selected button, pending state |
| 14 | UX | Revoke fired immediately, no confirm. | Fixed: two-step confirm |
| 15 | UX | Copy link gave only a toast. | Fixed: button shows Copied |
| 16 | Spec gap | Guest page lacked the footer (InviteMe, "Built by Tenu22"). | Fixed |
| 17 | Layout | Guest link wrapped over 3 lines. | Fixed: one-line truncate with title |
| 18 | UX | No sign-out anywhere; anonymous profile showed `…@anonymous.placeholder.invalid`. | Fixed: Profile has Sign out / Log in; placeholder email hidden |
| 19 | UX | 404 was bare "Not Found" without navigation; errors were a raw screen. | Fixed: NotFound and RouteError with retry |
| 20 | Design | Borders (oklch .95 on white) barely visible; `--color-success`, `--color-error`, `--color-border-strong` undefined, so "revoked" text and Input success had no colour. | Fixed in `globals.css` |
| 21 | UX | Toasts at bottom-right covered the Add guest button and devtools. | Fixed: top-right |
| 22 | UX | Login: code field took letters and any length; "Invalid OTP"; "Enter your name" appeared while typing the email. | Fixed |
| 23 | Security/UX | `/prototype/golden-caller` public in production. | Fixed: 404 outside dev |
| 24 | Scope | Couple photo feature (upload, background removal, R2 route, preset slot). | Removed per request |

## 3. Open items (not changed)

- **Google button always shows**, even when the server has no Google credentials; clicking gives "Provider not found". Needs a server flag.
- **Blank card lines save** (no `min(1)` in `cardSchema`), so Host line 1 can be empty on the card.
- **Anonymous data is not carried over** when the host later logs in; the account switches to a new, empty one.
- **Notes/rules are single-line** now (BEUI has no textarea); existing multi-line text is flattened when edited.
- **Opened-card desktop layout** is a full-width gold slab by preset design (closed cover about 1400 px tall at 1440). The preset CSS keys off viewport width, so boxing it needs a design decision.
- **Landing at `/profile` after login** while `/` goes to `/dashboard`.
- DB column `event.couple_image_key` is now unused; dropping needs a migration. `bun.lock` still lists `@imgly/background-removal` until the next `bun install`.

## 4. Guest page v2 (golden caller)

All preset customisation lives in `apps/web/src/presets/traditional-golden-caller/`: `config.ts` declares the options (backdrop, floating effect, scroll motion), `guest-theme.css` and `guest-shell.tsx` implement them, `look-picker.tsx` renders them in the editor. The API stores only `card.look` (option to value). The card component and `golden-caller.css` are unchanged.

- Page, not cards: the golden-caller card is now `GoldenPage` (`guest-shell.tsx`, `page.css`): sealed cover, then full-bleed scenes (hosts, couple, date, venue with live countdown, RSVP), dot-nav, progress line, floating effects. `card.tsx` and `golden-caller.css` were removed; mandala styles moved to `mandala.css`. The editor preview is the same page embedded in a scroll box.
- Themed controls: BEUI buttons restyled to the card's gold, serif and caps; RSVP wording "Joyfully yes / Maybe / Can't".
- Practical: add-to-calendar (.ics), open-in-maps, floating RSVP pill until answered, reading-progress line.
- Performance: route loader starts the invitation request before mount (client only, since an SSR fetch would share one IP rate-limit bucket), 5-minute query cache, preconnect to the API, font preload, `defaultPreload: "intent"`, the card's own Cormorant Garamond now actually loads (it was falling back to Georgia).
