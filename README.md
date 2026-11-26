# Vistara: gate management for Camella Homes Naga

A capstone project for the BS Information Technology program at the University of Nueva Caceres. Vistara was formerly called Camella GuardTrack.

**Team:** John Benedict Pachica · Emmanuel Gallego · Dhan Mykell Cruz · John Daniel Esplago

There are three role-based portals on one design system:
- **Admin**: HOA office, desktop web.
- **Resident**: homeowners, web.
- **Guard**: gate guards, tablet. It has a Night mode and a Day mode.

## Semi-final submission materials

| Requirement | Where |
|---|---|
| Project files | `frontend/` (React + Vite + Tailwind) and `backend/` (Node + Express + Sequelize) |
| Documentation of prompts used | [design-handoff/PROMPTS.md](design-handoff/PROMPTS.md) |
| Design handoff document | [Vistara-Design-Handoff.pdf](design-handoff/Vistara-Design-Handoff.pdf) (16 pages), [HANDOFF.md](design-handoff/HANDOFF.md) and the Figma page **VISTARA · Design Handoff** |
| Figma design + prototypes | https://www.figma.com/design/DVDO9PiDwlHtE6kqXyCIA3/VISTARA |
| Deployed link (demo, no backend) | https://jbpchc.github.io/Vistara/ — pick Admin, Resident or Guard on the login screen |

## Rubric map

| Criterion | Evidence |
|---|---|
| Fluency | Three clickable prototypes (links in HANDOFF.md). Figma page 05 has journeys, edge cases and a 5-minute demo script. |
| Accuracy | [ISO 9241-210 & WCAG report](design-handoff/docs/ISO-9241-210_and_Accessibility.md). `contrast.json`: 68/68 pairs pass AA. Visible focus, reduced motion, aria labels, ≥44 px targets in code. |
| Challenge | AI-assisted programmatic Figma design and the Figma → token → Tailwind pipeline (`build_tokens.py`). Coded role-based shells. See PROMPTS.md. |
| Thoroughness | Ready-for-dev Figma sections, Dev Mode annotations and redlines, exports. HANDOFF.md §7 compares the prototype with the code. |
| Style | One token system across three visually distinct portals; UX laws documented and applied. |

## Run locally

```bash
# backend
cd backend
cp .env.example .env   # fill in DB and JWT values
npm install
node server.js

# frontend
cd ../frontend
npm install
npm run dev
```

To regenerate the design tokens after changing Figma variables:

```bash
python3 design-handoff/tokens/build_tokens.py
```
