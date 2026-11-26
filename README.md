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
| Deployed link | https://jbpchc.github.io/Vistara/ — pick Admin, Resident or Guard on the login screen (runs on sample data) |

## What's in this repo

| Area | Where |
|---|---|
| User flows and edge cases | Three clickable Figma prototypes (links in HANDOFF.md), plus the live demo above |
| Human-centred design and accessibility | [ISO 9241-210 & WCAG report](design-handoff/docs/ISO-9241-210_and_Accessibility.md) and `contrast.json` (68/68 pairs pass AA) |
| Design system | Figma variables exported to code tokens by `design-handoff/tokens/build_tokens.py` |
| Architecture, interactive logic and technical decisions | [TECHNICAL-NOTES.md](TECHNICAL-NOTES.md) |
| Developer handoff | Dev Mode annotations and redlines in Figma, the handoff PDF, and HANDOFF.md §7 (design-to-code status) |

## Run locally

Needs Node.js 20+ and MySQL 8 (or any MySQL-compatible database).

```bash
# backend — create an empty database first, e.g. CREATE DATABASE vistara;
cd backend
cp .env.example .env   # fill in DB and JWT values; set SEED_ON_START=true for test accounts
npm install
npm start

# frontend
cd ../frontend
npm install
npm run dev
```

Test accounts (created by the seed, password `Password@123`): `admin_test`, `guard_alpha`, `juan_dela_cruz`.

To try the walk-in flow, sign in as the guard and the resident in two browsers: Guard → Walk-in → *Ask resident to approve* → Resident → **Approve** → Guard → **Admit**.

To regenerate the design tokens after changing Figma variables:

```bash
python3 design-handoff/tokens/build_tokens.py
```
