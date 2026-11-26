# ISO 9241-210 Human-Centred Design & Accessibility Report — Vistara

## 1. ISO 9241-210 activities per portal

### 1.1 Context of use
- **Admin:** HOA office staff at a desktop during office hours.
  - They handle a high volume of data: the registry, documents, incidents and gate activity.
  - Urgent items must be acted on fast.
- **Resident:** homeowners and tenants on a laptop or phone.
  - They use the portal occasionally and have no training.
  - Walk-in approvals often interrupt other tasks.
- **Guard:** guards share a landscape tablet at the guardhouse.
  - They work standing, on day and night shifts.
  - Conditions include glare, darkness, queuing cars and unreliable signal.

### 1.2 User requirements
- **Admin:**
  - Priority-ordered work.
  - An auditable, read-only gate log.
  - Remarks required whenever an item is rejected.
- **Resident:**
  - Approve or deny a walk-in within 3 minutes.
  - Create a visitor pass from anywhere in the portal.
  - Always see document and sticker status.
- **Guard:**
  - Scan in one tap.
  - Set Entry or Exit before scanning.
  - Keep working when offline.
  - Raise an SOS in 2 s or less.
  - Read the screen in both night and daylight.

### 1.3 Design solutions
- **Admin:**
  - A "Needs attention" list sorted by priority.
  - Real tables with status badges.
  - Denied rows tinted so they stand out.
  - A dark sidebar against light content.
- **Resident:**
  - 5-item top navigation plus section tabs.
  - A persistent "New visitor pass" button.
  - A warm orange accent and a HOMEOWNER tag to separate it from the admin portal.
- **Guard:**
  - Night and Day modes.
  - A navigation rail.
  - An 88 px Scan button.
  - Hold-to-send SOS.
  - An "Expected next hour" list.
  - Patrol rounds with progress.

### 1.4 Evaluation and iteration (this cycle)

| # | Finding | Source | Change |
|---|---|---|---|
| 1 | The draft admin dashboard had a flat attention list, pre-filled approvals and status shown by colour only | Heuristic review | Priority list, single primary action, dot + word badges |
| 2 | Admin tables were padded monospace text | Design QA | Rebuilt as real cells with fixed column widths |
| 3 | The resident nav overflowed at 1440 px | Visual QA | Header tightened; property switcher shortened to "B5 L12" |
| 4 | The resident bell badge contrast was 2.63:1 | Automated audit | `home/accent-ink` gives 6.04:1 |
| 5 | Guard Night SOS contrast was 3.45:1 | Automated audit | `g/danger-solid` #C4262E gives 5.06:1 |
| 6 | The Guard Day Scan button was invisible on the rail (1.14:1) | Automated audit | New `g/fab` token gives 8.28:1 |
| 7 | The Parcel desk was out of scope | Stakeholder feedback | Feature removed from the guard app |
| 8 | The walk-in icon was unclear, then read as a stick figure | Stakeholder feedback, 2 rounds | Replaced with a person-plus icon |

### 1.5 Planned next round (to be completed by the team)
Run a moderated usability test with the prototypes. Suggested participants are 1 admin, 3 residents and 3 guards.

| Role | Task |
|---|---|
| Guard | Walk-in from start to approval |
| Resident | Approve a walk-in |
| Admin | Resolve a critical incident |

Record task success, time on task and SUS score. Log every resulting change in the table above.

## 2. WCAG 2.1 AA checklist

| Criterion | Status | Note |
|---|---|---|
| 1.4.3 Contrast (text) | ✅ | 68 of 68 token pairs pass AA (see `contrast.json`) |
| 1.4.11 Non-text contrast | ⚠️ Dev action | Inputs use fill only (about 1.2:1). Add a 1 px border of at least 3:1. |
| 1.4.1 Use of colour | ✅ | Every status has a dot, a word and a colour |
| 2.5.5 Target size | ✅ | Web 44 px or more; guard 64 px or more; SOS hold target 176 px |
| 2.4.7 Focus visible | ✅ | 2 px ring with 2 px offset |
| 1.3.1 / 2.4.3 Structure and focus order | ✅ | Semantic landmarks; table headers use `scope` |
| 2.2.1 Timing adjustable | ✅ | Walk-in countdown, with extend and call options |
| 3.3.1 / 3.3.3 Errors | ✅ | Reject needs a reason; explicit invalid, expired and offline messages |
| 1.4.4 / 1.4.10 Resize and reflow | ⚠️ Dev action | Verify 200% zoom and 320 px reflow on the resident portal |

Re-run the contrast audit with `python3 docs/contrast_audit.py`.

## 3. UX laws applied

| Law | Where it is applied |
|---|---|
| Hick | 5 destinations per navigation; one primary action per item |
| Miller | Nav groups of 4 or fewer; section tabs |
| Fitts | Large Scan and Approve targets; persistent CTA |
| Jakob | Sidebar, top nav and nav-rail conventions |
| Von Restorff | Only the critical item is red; Scan is the only lime block |
| Serial position | Most-used items first and last in navs |
| Goal-gradient | Queue progress bars and patrol progress |
| Zeigarnik | Counts of people still inside; pending approvals |
| Doherty | Live status pill and connection indicator |
| Peak-end | Clear approved and confirmation end states |
| Aesthetic-usability | Consistent tokens and generous spacing |
