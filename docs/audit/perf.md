# Performance audit

Measured 2026-11-26. Production numbers come from this machine (TCP connect to workers.dev is ~260 ms, so one round trip is ~260 ms; every new connection costs about 3 round trips). Dev numbers come from the local stack in headless Chromium.

## Findings

| # | Cause | Evidence | Fix | Estimated gain |
|---|-------|----------|-----|----------------|
| 1 | Router held a skeleton for at least 250 ms on every navigation (`defaultPendingMs: 0`, `defaultPendingMinMs: 250`), even when data was already cached | `apps/web/src/router.tsx` | Applied: `pendingMs 400`, `pendingMinMs 0` | 250 ms off every client navigation, no skeleton flash |
| 2 | Hover/touch preloads were thrown away (`defaultPreloadStaleTime: 0`), so the click refetched what intent had just loaded | router.tsx | Applied: 30 s | one fewer round trip per intent-then-click |
| 3 | Template modal boots the whole app a second time in an iframe (same origin, same main thread) while the modal animates | Opening a template modal: p95 frame 41.7 ms, worst frame 450 ms, 13 frames over 33 ms, 5 long tasks (258, 59, 94, 349, 187 ms) in 3.5 s. Scrolling the same page: p50 8.3 ms, worst 50 ms, 1 long task | NOT applied (file owned by another agent): see "Recommended" 1 | removes ~1 s of main-thread work from the open animation |
| 4 | `ensureClient` ran one D1 query before every host procedure | `packages/api/src/invites/store.ts` | Applied: per-isolate `Map<userId, clientId>` | 1 sequential D1 round trip off every host call (list, get, save, parties, meter) |
| 5 | Write procedures re-read what they had just written (create 2 queries, save 3, markShared 3, revoke 3, createParty 3, delete 3) | store.ts | Applied: `INSERT/UPDATE ... RETURNING`; delete is one `db.batch` | create/save/markShared/revoke: 1 query, createParty 2, delete 1 round trip |
| 6 | Guest `resolve` did 4 sequential steps: session lookup, rate-limit write, party read, event read | guest.ts, context.ts, store.ts | Applied: guest calls skip the session lookup; party and event come from one LEFT JOIN; the rate-limit write runs in parallel with the read. 4 sequential steps become 1 parallel pair. `recordOpen` and `rsvp` also lose the extra event read | a D1 round trip is the dominant cost server side, so guest open is ~2 round trips cheaper |
| 7 | Skeleton shimmer animated `background-position` (repaints every block every frame, main thread) | `.sk` in index.css | Applied: highlight is an `::after` layer moved with `transform` (compositor) | skeleton pages no longer cost paint per frame |
| 8 | Toast stack used `backdrop-blur-xl` | `animated-toast-stack.tsx` | Applied: removed (bg is already 95% opaque) | no blur composite while a toast is on screen |
| 9 | Login blocks on its `loader: fetchMethods`: `/api/methods` takes 500 ms (339 ms to 836 ms) on production before the page can render | prod /login: FCP 888 ms, `methods` resource 339 to 836 ms | NOT applied (routes/login.tsx not mine): see Recommended 2 | ~500 ms to first paint of the sign-in page |
| 10 | Host home renders a skeleton until `invitations.list` returns, though the templates are bundled and need no data | `apps/web/src/routes/index.tsx`: `if (!list.data) return <HomeSkeleton/>` | NOT applied (not mine): see Recommended 3 | removes a full API round trip (~0.5 s on prod) from the time to content |
| 11 | `meter.get` and `parties.list` both poll every 10 s and both run `listParties` | host-meter.tsx, guest-manager.tsx | NOT applied: see Recommended 4 | halves poll traffic and D1 reads |
| 12 | API and web live on different workers.dev origins: every first host visit pays DNS+TCP+TLS to a second host (~3 round trips, ~0.5 s here) plus preflight for JSON POSTs (preflight now cached 24 h) | curl: conn 0.26 s, tls 0.34 s, ttfb 0.40 s on both hosts | Recommended 5 | ~0.5 s on the first API call |

## Bundle (production build, apps/web/dist/client/assets)

| Chunk | Raw | Gzip | What is in it (source-map attribution) |
|-------|-----|------|-----------------------------------------|
| `index-*.js` (entry) | 474 KB | 147 KB | react-dom 627 KB source, zod 371 KB source, @tanstack/query-core, seroval, router, better-auth, the `_auth` layout, @orpc/client |
| `createLucideIcon-*.js` | 236 KB | 79 KB | Misnamed shared chunk. It is NOT lucide (11 KB source). It is motion-dom 488 KB, @tanstack/router-core 147 KB, tailwind-merge 106 KB, framer-motion 68 KB |
| `venue-map-leaflet-*.js` | 153 KB | 44 KB | leaflet. Lazy: only loads where a map shows. Correct |
| `presets-*.js` | 51 KB | 17 KB | the two designs. Lazy |
| CSS `index-*.css` | 73 KB | 13.5 KB | Tailwind plus 10 `@font-face` (Fraunces, Inter, DM Sans), `font-display: swap`, unicode-range subsets so latin-ext/cyrillic only download when used |

Route code is split per route (login, edit, new, print, profile, `_id`, etc.) and the per-route CSS is separate. Leaflet and presets are lazy. Production `/preview/beira-dusk`: TTFB 542 ms, FCP 1.10 s, load 1.24 s; 16 resources all fetched in parallel off modulepreload hints. Production `/login`: FCP 888 ms, of which ~500 ms is the `methods` call. Public fonts loaded on preview are only the three latin woff2 files for the design.

Nothing is wrong with bundling beyond size: zod (~60 KB min) and motion (~80 KB gz) are the real weight, and both are legitimately used by every host page. The entry is 147 KB gzip; on a slow phone that is ~0.3 to 0.6 s of parse, not seconds.

## Request waterfall, logged-in host (what blocks content)

1. HTML (TTFB ~0.4 to 0.55 s prod) -> entry + CSS (parallel)
2. hydrate -> `_auth`/index `beforeLoad` -> `get-session` (one cross-origin round trip, plus its own connection setup ~0.5 s) [cached 60 s afterwards]
3. route component mounts -> `invitations.list` (second sequential round trip; the routes have no `loader`, so the query starts only after the session answers and the component mounts)
4. thumbnails render locally (no requests); the modal iframe boots a second app instance (finding 3)

Server side per host request before: session lookup + `ensureClient` + the real query = 3 sequential D1 reads. After: session (cookie cache) + one query on warm isolates.

## Applied D1 query counts (sequential round trips)

| Procedure | Before | After |
|-----------|--------|-------|
| invitations.list / get | 2 (+session) | 1 |
| invitations.create | 3 | 1 |
| invitations.save | 4 | 1 |
| invitations.remove | 4 | 1 (batch) |
| parties.list / meter.get | 2 | 1 |
| parties.create | 4 | 2 |
| parties.markShared / revoke | 4 | 2 |
| guest.resolve | 3 + session + throttle write (sequential) | 1 join, parallel with throttle write |
| guest.recordOpen | 4 | 2 |
| guest.rsvp | 5 | 3 |

(The first request per user per isolate still pays one extra `ensureClient` read.)

## Recommended (outside my files)

1. `apps/web/src/components/template-modal.tsx` lines 24 to 30 and 102: stop booting an iframe for the modal preview. The designs are already in the bundle (the Thumb is rendered on the home page). Render `presetFor(preset)` art directly with `sampleCard(preset)` in the modal. If an iframe must stay, mount it only after the modal morph ends (not at open) and keep `?lite=1`.
2. `apps/web/src/routes/login.tsx` line 25 (`loader: fetchMethods`): render the sign-in buttons immediately and resolve `methods` with `useQuery` (or hide unavailable providers after it lands). Removes ~500 ms from first paint.
3. `apps/web/src/routes/index.tsx` HomePage: render the template grid at once and show the "Your invitations" skeleton only for that section; it needs no data for the grid. Start `invitations.list` from `beforeLoad`/`loader` with `context.queryClient.ensureQueryData` in parallel with `getSession()` instead of after it.
4. `host-meter.tsx`: derive the meter on the client from the `parties.list` result with `computeMeter` (pure function in `@invite-me/api/invites/meter`), remove the `meter.get` poll. One request every 10 s instead of two.
5. Infra (do not change credentials): serve the API under the web origin (route `/rpc/*` and `/api/*` through the web worker or a custom domain with both workers) so the first call reuses the open connection and needs no CORS. Also pin D1 near the users: set a location hint (apac for Sri Lanka) when creating the database and enable D1 read replication; use the D1 Sessions API (`db.withSession`) for reads. Worker placement defaults to the edge that receives the request, so each D1 round trip crosses to the D1 primary; this is why cutting sequential queries matters most. `packages/infra/alchemy.run.ts` sets neither.
