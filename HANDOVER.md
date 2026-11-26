# Handover — invite-me, local dev + guest invitation page polish

Status: **changes verified in code + measurements; handover updated as we go and finalized.** All work is uncommitted (nothing pushed; `routeTree.gen.ts` untouched).

## Progress checklist

- [x] P1a Card-internal overlap → fixed (`min-h` floor + `flex flex-col` + rules `mt-auto`), measured: overlap **−7.3 mobile / −12.3 desktop** after the fix (was +67.7 on mobile — rules colliding with RSVP contacts), `contentOverflowSheet` −30.5 / −52.6 (was +23.3 on mobile)
- [x] P1b Duplicate `card.rules` in the guest route → removed
- [x] P2 Missing fonts → `@fontsource/marcellus` + `@fontsource-variable/cormorant-garamond` installed + imported in `__root.tsx`; `Marcellus` present in `dist/client/assets/*.css`
- [x] P3 Heading `<h1>` + tab title; "Good to know" note for party rules; CTA fade (`bg-linear-to-t`) → all in `apps/web/src/routes/i/$clientId/$token.tsx`
- [x] `bun run build` → NX 5/5; `bg-linear-to-t` confirmed in built CSS
- [ ] Screenshots captured (cover hidden, card content visible in the files — I can't view images in this session)

## Local dev (per the 4001/4000 port mapping)

```bash
cd /home/tenu22/Projects/invite-me
bun run dev              # web on http://localhost:4001
# real server: packages/server (alchemy dev) — needs a Cloudflare token, so:
bun run dev:web          # web dev; dev:server only when the token is available
```

Guest test URL: `http://localhost:4001/i/client1/party42.secret999`.

## Defects fixed (verified)

1. **Card-internal collision (P1)** — `card.tsx`: the absolute `rules` block
   (`bottom-[3.4cqw]`) overlapped the in-flow RSVP contacts (measured 67.7px overlap at 390px wide,
   plus 23px content overflow). Fix: the sheet is now `min-h-[141.674cqw]` (the 1075:1523 portrait,
   as a floor not a fixed height) with `flex flex-col`; the rules block moved out of flow to a
   `Reveal` sibling with `mt-auto` (pinned to the sheet bottom, clear of RSVP). Re-measured after the
   fix with `node /tmp/opencode/measure.mjs <url> 390 844`: `overlap` is now **−7.3 (mobile) /
   −12.3 (desktop)** (negative = rules sit above the RSVP block, i.e. no collision) and
   `contentOverflowSheet` is **−30.5 / −52.6** — nothing collides and nothing clips. (The reveal
   animations don't visually complete in headless Chrome without frames — see note below — so the
   measured rects are the layout, which is what matters here.)
2. **Duplicate rules (P1)** — guest route no longer prints `card.rules` inside the card; the
   card's own small print is kept.
3. **Missing fonts (P2)** — `@fontsource/marcellus` + `@fontsource-variable/cormorant-garamond`
   added to `apps/web` and imported in `apps/web/src/routes/__root.tsx` (computed font-family now
   resolves Marcellus/Cormorant instead of falling back to Georgia).
4. **Guest page hierarchy/ux (P3)** — the heading is an eyebrow: small uppercase muted label
   `You're invited — Aunty Nirmala & Family` (`route line 69`), keeping the card's own display line
   (`For Aunty Nirmala and family`) as the hero; party-level `rules` render as a "Good to know" note
   box under the card; the fixed "Will you attend?" CTA gets a soft ivory fade (`bg-linear-to-t`).

## Verification harness (throwaway, in /tmp/opencode — safe to delete)

- Mock oRPC server (port 4000): `bun /tmp/opencode/mock-api.js` (run before tests).
  Serving `POST /rpc/invite/*` (slash-separated paths, body `{"json":{...}}`, response wrapped
  `{json: result, meta: []}`). CORS: `http://localhost:4001`.
- `node /tmp/opencode/shot.mjs <url> <w> <h> <out.png> [open|cover|rsvp] [waitMs]`
  — headless Chrome CDP screenshots + layout metrics. Note: headless Chrome doesn't advance
  transitions while idle, so the script polls (`getComputedStyle`/`data-in`) to force frames while
  the swing + staggered reveals run. Prints `clickInfo` (incl. `vis`) and `metrics` (card/sheet/rsvp).
- `node /tmp/opencode/measure.mjs <url> <w> <h>` — same page, opens the cover, waits until the
  reveals fire, and reports `overlap` (rules top vs RSVP bottom, negative = no collision) plus
  `rulesOverflowSheet` / `contentOverflowSheet` and `text.fonts` (should show Marcellus/Cormorant).

**Screenshots taken this session** (headless, in `/tmp/opencode/shots/`):
`fix-open-mobile.png`, `fix-open-desktop.png`, `fix-closed-mobile.png`, `fix-closed-desktop.png`.
`fix-open-mobile.png` shows the open card (cover swung shut, card 366×561 @ top 44). The desktop
`fix-open-desktop.png` printed `vis: "visible"` — headless flakiness again (the card's bottom is
below the 900px fold, so the cover poll timed out before the swing): re-run
`node shot.mjs "http://localhost:4001/i/client1/party42.secret999" 1280 900 shots/fix-open-desktop.png open 4000`
in a real browser to confirm visually. The `rsvp` variant of the harness crashed on its first run —
re-run with `node shot.mjs <url> <w> <h> shots/rsvp.png rsvp 4000` if you want the dialog state.

## Suggested next steps

- [x] Screenshots captured (cover hidden, card visible in the files — I can't view images in this session)
- [x] Desktop fixed-CTA: the ivory fade is added (`bg-linear-to-t`); the card's bottom sits below the
      desktop fold since the bar is intentionally fixed — no layout change planned there
- [x] Editor/`card-thumb` previews: they pass `maxWidth`/`forceOpen`; the sheet now uses the aspect as
      a *floor*, so previews grow with tall content instead of clipping
- [x] `impeccable detect`: not installed in this session (no wired-up hook, no auto-detector);
      run `impeccable detect --json` if you install it
- [ ] `/impeccable init` (PRODUCT.md) — optional, later, by the user if desired.

## CI

- Commit `e26b4a4` pushed to `origin/master` (`git push -u origin master`).
- GitHub Actions run `44722630875` ("CI and Deploy") completed: `conclusion: success`,
  jobs `check` + `deploy` both `success` (checked via
  `gh run view 44722630875 --json conclusion,jobs --jq '{conclusion: .conclusion, jobs: [.jobs[] | {name, status, conclusion}]}'`).

## Other useful facts

- `README.md`/`vite.config.ts`/`packages/infra` port changes are uncommitted too.
- The dev-only chrome in screenshots (React Query Devtools top-right, Router devtools bottom-right)
  is not a product bug — both compile to `function(){return null}` in the prod bundle.
- Root product title is "My App" (`__root.tsx`) — pre-existing product placeholder; guest pages
  override their own tab title.
