# Vistara — Design Handoff (v1.0, semi-final)

Gate, visitor and community management for **Camella Homes Naga**.

**Team:** John Benedict Pachica · Emmanuel Gallego · Dhan Mykell Cruz · John Daniel Esplago
It covers three products that share one design system. Each one is deliberately distinct, so no user confuses one portal for another.

| Product | User | Platform / frame | Screens | Design | Prototype |
|---|---|---|---|---|---|
| Admin portal | HOA office staff | Desktop web, 1728 px | 31 | [Open](https://www.figma.com/design/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=1521-9492) | [Play](https://www.figma.com/proto/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=1521-9492&starting-point-node-id=1521-9492) |
| Resident portal | Homeowners and tenants | Web, 1440 px | 13 | [Open](https://www.figma.com/design/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=1544-4394) | [Play](https://www.figma.com/proto/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=1544-4394&starting-point-node-id=1544-4394) |
| Guard tablet app | Gate guards | iPad landscape, 1194×896 | 28 | [Open](https://www.figma.com/design/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=1581-5534) | [Play](https://www.figma.com/proto/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=1581-5411&starting-point-node-id=1581-5411) |

**Handoff page in Figma:** [VISTARA · Design Handoff](https://www.figma.com/design/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id=1599-5083). It contains:
- 00 Cover and index
- 01 ISO 9241-210
- 02 Foundations
- 03 Components
- 04 Accessibility
- 05 User journeys

## 1. Figma file map

| Page | Contents |
|---|---|
| `MAIN ADMIN PORTAL -- REDESIGN` | Section "Admin Portal · Redesign · Ready for dev". It holds 31 frames with prototype links, Dev Mode annotations and measurement redlines. |
| `MAIN RESIDENT PORTAL -- REDESIGN` | Section "Resident Portal · Redesign · Ready for dev". It holds 13 frames. |
| `MAIN GUARD APP -- REDESIGN` | Section "Guard Tablet App · Redesign · Ready for dev". It holds 28 frames: all edge-case states plus a Day-mode copy. |
| `Vistara · Components` | Master components, icons (SVG export) and the logo (SVG + PNG @2x). |
| `VISTARA · Design Handoff` | Specs, tokens, accessibility and journeys. |
| Original pages | The untouched drafts, kept for before/after comparison. |

**Dev Mode** (Shift + D) shows annotations in three categories:
- **Spec**: sizes, padding and tokens.
- **Accessibility**: targets, contrast and colour-independence.
- **UX law**: the reason behind a decision.

Measurements mark the key spacing on A01, A15, H01 and G02.

**Exports:**
- Every redesigned screen exports as PNG @2x.
- The logo exports as SVG and as PNG @2x.
- Every icon exports as SVG.

## 2. Design tokens

All colours are Figma variables. The code tokens are generated from them; do not edit them by hand.

- `design-handoff/tokens/figma-variables.json` is the export from Figma.
- `design-handoff/tokens/build_tokens.py` turns it into:
  - `frontend/src/styles/tokens.css`, the CSS custom properties.
    - Admin and resident use `:root`.
    - The guard app uses `[data-app="guard"][data-theme="night|day"]`.
  - `design-handoff/tokens/tokens.json`, in W3C design-token format.
- `frontend/tailwind.config.js` maps every token to a Tailwind colour, such as `bg-brand`, `text-ink-muted`, `bg-home-bg` and `bg-g-surface`.
- New after the audit: `border/strong` and `g/border-strong` are input borders of at least 3:1 (WCAG 1.4.11).

| Collection | Modes | Used by |
|---|---|---|
| Vistara Theme | single | Admin (`brand/*`, `side/*`) and Resident (`home/*` warm accent) |
| Vistara Guard | Night (default), Day | Guard tablet app |

**Typography**
- Fonts:
  - **Urbanist** (Medium, SemiBold, Bold) for all UI text.
  - **Geist Mono** for IDs, plates and times.
- Type scale:
  - Display 56/120% SemiBold
  - H1 40 SemiBold
  - H2 24 Bold
  - H3 18 Bold
  - Body 15/150% Medium
  - Label 13 SemiBold
  - Mono 14

**Spacing:** 4 px base, with steps 4, 8, 12, 16, 20, 24, 28, 32, 48, 64 and 96.

**Radii**

| Use | Radius |
|---|---|
| Checkbox | 6 |
| Table row | 14 |
| Stat tile | 16 |
| Rail item | 18 |
| Card (admin and guard) | 24 |
| Card (resident) and Scan button | 28 |
| Pill | full |

**Elevation**
- Cards: `0 6 24 -6 rgba(28,41,25,.05)`.
- Modals: `0 24 64 -12 rgba(28,41,25,.18)`.
- The guard app uses surface steps and borders instead of shadows.

## 3. Portal differentiation (why they don't look like copies)

| | Admin | Resident | Guard |
|---|---|---|---|
| Surface | Light content, dark forest **sidebar** | Light, warm **top-pill nav** | **Dark Night** console (plus a Day mode) |
| Accent | Forest green | Orange `home/accent` | Lime `g/accent` |
| Navigation | 5 groups of up to 4 items, left sidebar | 5 top destinations plus section tabs | 104 px nav rail, 88 px Scan, SOS |
| Role tag | — | HOMEOWNER | GUARD |
| Density | High (tables) | Roomy (cards, radius 28) | Large touch targets (64 px or more) |

## 4. Components

| Component | Variants / props | Key spec |
|---|---|---|
| Button | Primary, Secondary | 44 h, pill radius, 18/20 padding. Focus: 2 px ring with 2 px offset. Disabled: 40% opacity. |
| Status badge | Success, Danger, Warning, Neutral | Dot + word + colour, so status never relies on colour alone. |
| Admin nav item | Default, Active | 44 h. The active item uses `aria-current="page"`. |
| Resident nav pill | Default, Active. Props: Label, Icon, Show icon, Show caret | Active: `home/accent-bg` + `home/accent-ink` |
| Guard rail item | Default, Active | 88×68, with an optional count badge |
| Guard Scan button | Default, Active | 88×88, `g/fab` / `g/on-fab` in both modes |
| SOS | — | Hold for 2 s to send. Releasing early cancels. |
| Logo | Full colour, Reversed | SVG with a transparent background. Minimum width 120 px. |

## 5. States and edge cases to implement

- **Guard walk-in:** waiting → approved, denied, or no response (after 3 min).
  - No response offers: call the resident, call the office, or deny.
- **Guard offline:** the screen shows "Reconnecting". Requests are queued and auto-send when the connection returns.
- **Guard scan result:** valid; expired or invalid QR (danger); overstay on exit (warn).
- **Admin:** a rejection needs remarks before it can be submitted. The gate log is read-only and audit-safe.
- **Resident:** a walk-in alert has a countdown, and a pass can expire and be renewed.

## 6. Implementation notes

The prototypes are **design intent**, not code. When the app is implemented:
1. Use the tokens above. Do not hard-code hex values.
2. Match the auto-layout order to the DOM order, which is also the focus order.
3. Inputs use the `border-input` class, which maps to `border/strong` at 3.41:1. This fixes the WCAG 1.4.11 gap found in the prototype.
4. Verify the resident portal at 200% zoom and at 320 px reflow.

See also:
- `design-handoff/docs/ISO-9241-210_and_Accessibility.md`
- `design-handoff/docs/contrast.json`
- `design-handoff/PROMPTS.md`

## 7. What is implemented in code (frontend/)

| Figma frame | Code |
|---|---|
| Tokens (both collections, both guard modes) | `src/styles/tokens.css`, `tailwind.config.js` |
| Admin shell: grouped sidebar, breadcrumb, gate status, search (`/`), New menu, notifications | `src/components/shared/AppLayout.jsx` → `AdminShell` |
| Resident shell: 5-item top nav, property chip, New visitor pass, HOMEOWNER tag | `AppLayout.jsx` → `ResidentShell` |
| Guard shell: rail with Scan, Inside badge, SOS hold-2s; status bar; Night/Day toggle | `AppLayout.jsx` → `GuardShell` |
| A01 Admin dashboard | `src/pages/admin/DashboardPage.jsx` |
| H01 Resident home (walk-in approval with countdown, setup progress, alerts) | `src/pages/resident/DashboardPage.jsx` |
| Resident passes (create, edit, cancel, show QR) | `src/pages/resident/PassesPage.jsx` |
| G02 Guard gate console (direction, pass type, scanner, today, last scans, expected) | `src/pages/guard/DashboardPage.jsx` |
| Login | `src/components/auth/LoginForm.jsx` |

**Data:** each dashboard reads one composite endpoint: `GET /dashboard/admin`, `/dashboard/resident` or `/dashboard/guard`.
- The GitHub Pages demo serves these from `src/api/demo.js`.
- Against the real Express backend, which does not have these endpoints yet, each dashboard falls back to the existing endpoints. It hides the sections that need new data.

**Designed but not built yet:** these nav items open `/planned/:slug`. That page explains the screen and links to its Figma prototype, so no navigation is a dead end.
- Documents
- Incidents
- Item passes
- Tenants
- Vehicles
- Reports
- Audit log
- Settings
- Watchlist
- Household
- Activity
- Patrol
