# Documentation of prompts used

This file records how AI was used to build Vistara. It lists every prompt that shaped the project, what the AI produced, and what the team decided or checked.

## 1. Tools and setup

| Item | Detail |
|---|---|
| AI model | Claude (Anthropic), used through the Claude app |
| Design connection | Official Figma MCP server. The AI edited the shared VISTARA Figma file through the Figma Plugin API (`use_figma`), and read screenshots and metadata back to check its work. |
| Code connection | GitHub. The AI committed to `jbpchc/Vistara`, and every AI-assisted commit is marked `Co-Authored-By: Claude`. |
| Workspace tools | Node/Vite builds, a headless Chrome browser for screenshots and end-to-end checks, and Python for the logo tracing, contrast audit and token export |
| Team | John Benedict Pachica, Emmanuel Gallego, Dhan Mykell Cruz, John Daniel Esplago |

**Division of work**
- **The team** set the direction, supplied the inputs, made every product decision, and reviewed each result before accepting it. The inputs were the reference video, the Camella Naga logo, the Figma drafts and the activity instructions.
- **The AI** produced the designs, code and documents, and ran the automated checks.
- Decisions that came from the team are listed in §4.

## 2. Prompt log

Prompts are quoted **verbatim**, including our original spelling and capitalisation.
- `[…]` marks an attachment or an omitted Figma link.
- *Italics* mark a summary of a long prompt or of a pasted document.

### Phase 1: Review and redesign in Figma

| # | Prompt | What the AI produced | Team decision / verification |
|---|---|---|---|
| 1 | "can you access VISTARA on my figma" | Connected to the Figma file and listed its pages. | Confirmed it was the correct file. |
| 2 | "[Figma link] review this design" | Heuristic review of the admin draft. Main findings: weak visual hierarchy, low contrast, status shown by colour only, and approvals pre-filled by default. | Agreed to redesign instead of patching. |
| 3 | "answer in yes or no, can you redesign our draft by sending you my reference ui/ux design and apply the laws of ui/ux" | "Yes." | Chose to provide a reference video. |
| 4 | "[reference video] HERE IS THE REFERENCE ANALYZE I WANT YOU TO APPLY IT TO VISTARA ADMIN PAGE AND ALSO APPLY THE UI/UX LAWS" | Analysed the reference style and built the "Vistara Theme" colour variables. Made shared components (button, status badge, navigation item, icons) and redesigned the admin dashboard, applying Hick, Miller, Fitts, Jakob and Von Restorff. | Approved the direction. |
| 5 | "[Camella Naga logo] Apply the style to all the screen but do not replace it make a new frames for it. AND I WANT YOU TO USE THE SAME LOGO BUT CONVERT IT TO SVG." | Traced the PNG logo into SVG. Restyled all 31 admin screens as new frames, leaving the originals untouched. Rebuilt the tables as real cells. | Required that the original drafts be kept. |
| 6 | "Now start applying the style to the other 24 admin screens next, starting with the Gate Log and Document Review?" | Continued the batch restyle in the requested order. | Spot-checked the Gate Log and Document Review screens. |
| 7 | "CAN YOU REMOVE THE BACKGROUND COLOR OF THE LOGO. and put protoypes for navigations." | Made transparent full-colour and reversed logo variants. Wired the sidebar navigation as prototype links across all admin screens. | Clicked through the prototype. |
| 8 | "Now access this resident portal and I want you to redesign it with the same style but have the sense of separation for the admin dashboard so it is not carbon copy or not confusing. Apply the laws the ui/ux still: [Figma link]" | Redesigned the resident portal (13 screens) with its own look: top pill navigation, a warm orange accent, a HOMEOWNER tag and roomier cards. | Accepted the separation approach. |
| 9 | "where is the redesigned one? give me the link" | Sent the page and prototype links. | n/a |
| 10 | "Now access this guard dashboard and I want you to redesign it with the same style but have the sense of separation for the admin dashboard so it is not carbon copy or not confusing. THIS IS A MOBILE APP ESPECIALLY FOR A TABLET. THIS IS ONLY A DRAFT SO I WANT YOU TO IMRPOVE IT IF THERE ARE FEATURES THAT ARE MISSING. Finally, Apply the laws the ui/ux still: [Figma link]" | Redesigned the guard tablet app (28 screens), with Night and Day colour modes and a navigation rail with a large Scan button. Added missing features: SOS, patrol rounds, expected arrivals, and offline / denied / no-response states. | Reviewed the added features (see #11). |
| 11 | "REMOVE THE PARCEL FEATURE" | Removed the parcel desk screen and its navigation item. | **Team scope decision:** parcels are out of scope. |
| 12 | "[screenshot] PLEASE FIX THE WAL IN ICON" → "REDESIGN THE WALKIN LOGO NOT STICKMAN" | First version: a stick figure. Second version: a person-plus icon. | **Team rejected the first version**; the second was accepted. |

### Phase 2: Meeting the activity requirements

| # | Prompt | What the AI produced | Team decision / verification |
|---|---|---|---|
| 13 | *[Pasted the semi-final activity instructions.] Asked that the guard, admin and resident dashboards meet the instructions.* | Ran a WCAG contrast audit: 3 pairs failed and were fixed, so 68 of 68 now pass. Added notes and spacing measurements to the key Figma screens. Built the Figma "Design Handoff" page (ISO 9241-210 process, foundations, components, accessibility, user journeys) and set up exports. | Reviewed the handoff page. |
| 14 | "CAN YOU DO IT IN MY GITHUB" → "Do not touch the camella guardtrack repo but rather create a new repo named VVistara" → *(repo name confirmed as "Vistara")* → "i already created vistara repo" | Copied the project into the new repo without the `.env` secrets. Exported the Figma colours into code tokens, built the three role-based layouts, and recoded the dashboards. | **Team decision:** keep the original repo untouched. The team created the GitHub repo. |
| 15 | "help me deploy it." → "actually backend is not really necessary for this submission bin, is there no github feature wherein i can just deploy it and paste the site" | Set up GitHub Pages with automatic deploys. Added a demo mode that runs on sample data in the browser, with one-click role login. Ran headless browser checks for all three roles. | **Team decision:** host the frontend on GitHub Pages. |
| 16 | "[screenshot] where ive already made it public and chose github actions" | Found that the first deploy had failed because it ran before Pages was turned on. Re-triggered it and confirmed the site was live. | The team made the repo public and turned on Pages. |
| 17 | "why the deployed github frontend ui design does not follow the redesign dashboards from figma" | Explained the gap: the first coded version only covered features the existing backend supported. Rebuilt the admin, resident and guard dashboards to match the Figma frames, and checked them against the Figma screenshots. | **The team caught this mismatch.** |
| 18 | *Asked whether the work met the instructions and the UI/UX laws, and how to submit on Google Classroom.* | Self-assessment with the remaining gaps listed, and submission steps. | n/a |
| 19 | "yes" (apply the fixes) | Fixed two UX-law issues: dropdown arrows on links that open no menu, and badge counts that didn't match. Restyled the scanner and walk-in screens for Night and Day mode. | Rechecked in screenshots. |
| 20 | "is the handoff design shoould be in figma?" → "yes please" | Built a 16-page handoff PDF. The redlines are measured from the running app. | Reviewed the PDF. |
| 21 | "it does not mean ai feature inside the app. Emmanuel Gallego, Dhan Mykell Cruz, John Daniel Esplago, and Me" | Added the team names to the README, the handoff document and the PDF cover. | **The team clarified** that the AI requirement means AI-assisted development, not an AI feature inside the app. |
| 22 | *Asked for document sections to use plain names instead of the activity's assessment labels.* | Renamed the sections in the README, the PDF and the Figma handoff page. | n/a |

### Phase 3: Making the system functional

| # | Prompt | What the AI produced | Team decision / verification |
|---|---|---|---|
| 23 | "apply the backend to make the system all functional." → *(chose "Core flows, deployed")* | Built the backend for the core flows: live data for all three dashboards; walk-in approval (guard requests, resident approves or denies, guard admits, with a written reason required after a timeout); incident reports and SOS; and logging of refused QR scans. Tested the full flow end to end on a local database. | **Team scope choice:** the core flows only. |
| 24 | "this is just for compliance for my instructor so it wont be deployed really." | Kept the live site in demo mode, with the full backend in the repo and steps to run it locally. | **Team decision:** no paid or online hosting. |
| 25 | "remove the things that the instructor does not need to see or things that are unnecessary" | Removed unused pages, starter-template images and hosting configuration. Both builds still passed. | n/a |
| 26 | *Asked to update this file so it fully meets the activity's requirement to document the prompts used.* | Rewrote this file as a complete prompt log. | n/a |
| 27 | "why is inside now and gate log the same?" | Found that the status filter didn't follow the URL, so both links showed the same list. Synced the filter with the URL and made "Inside now" ignore the date. | Checked both views side by side. |
| 28 | "build the rest" | Built the remaining screens from the Figma frames. **Admin:** visitor passes, document queue and review (4-point checklist, remarks required to reject), item gate passes, tenants and leases (renew, end), vehicles and stickers, watchlist, reports with CSV export, audit log, settings, notifications. **Resident:** household members, My home (properties, vehicles, documents, item passes), activity (visits, walk-ins, notifications), account (profile, privacy, help). **Guard:** patrol rounds with checkpoints and issues, shift handoff, vehicle lookup with watchlist alerts, item pass check, occupancy. Every change is written to the audit log. Shared building blocks (`components/kit.jsx`) keep tables, tabs, dialogs and forms consistent. | **Team decision:** the new screens run on demo data; the backend keeps covering the core flows. |
| 29 | "make sure that there is no bugs will be created." | Wrote an end-to-end test that opens every new screen for each role, performs the main actions (approve/reject, add/remove, renew, save, patrol round, handoff, lookups) and checks the results, console errors, accessibility and layout at the target viewports. It found two bugs: new items didn't appear after saving, because the demo API returned the same object it had changed; fixed by copying every demo response, as a real network response would be. The not-found page also lacked a main landmark. Final run: 0 failures, and the earlier screens re-audited with 0 accessibility violations. | Re-ran the full test after each fix. |
| 30 | "can you make the guard ui responsive for all the dashboard and update the repo?" | Measured all 12 guard screens at 8 sizes from 360 to 1920 px. On phones the side rail took a third of the screen and pushed pages off-screen. Added a bottom tab bar with a floating hold-to-send SOS, a compact status bar, card layouts for the gate log and the tool tables, wrapping patrol rows and filters, and larger exit buttons and tap areas. | Re-measured every screen at every size: no overflow, 0 accessibility violations in Night and Day modes, and the end-to-end test still passes. Also tested tapping, exit and SOS on a phone. |
| 31 | "make the button for the exit red? make sure that it compliments with the colors used." | Switched the Exit direction button and the Exit chips to the guard danger colours: solid red when selected, a soft red tint otherwise. | Contrast checked in Night and Day modes (5.6–6.9:1); the accessibility check found no violations. |
| 32 | "can you make the admin ui responsive and update the repo?" | Measured all 17 admin screens at 7 sizes from 360 to 1920 px. Added a menu drawer below 1024 px, a compact header, stacking needs-attention rows, a document preview that fits the screen, card layouts for every table below 1280 px (including the older Residents, Properties and Users pages), and larger, labelled icon buttons. | Re-measured every screen: no clipping or sideways scrolling, 0 accessibility violations at phone, tablet and laptop sizes, and the end-to-end test still passes. |

## 3. How prompts were written (prompting techniques)

| Technique | Example |
|---|---|
| **Reference-based prompting:** give an example instead of describing the style | #4, the reference video |
| **Constraint prompts:** state what must not change | #5 "do not replace it make a new frames", #14 "Do not touch the camella guardtrack repo" |
| **Context and audience prompts** | #10 "THIS IS A MOBILE APP ESPECIALLY FOR A TABLET", #8 "not carbon copy or not confusing" |
| **Principle-driven prompts:** ask for named design principles | #4, #8 and #10, "apply the laws of ui/ux" |
| **Iterative correction:** reject a result and say why | #12 "NOT STICKMAN", #17 "does not follow the redesign" |
| **Scope control:** remove or limit features | #11 "REMOVE THE PARCEL FEATURE", #23 choosing core flows only |
| **Verification prompts:** ask the AI to check its own work against the requirements | #18 |

## 4. Decisions made by the team

- Chose the reference style (#4).
- Required that the original Figma drafts be kept (#5).
- Required each portal to look distinct from the others (#8, #10).
- Removed the parcel feature from scope (#11).
- Rejected the stick-figure icon (#12).
- Kept the original repository untouched and created a new one (#14).
- Hosted the frontend on GitHub Pages with sample data, with no paid server (#15, #24).
- Caught the mismatch between the coded dashboards and the Figma frames (#17).
- Limited backend work to the core flows (#23).

## 5. Techniques the AI used

Architecture, state management and design trade-offs are explained in [`TECHNICAL-NOTES.md`](../TECHNICAL-NOTES.md).


- **Programmatic design through the Figma Plugin API:**
  - variables with Night and Day modes;
  - component sets with properties;
  - instance swapping;
  - prototype links;
  - Dev Mode annotations and measurements.
- **Colour remapping:** draft colours were converted to design tokens by hue, saturation and lightness, skipping colours already bound to a token.
- **Table reconstruction:** rows of padded monospace text were parsed into real layout cells.
- **Logo vectorisation:** colour quantisation, then a light blur, then spline tracing to SVG.
- **Automated WCAG contrast audit** (`docs/contrast_audit.py`). Its results fed back into the token values.
- **Token pipeline:** Figma variables → `build_tokens.py` → CSS variables and JSON → Tailwind.
- **Design to code:** role-based layouts and three dashboards rebuilt to match the Figma frames.
- **Backend:**
  - three new models: walk-in request, incident, and refused scan;
  - one combined data request per dashboard;
  - walk-in approval with status tracking and timeout handling.
- **Demo mode:** a fake API in the browser that returns the same data shapes as the real server, so the site works on GitHub Pages.
- **Automated checks:**
  - production builds;
  - headless-browser screenshots compared with the Figma frames;
  - an end-to-end test of walk-in → approve → admit, SOS, and resolving an incident;
  - an end-to-end test of every screen and its main actions for all three roles, with accessibility and layout checks.

## 6. Verification and limits

- Every AI result was checked with screenshots, builds or tests before it was accepted, and the team reviewed the key screens.
- **Not done yet:** usability testing with real guards, residents and HOA staff. This is the next step under ISO 9241-210; see `docs/ISO-9241-210_and_Accessibility.md` §1.5.
- The screens added in prompt 28 run on demo data. The Express backend covers the core flows (dashboards, passes, walk-ins, incidents, gate log); the other screens' endpoints follow the same pattern and are the next backend step.
- Demo mode uses sample data, which resets when the page is reloaded.

## 7. Responsible use

- AI was used as a design and development assistant.
- All AI output was reviewed by the team, and the product decisions in §4 were made by the team.
- No secrets or personal data were shared with the AI or committed to the repository: the `.env` file is excluded, and the resident names in the demo are fictional.
