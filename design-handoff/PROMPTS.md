# PROMPTS.md: AI-assisted design log

**Tool:** Claude (Anthropic), connected to Figma via the official Figma MCP server (Plugin API through `use_figma`).
**Role of AI:** a design partner and executor. The team set the direction, reviewed every output and gave corrective feedback (see rounds 10–12).
**Human decisions:**
- Choice of reference style.
- Keeping the originals.
- Removing the parcel feature.
- Rejecting the icon twice.

## Prompts used (verbatim, in order)

| # | Prompt | Result |
|---|---|---|
| 1 | "can you access VISTARA on my figma" | Connected to the file and confirmed access. |
| 2 | "…/VISTARA?node-id=616-495 review this design" | Heuristic critique of the admin draft: hierarchy, contrast, colour-only status and pre-filled approvals. |
| 3 | "answer in yes or no, can you redesign our draft by sending you my reference ui/ux design and apply the laws of ui/ux" | Yes. |
| 4 | "[reference mp4] HERE IS THE REFERENCE ANALYZE I WANT YOU TO APPLY IT TO VISTARA ADMIN PAGE AND ALSO APPLY THE UI/UX LAWS" | Analysed the reference frames. Built the Vistara Theme variables and the shared components (button, badge, nav, icons). Redesigned the dashboard. |
| 5 | "[logo] Apply the style to all the screen but do not replace it make a new frames for it. AND I WANT YOU TO USE THE SAME LOGO BUT CONVERT IT TO SVG." | Vectorised the PNG logo (vtracer, palette-quantised). Restyled all 31 admin screens as new frames with a script-based token remap and a table rebuild. |
| 6 | "Now start applying the style to the other 24 admin screens next, starting with the Gate Log and Document Review?" | Batch restyle continued. |
| 7 | "CAN YOU REMOVE THE BACKGROUND COLOR OF THE LOGO. and put protoypes for navigations." | Transparent logo variants. Sidebar navigation wired across all screens. |
| 8 | "Now access this resident portal and I want you to redesign it with the same style but have the sense of separation for the admin dashboard … Apply the laws the ui/ux still" | Resident portal (13 screens): top-pill nav, `home/*` orange accent, HOMEOWNER tag. |
| 9 | "where is the redesigned one? give me the link" | Shared the links. |
| 10 | "Now access this guard dashboard … THIS IS A MOBILE APP ESPECIALLY FOR A TABLET. THIS IS ONLY A DRAFT SO I WANT YOU TO IMRPOVE IT IF THERE ARE FEATURES THAT ARE MISSING…" | Guard tablet app (28 screens): Night/Day variable modes and a nav rail. Added the missing features: SOS, patrol rounds, expected arrivals, and the offline, denied and no-response states. |

## Techniques
- **Programmatic design** via the Figma Plugin API:
  - Variables with modes.
  - Component sets with properties.
  - Instance swapping.
  - Prototype reactions.
  - Measurements and annotations.
- **HSL-based colour remapping:** existing draft colours were mapped to semantic tokens, and paints that were already bound to a token were skipped.
- **Table reconstruction:** padded monospace text rows were parsed into real auto-layout cells.
- **Logo vectorisation:** palette quantisation → Gaussian blur → spline tracing.
- **Automated WCAG contrast audit** (`docs/contrast_audit.py`) that feeds back into the token values.
- **Token export:** Figma variables → CSS and JSON (`build_tokens.py`), consumed by Tailwind.
- **Design → code:** the dashboards were recoded with the existing API calls kept intact. `npm run build` was used to verify the result.

## Limits and human verification
- The AI's visual checks were screenshot-based. The team should still click through every prototype.
- Usability testing with real guards, residents and admins has **not** been done yet. See `docs/ISO-9241-210_and_Accessibility.md` §1.5.
