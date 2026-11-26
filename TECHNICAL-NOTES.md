# Technical notes: architecture, interactive logic and design decisions

This file explains how Vistara is built and why. The last section answers the technical questions we expect to be asked.

## 1. Architecture

```
React 19 + Vite + Tailwind  (frontend/)          Express 5 + Sequelize 6  (backend/)
───────────────────────────────────────          ───────────────────────────────────
AuthContext (JWT, role) ──► axios instance ─────► /api/auth      JWT login, bcrypt
ProtectedRoute (role gate)       │                /api/dashboard/{admin,resident,guard}
AppLayout → Admin / Resident /   │                /api/walkins   approval state machine
            Guard shells         │                /api/incidents reports, SOS, resolve
Pages (lazy-loaded per route)    │                /api/qr        generate / validate / exit
                                 │                /api/logs, /api/passes, /api/admin …
                     demo adapter (VITE_DEMO)       MySQL / TiDB (TLS) · SQLite for local tests
                     same response shapes, in-browser
```

- **One codebase, three products.** Routes are guarded by role, and `AppLayout` picks a completely different layout per role: an admin sidebar, a resident top navigation, or a guard tablet rail. Each portal looks different to its users while sharing components, design tokens and API code.
- **Design tokens as the single source of colour.** Figma variables are exported to `tokens.json`, then turned into CSS variables by `build_tokens.py`, which Tailwind reads (`bg-brand`, `text-g-text`…). The guard app switches Night and Day mode by changing one attribute, `data-theme`, with no re-render of colour logic.
- **Code splitting.** Every page is `React.lazy`-loaded, so the guard tablet never downloads the admin charts.

## 2. Interactive logic and state (beyond static pages)

| Feature | Where | What makes it non-trivial |
|---|---|---|
| **Walk-in approval** | `WalkinWaiting.jsx`, `walkin.controller.js` | A server-side state machine: `pending → approved / denied / expired → admitted`. The guard screen checks the server every 3 s and shows a live countdown. The resident screen checks every 10 s. A request that runs out of time is marked expired the next time it is read, so no background job is needed. The guard can admit an expired request only with a written reason, which is saved on the pass. |
| **SOS hold-to-send** | `AppLayout.jsx → SosButton` | Press-and-hold with pointer and keyboard events, plus a fill animation. Releasing before 2 s cancels the send, which prevents accidental alerts. States are idle → holding → sent / failed, and the result is announced to screen readers. |
| **Live dashboards** | `pages/*/DashboardPage.jsx`, `dashboard.controller.js` | Each dashboard makes one combined request. The server groups the data by hour in Asia/Manila time, compares today with a 7-day average, ranks items by urgency and merges three sources into the scan table: entries, exits and refused scans. If the combined endpoint isn't available, the page falls back to the older endpoints. |
| **Refused-scan logging** | `qr.controller.js` | Every refused scan is recorded automatically, without changing the existing validation code paths. |
| **Demo mode** | `api/demo.js` | A replacement axios adapter answers every request in the browser, with the same response shapes as the real server. It includes a simulated resident who approves walk-ins after 8 s, so the static GitHub Pages site behaves like the real system. |
| **Theme and offline state** | `GuardShell` | The Night/Day choice is saved in `localStorage`, with a guard for when storage is unavailable. Browser `online`/`offline` events drive the status pill. When the connection drops, the last data stays on screen with a warning instead of an empty screen. |
| **Badge consistency** | `AdminShell`, `GuardShell` | Sidebar and rail badges are fetched from the same data as the dashboards and refreshed on every page change, so the numbers always agree. |
| **Document review** | `AdminPages.jsx → DocumentReview` | Submit stays disabled until all four checks are ticked. Reject or re-upload needs 10–300 characters of remarks. After a decision the reviewer moves straight to the oldest pending document, and "x of y" shows the queue position. |
| **Audit trail** | `api/demoHub.js` | Every add, edit, status change and delete on any record writes an audit entry (who, what, target, details), so the audit log reflects actions taken anywhere in the app. |
| **Patrol round** | `GuardPages.jsx → Patrol` | Checkpoints are scanned in order; each can be marked all clear or logged with an issue. Progress and the round's start time are saved, and the round is complete only when every checkpoint is done. |
| **Accessibility logic** | throughout | Direction and pass-type choices use radio groups, incident-report chips use `aria-pressed`, and nav links use `aria-current`. There's a keyboard shortcut (`/` focuses search), focus management (`#new-pass` focuses the form) and reduced-motion support. |

## 3. Key decisions and trade-offs

| Decision | Why | Trade-off |
|---|---|---|
| **Polling instead of WebSockets** for walk-ins and dashboards | Simple and works behind any host or proxy. A 3 s check is fast enough for a 3-minute approval window. | Uses more requests. Server-Sent Events or WebSockets would be the upgrade. |
| **Checking expiry when the request is read** instead of a scheduled job | No background worker, and it works on free hosting that sleeps when idle. | Expiry is recorded the next time someone reads the request. Users don't notice, because the countdown runs in the browser. |
| **One combined endpoint per dashboard** | One round trip per screen keeps it fast, and the screen gets data already shaped for it. | Each endpoint is tied to its screen's layout. |
| **Separate `ScanDenial` table** instead of reusing the activity log | Activity logs require a gate pass, and refused scans often have none, for example an unknown QR code. | One more table. |
| **CSS-variable tokens** instead of hard-coded Tailwind colours | Night/Day switching and future rebranding become one change. | Colours appear as token names, not hex, when reading the code. |
| **Demo adapter** instead of a mock server | The site works on free static hosting with no backend. | Two sets of response logic to keep in sync; they share the same shapes. |
| **The guard admits; the resident only approves** | The guard is physically at the gate, so the entry log stays accurate. Approval alone doesn't create an entry. | One extra tap for the guard. |

## 4. How AI was used (code generation, asset creation, debugging)

The prompt-by-prompt record is in `design-handoff/PROMPTS.md`. Highlights:

- **Code generation:**
  - the three role-based layouts and the three dashboards;
  - the walk-in, incident and dashboard controllers;
  - the demo adapter;
  - the token build script.
- **Asset creation:**
  - the SVG logo, traced from the PNG;
  - 72 redesigned Figma screens with reusable components, variables and prototypes;
  - the 16-page handoff PDF, with redlines measured from the running app.
- **Debugging and quality:**
  - The contrast audit found 3 WCAG failures, all fixed.
  - A comparison of the code with the Figma screenshots found that the first coded dashboards didn't match the frames, so they were rebuilt.
  - The first GitHub Pages deploy failed because it ran before Pages was turned on. It was re-triggered.
  - Testing the seed on SQLite raised "database is locked" errors. Fixed with retry settings.
  - Sample counts disagreed between screens. Fixed by using live data for the badges.
  - `react`/`react-dom` were missing from `package.json` and only installed indirectly. They are now declared explicitly.
- **Verification:**
  - production builds for both modes;
  - headless-browser screenshots;
  - an end-to-end run: walk-in request → resident approves → guard admits → SOS → admin resolves.

## 5. Expected technical questions

**How is access controlled?**
Login returns a JWT signed with `JWT_SECRET` and an 8-hour expiry. `verifyToken` checks it on every request and `roleGuard('admin', …)` checks the role. A resident can only act on walk-ins for their own properties, which `myPropertyIds` checks. The frontend route guard is only for convenience; the server enforces access.

**What if two guards admit the same walk-in?**
`admit` moves the request to `admitted`. A second call finds a status other than `approved` and is rejected with HTTP 409. A database transaction with row locking would make this airtight; that's the planned hardening.

**Why is the resident's countdown accurate after a page refresh?**
The countdown is calculated from the server's `requestedAt` and `windowSec`, not from when the page loaded.

**How does time zone handling work?**
The server works out "today" and hourly buckets in Asia/Manila time (UTC+8), so hosting the server in another region doesn't shift the counts.

**How would you scale it?**
- Replace polling with Server-Sent Events.
- Add database indexes (already on `status`, `scanned_at` and `PropertyId`).
- Cache the dashboard data for a few seconds.
- Move the JWT into an httpOnly cookie.

**What's not finished?**
Every designed screen is built. The screens beyond the core flows (documents, item passes, tenants, vehicles, watchlist, reports, audit log, settings, household, patrol, handoff) run on demo data; their backend endpoints are the next step and follow the same controller pattern. Usability testing with real users is also still to be done.

**How do you run it?**
See the README. The local option without MySQL is `DB_DIALECT=sqlite DB_STORAGE=./dev.db SEED_ON_START=true JWT_SECRET=dev npm start`, after `npm i --no-save sqlite3`.
