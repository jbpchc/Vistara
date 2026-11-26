"""Build Vistara-Design-Handoff.pdf from tokens, contrast audit and redline renders."""
import json, html, pathlib, subprocess

HERE = pathlib.Path(__file__).parent
REPO = pathlib.Path('/home/claude/Vistara')
F = '/tmp/fonts'
tok = json.loads((REPO / 'design-handoff/tokens/tokens.json').read_text())
contrast = json.loads((REPO / 'design-handoff/docs/contrast.json').read_text())
e = html.escape

FIGMA = 'https://www.figma.com/design/DVDO9PiDwlHtE6kqXyCIA3/VISTARA'
PROTO = lambda n: f'https://www.figma.com/proto/DVDO9PiDwlHtE6kqXyCIA3/VISTARA?node-id={n}&starting-point-node-id={n}'
DEMO, REPOURL = 'https://jbpchc.github.io/Vistara/', 'https://github.com/jbpchc/Vistara'

def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]
def on(h): return '#111' if lum(h) > .35 else '#fff'

def swatches(d):
    return ''.join(f'<div class="sw"><div class="chip" style="background:{v["$value"]};color:{on(v["$value"])}">{v["$value"]}</div><b>{e(k)}</b></div>' for k, v in d.items())

def guard_swatches():
    out = []
    for k, v in tok['guard']['Night'].items():
        n, d = v['$value'], tok['guard']['Day'][k]['$value']
        out.append(f'<div class="sw"><div class="chip split"><span style="background:{n};color:{on(n)}">{n}</span><span style="background:{d};color:{on(d)}">{d}</span></div><b>{e(k)}</b></div>')
    return ''.join(out)

def table(head, rows, cls=''):
    return f'<table class="{cls}"><thead><tr>{"".join(f"<th>{h}</th>" for h in head)}</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in rows) + '</tbody></table>'

def page(title, eyebrow, body, n):
    return f'<section class="page"><header><span>{eyebrow}</span><span>Vistara · Design handoff · v1.0</span></header><h1>{title}</h1>{body}<footer><span>Camella Homes Naga · University of Nueva Caceres · BSIT Capstone</span><span>{n}</span></footer></section>'

pages = []
P = lambda t, eb, b: pages.append(page(t, eb, b, len(pages) + 1))

# ── 1 Cover ──
pages.append(f'''<section class="page cover">
  <div><img src="file://{REPO}/design-handoff/assets/logo/camella-naga-logo-reversed.svg" class="logo" onerror="this.style.display='none'">
  <p class="eb light">Design handoff · v1.0 · Semi-final submission · 27 Nov 2026</p>
  <h1 class="big">Vistara</h1>
  <p class="lead">Gate, visitor and community management for Camella Homes Naga.<br>Three products, one design system: Admin portal, Resident portal and Guard tablet app.</p></div>
  <div class="links">
    <p><b>Live demo</b> <a href="{DEMO}">{DEMO}</a> — pick Admin, Resident or Guard on the login screen</p>
    <p><b>Git repository</b> <a href="{REPOURL}">{REPOURL}</a></p>
    <p><b>Figma file</b> <a href="{FIGMA}">figma.com/design/DVDO9PiDwlHtE6kqXyCIA3/VISTARA</a></p>
    <p><b>Prototypes</b> <a href="{PROTO('1521-9492')}">Admin</a> · <a href="{PROTO('1544-4394')}">Resident</a> · <a href="{PROTO('1581-5411')}">Guard</a></p>
  </div></section>''')

# ── 2 Contents ──
P('Contents & how to read this', 'Overview', f'''
<div class="cols"><ol class="toc">
<li>ISO 9241-210 human-centred design process</li><li>Foundations — colour tokens (Admin & Resident)</li><li>Foundations — Guard Night / Day tokens</li>
<li>Typography, spacing, radii, elevation</li><li>Components & states</li><li>Redlines — Admin dashboard (A01)</li><li>Redlines — Resident home (H01)</li>
<li>Redlines — Guard gate console (G02)</li><li>Accessibility — WCAG 2.1 AA checklist</li><li>Accessibility — contrast audit (68 pairs)</li>
<li>UX laws applied</li><li>User journeys, edge cases & demo script</li><li>Prototype vs code, assets & exports</li><li>Iteration log</li></ol>
<div><h3>Products</h3>{table(['Product', 'User', 'Platform', 'Screens'], [
 ['Admin portal', 'HOA office staff', 'Desktop web · 1728 px', '31'],
 ['Resident portal', 'Homeowners & tenants', 'Web · 1440 px', '13'],
 ['Guard tablet app', 'Gate guards', 'iPad landscape · 1194×896', '28']])}
<h3>Where things live</h3><p>Figma pages: MAIN ADMIN / RESIDENT / GUARD … -- REDESIGN (ready-for-dev sections, Dev Mode annotations in three categories: <i>Spec</i>, <i>Accessibility</i>, <i>UX law</i>), <b>Vistara · Components</b> (masters, icons, logo) and <b>VISTARA · Design Handoff</b>. Original drafts are untouched on their own pages.</p>
<p>Repository: <code>frontend/</code> (React + Vite + Tailwind), <code>backend/</code> (Express + Sequelize), <code>design-handoff/</code> (this document's sources, HANDOFF.md, PROMPTS.md, tokens, contrast audit).</p>
<p>Redlines in this PDF are drawn from <b>measured sizes in the running code</b>, so they double as a prototype-vs-code check.</p></div></div>''')

# ── 3 ISO ──
iso = [
 ['<b>1 · Context of use</b>', 'HOA office staff at a desktop during office hours; high data volume; urgent items must be acted on fast.', 'Homeowners/tenants on laptop or phone; occasional use, no training; often interrupted by walk-in approvals.', 'Guards on a shared landscape tablet; standing; day & night shifts; glare, darkness, queues, weak signal.'],
 ['<b>2 · User requirements</b>', 'See what needs action first · auditable read-only gate log · remarks required when rejecting · WCAG AA · ≥44 px targets.', 'Approve/deny a walk-in within 3 minutes · create a visitor pass from any screen · always know document status.', 'Scan in one tap · choose Entry/Exit first · keep working offline · SOS in ≤2 s · readable at night and in sun.'],
 ['<b>3 · Design solutions</b>', 'Priority-sorted Needs attention with one primary action · real tables with status badges · dark sidebar, light content.', '5-item top nav · persistent New visitor pass · warm accent + HOMEOWNER tag to separate from admin.', 'Night/Day modes · 104 px rail with 88 px Scan · hold-to-send SOS · Expected next hour · patrol rounds.'],
 ['<b>4 · Evaluate & iterate</b>', 'Heuristic review of draft → redesign; 31 screens visually verified.', 'Nav overflow fixed; bell badge 2.6:1 → 6.0:1.', 'Parcel desk removed (stakeholder); walk-in icon iterated twice; SOS 3.45 → 5.06:1; Day Scan 1.14 → 8.3:1.'],
]
P('ISO 9241-210 — human-centred design per portal', 'Accuracy · standards', table(['Activity', 'Admin portal', 'Resident portal', 'Guard tablet'], iso, 'iso') +
  '<div class="note"><b>Next evaluation round (team to complete):</b> moderated usability test with the live demo — suggested 1 admin, 3 residents, 3 guards. Tasks: approve a walk-in; scan and confirm an entry; resolve a critical incident. Record task success, time on task and SUS score; log resulting changes in the iteration log.</div>')

# ── 4–6 Foundations ──
P('Foundations — Vistara Theme (Admin & Resident)', 'Thoroughness · design tokens',
  f'<p>Single-mode Figma variable collection. <code>brand/*</code> and <code>side/*</code> drive the admin sidebar; <code>home/*</code> is the resident-only warm accent that visually separates the two web portals. Code: <code>frontend/src/styles/tokens.css</code>, generated by <code>design-handoff/tokens/build_tokens.py</code>.</p><div class="grid">{swatches(tok["theme"])}</div>')
P('Foundations — Vistara Guard (Night / Day)', 'Thoroughness · design tokens',
  f'<p>Two modes on one collection. Each chip: <b>left = Night</b> (default), <b>right = Day</b> (bright sunlight). In code the guard shell sets <code>data-app="guard" data-theme="night|day"</code>; shared components are re-pointed to these tokens.</p><div class="grid">{guard_swatches()}</div>')
type_rows = [['Display', '56 / 120%', 'SemiBold', '<span style="font:600 34px Urbanist">Good morning, Julia</span>'],
 ['H1', '40–44', 'SemiBold', '<span style="font:600 28px Urbanist">Gate log</span>'], ['H2', '22–24', 'SemiBold/Bold', '<span style="font:600 20px Urbanist">Needs attention</span>'],
 ['H3', '18', 'Bold', '<span style="font:700 16px Urbanist">Visitor pass VP-2041</span>'], ['Body', '15 / 150%', 'Medium', 'Approve or deny within 3 minutes.'],
 ['Label / eyebrow', '12–13', 'SemiBold/Bold', '<span style="font:700 11px Urbanist;letter-spacing:.1em">STATUS · DIRECTION</span>'],
 ['Mono', '14', 'Geist Mono 400', '<span style="font:400 13px \'Geist Mono\'">NBC 4821 · 07:42 · VP-2041</span>']]
P('Typography, spacing, radii & elevation', 'Thoroughness · foundations', f'''<div class="cols"><div><h3>Type scale — Urbanist + Geist Mono</h3>{table(['Role', 'Size', 'Weight', 'Sample'], type_rows)}</div>
<div><h3>Spacing — 4 px base</h3><div class="spacing">{''.join(f'<div><code>{s}</code><span style="width:{s*3}px"></span></div>' for s in [4,8,12,16,20,24,28,32,48,64,96])}</div>
<h3>Radii</h3>{table(['Token', 'Value', 'Used for'], [['checkbox','6','checkboxes'],['row','14','table rows, list items'],['tile','16','stat tiles'],['rail','18','guard rail items'],['card','24','admin & guard cards'],['card-home','28','resident cards, Scan button'],['pill','9999','buttons, badges, nav pills']])}
<h3>Elevation</h3><p><code>shadow-card</code> 0 6 24 −6 rgba(28,41,25,.05) · <code>shadow-modal</code> 0 24 64 −12 rgba(28,41,25,.18) · Guard UI uses surface steps + borders instead of shadows.</p></div></div>''')

# ── 7 Components ──
comp = [
 ['Button', 'Primary · Secondary', '<span class="btn p">Open incident</span> <span class="btn s">Review</span>', 'h 44 · pill · px 20 · Urbanist SemiBold 15 · focus 2 px ring + 2 px offset · disabled 40%'],
 ['Status badge', 'Success · Danger · Warning · Neutral', '<span class="bd ok">● Allowed</span> <span class="bd dg">● Denied</span> <span class="bd wn">● Pending</span> <span class="bd nt">● Exited</span>', 'Dot + word + colour (WCAG 1.4.1) · 13 SemiBold · px 10 py 4'],
 ['Admin nav item', 'Default · Active', '<span class="nav">Gate log</span> <span class="nav on">Dashboard</span>', 'h 44 · r 12 · active side/active + brand/forest 11.8:1 · aria-current="page" · optional count badge'],
 ['Resident nav pill', 'Default · Active', '<span class="pill">Passes</span> <span class="pill on">Home</span>', 'h 44 · pill · active home/accent-bg + home/accent-ink Bold 5.2:1'],
 ['Guard rail item', 'Default · Active', '<span class="rail">Gate log</span> <span class="rail on">Walk-in</span>', '88×68 · r 18 · icon 28 + label 13 · count badge g/warn'],
 ['Guard Scan button', 'Default · Active', '<span class="scan">Scan</span>', '88×88 · r 28 · g/fab + g/on-fab in both modes · active ring 4 px'],
 ['SOS', 'Idle · Holding · Sent', '<span class="sos">SOS · Hold 2s</span>', '88×76 · g/danger-solid · press-and-hold 2 s; release cancels; status announced to screen readers'],
 ['Input', 'Default · Focus · Disabled', '<span class="inp">e.g. Maria De La Cruz</span>', 'h 44–48 · r 12 · 1 px border/strong (≥3:1, WCAG 1.4.11) · focus ring brand'],
 ['Logo', 'Full colour · Reversed', '—', 'SVG, transparent · min width 120 px · reversed on brand/forest and g/rail'],
]
P('Components & states', 'Thoroughness · component specs', table(['Component', 'Variants', 'Preview', 'Spec'], comp, 'comp') +
  '<p>Masters live on the Figma page <b>Vistara · Components</b>; code equivalents in <code>frontend/src/components/ui/*</code> and <code>AppLayout.jsx</code>.</p>')

# ── 8–10 Redlines ──
def redline(img, title, frame, specs):
    P(title, f'Thoroughness · redlines · Figma {frame}', f'<div class="red"><img src="file://{HERE}/{img}"><div><h3>Key measurements</h3><ul>{"".join(f"<li>{s}</li>" for s in specs)}</ul><p class="small">Magenta marks are measured from the running code (live demo), at the Figma frame width.</p></div></div>')
redline('redline_Admin.png', 'Redlines — Admin dashboard', 'A01 · 1728 px', [
 'Sidebar 260 px · brand/forest · grouped nav (Overview, Gate, Review queues, Registry, Administration)', 'Top bar 76 px · breadcrumb · gate status · search (/ shortcut) · New · notifications',
 'Card padding 28 · radius 24 · 1 px border/default · shadow-card', 'Column gap 24 · row gap 24', 'Nav item 236×44 · active side/active', 'Primary button 44 h — only the critical item has one',
 'Critical row: status/danger-bg + 1.5 px status/danger', 'Table rows r 14 · times/plates in Geist Mono 14'])
redline('redline_Resident.png', 'Redlines — Resident home', 'H01 · 1440 px', [
 'Header 85 px · bg/card · 1 px border/default', 'Active nav pill 101×44', 'Walk-in alert padding 24 · radius 28 · the only red block', 'Approve/Deny 48 h (larger than standard 44 — time-critical)',
 'Quick action 283×92 · first one primary (brand/forest)', 'Section gap 28 · content max width 1180'])
redline('redline_Guard.png', 'Redlines — Guard gate console', 'G02 · 1194×896', [
 'Rail 104 px · g/rail', 'Scan 88×88 — largest target', 'Rail item 88×68 · Inside badge = live count', 'Status bar 72 px', 'ENTRY / EXIT 68 h — chosen before scanning',
 'Panel padding 24 · radius 24 · g/surface + g/border', 'SOS 88×76 · hold 2 s', 'All touch targets ≥ 64 px for a standing guard'])

# ── 11–12 Accessibility ──
a11y = [['1.4.3 Contrast (text)', '✅ Pass', '68 / 68 token pairs ≥ 4.5:1 (next page)'],
 ['1.4.11 Non-text contrast', '✅ Pass', 'Inputs use border/strong (3.41:1) and g/border-strong (3.78 / 3.54:1); Scan 8.3:1 vs rail'],
 ['1.4.1 Use of colour', '✅ Pass', 'Every status = dot + word + colour; denied rows also tinted'],
 ['2.5.5 Target size', '✅ Pass', 'Web ≥ 44 px; guard ≥ 64 px; SOS 88×76 hold target'],
 ['2.4.7 Focus visible', '✅ Pass', '2 px outline, 2 px offset (brand/primary; g/accent in guard)'],
 ['1.3.1 / 2.4.3 Structure & order', '✅ Pass', 'Landmarks (nav, main, header), table roles, aria-current, radiogroups for direction/type'],
 ['2.2.1 Timing adjustable', '✅ Pass', 'Walk-in countdown visible; guard can call/extend when time is up'],
 ['3.3.1 / 3.3.3 Error identification', '✅ Pass', 'Reject requires a reason; invalid, expired, offline messages say what to do next'],
 ['2.3.3 Motion', '✅ Pass', 'prefers-reduced-motion disables animations'],
 ['1.4.4 / 1.4.10 Resize & reflow', '⚠️ To verify', 'Test 200% zoom and 320 px reflow on the resident portal']]
P('Accessibility — WCAG 2.1 AA checklist', 'Accuracy · accessibility', table(['Criterion', 'Status', 'Evidence'], a11y))
third = (len(contrast) + 2) // 3
def ctable(rows): return table(['Portal', 'Foreground', 'Background', 'Ratio'], [[r['portal'].replace('Guard ', 'G·'), f'<span class="dot" style="background:{r["fgHex"]}"></span>{e(r["fg"])}', f'<span class="dot" style="background:{r["bgHex"]}"></span>{e(r["bg"])}', f'<b>{r["ratio"]:.2f}</b>'] for r in rows], 'tiny')
P('Accessibility — contrast audit', 'Accuracy · WCAG 1.4.3', f'<p class="small">Generated by <code>design-handoff/docs/contrast_audit.py</code>. AA requires 4.5:1 for text. 68 of 68 pass.</p><div class="cols3">{ctable(contrast[:third])}{ctable(contrast[third:2*third])}{ctable(contrast[2*third:])}</div>')

# ── 13 UX laws ──
laws = [['Hick', 'Five top-level destinations per portal; one primary action per list item', 'Resident nav; Needs attention'],
 ['Miller', 'Admin nav chunked into five labelled groups of ≤ 4', 'Admin sidebar'], ['Fitts', 'Largest targets for most frequent actions; New visitor pass on every screen', 'Scan 88 px; Approve 48 h'],
 ['Jakob', 'Familiar patterns: sidebar admin, top-nav consumer site, tablet nav rail, "/" to search', 'All shells'],
 ['Von Restorff', 'Only one red block per screen; Scan is the only lime block', 'Critical incident; walk-in alert'],
 ['Serial position', 'Most-used items first/last in navs (Dashboard first, Scan top, SOS bottom)', 'Navs'],
 ['Goal-gradient', 'Progress bars toward clearing queues and finishing setup', 'Review queues; Make yourself at home'],
 ['Zeigarnik', 'Unfinished tasks stay visible with counts', 'Setup steps; Inside badge; approvals pill'],
 ['Doherty', 'Live status and sync time always visible; skeletons while loading', 'Gate status; Online · synced'],
 ['Peak-end', 'Clear confirmations at the end of key tasks', 'Approve toast; export snapshot toast'],
 ['Aesthetic-usability', 'One consistent token system; generous spacing; calm palette', 'Everywhere']]
P('UX laws applied', 'Style · UX quality', table(['Law', 'How it is applied', 'Where'], laws))

# ── 14 Journeys ──
j = [['Guard · walk-in', 'Console → Walk-in form → Waiting for resident → Approved → Console', 'Denied · No response (3 min) · Offline/reconnecting · Bright sun (Day mode)'],
 ['Guard · scan a pass', 'Console → choose Entry/Exit → Scan → Result → Console', 'Expired/invalid QR · wrong date · already used · Emergency (SOS)'],
 ['Resident · approve walk-in', 'Home alert → Approve → confirmation', 'Deny with reason · time runs out'],
 ['Resident · create pass', 'Any screen → New visitor pass → form → QR to share', 'Edit / cancel pass · expired pass'],
 ['Admin · resolve urgent work', 'Dashboard → Needs attention → item → resolve with remarks', 'Reject document (remarks required) · audit via read-only gate log']]
P('User journeys, edge cases & demo script', 'Fluency · user journey', table(['Journey', 'Happy path', 'Edge cases covered'], j) + f'''
<div class="note"><b>5-minute reviewer demo</b> (<a href="{DEMO}">{DEMO}</a>)<br>
1. Continue as Guard → Entry → Enter code manually; then Walk-in (no pass); toggle Day mode; hold SOS 2 s.<br>
2. Continue as Resident → Approve the waiting visitor → Quick action New Visitor Pass → create a pass → Show QR.<br>
3. Continue as Admin → Needs attention → filter recent scans (Denied) → Export snapshot → Gate log.</div>''')

# ── 15 Prototype vs code ──
pv = [['Tokens (both collections, both guard modes)', 'tokens.css · tailwind.config.js', '✅'], ['Three role shells', 'AppLayout.jsx (Admin/Resident/Guard)', '✅'],
 ['A01 Admin dashboard', 'pages/admin/DashboardPage.jsx', '✅'], ['H01 Resident home', 'pages/resident/DashboardPage.jsx', '✅'], ['Resident passes', 'pages/resident/PassesPage.jsx', '✅'],
 ['G02 Guard console', 'pages/guard/DashboardPage.jsx', '✅'], ['Scanner · walk-in form · gate log', 'QRScanner · ManualEntryForm · LogsPage', '✅ (functional)'],
 ['Documents, incidents, item passes, tenants, vehicles, reports, audit, settings, watchlist, household, activity, patrol', '/planned/:slug → explains screen, links to its Figma prototype', '🟡 designed, not built']]
P('Prototype vs code, assets & exports', 'Thoroughness · handoff', table(['Figma', 'Code', 'Status'], pv) + '''
<div class="cols"><div><h3>Data</h3><p>Each dashboard reads one composite endpoint (<code>/dashboard/admin|resident|guard</code>). The GitHub Pages demo serves them from <code>src/api/demo.js</code>; against the Express backend, dashboards fall back to existing endpoints and hide sections that need new data.</p></div>
<div><h3>Assets & exports</h3><ul><li>Logo: SVG full colour + reversed, transparent (<code>design-handoff/assets/logo</code>)</li><li>Icons: SVG export on every icon component in Figma</li><li>Screens: PNG @2x export on every redesigned frame</li><li>Tokens: <code>figma-variables.json</code> → <code>tokens.css</code>, <code>tokens.json</code> (W3C)</li></ul></div></div>''')

# ── 16 Iterations ──
it = [['1', 'Draft admin: flat attention list, colour-only status, pre-filled approvals', 'Heuristic review', 'Priority list, single primary action, dot + word badges'],
 ['2', 'Admin tables were padded monospace text', 'Design QA', 'Rebuilt as real cells'], ['3', 'Resident nav overflowed at 1440 px', 'Visual QA', 'Header tightened'],
 ['4', 'Resident bell badge 2.63:1', 'Contrast audit', 'home/accent-ink → 6.04:1'], ['5', 'Guard Night SOS 3.45:1', 'Contrast audit', 'g/danger-solid #C4262E → 5.06:1'],
 ['6', 'Guard Day Scan invisible on rail 1.14:1', 'Contrast audit', 'New g/fab token → 8.28:1'], ['7', 'Parcel desk out of scope', 'Stakeholder', 'Removed'],
 ['8', 'Walk-in icon unclear, then read as stick figure', 'Stakeholder ×2', 'Person-plus icon'], ['9', 'Inputs relied on fill only (~1.2:1)', 'WCAG 1.4.11', 'border/strong tokens ≥ 3:1'],
 ['10', 'Coded dashboards simplified vs Figma', 'Prototype-vs-code review', 'Rebuilt A01/H01/G02 to match frames'], ['11', 'Dropdown carets without menus; mismatched counts', 'UX-law review', 'Carets removed; counts from live data']]
P('Iteration log', 'Accuracy · evaluate & iterate', table(['#', 'Finding', 'Source', 'Change'], it))

CSS = f'''
@font-face{{font-family:Urbanist;font-weight:500;src:url(file://{F}/fontsource-urbanist-5.3.0/files/urbanist-latin-500-normal.woff2)}}
@font-face{{font-family:Urbanist;font-weight:600;src:url(file://{F}/fontsource-urbanist-5.3.0/files/urbanist-latin-600-normal.woff2)}}
@font-face{{font-family:Urbanist;font-weight:700;src:url(file://{F}/fontsource-urbanist-5.3.0/files/urbanist-latin-700-normal.woff2)}}
@font-face{{font-family:'Geist Mono';font-weight:400;src:url(file://{F}/fontsource-geist-mono-5.3.0/files/geist-mono-latin-400-normal.woff2)}}
@page{{size:A4 landscape;margin:0}}
*{{box-sizing:border-box}} body{{margin:0;font:500 11.5px/1.5 Urbanist,sans-serif;color:#1B211C;background:#F7F4EE}}
.page{{width:297mm;height:210mm;padding:13mm 15mm 16mm;position:relative;page-break-after:always;overflow:hidden;background:#F7F4EE}}
.page>header,.page>footer{{display:flex;justify-content:space-between;font-size:9.5px;color:#5F6459;font-weight:600;letter-spacing:.04em}}
.page>header span:first-child{{text-transform:uppercase;letter-spacing:.12em;font-weight:700}}
.page>footer{{position:absolute;left:15mm;right:15mm;bottom:8mm}}
h1{{font-weight:600;font-size:26px;margin:6px 0 10px;line-height:1.15}} h3{{font-size:13px;margin:10px 0 6px}}
p{{margin:0 0 7px}} code{{font:400 10px 'Geist Mono',monospace;background:#F1ECE2;padding:1px 4px;border-radius:4px}} a{{color:#23402A}}
table{{width:100%;border-collapse:separate;border-spacing:0;background:#FFFDF9;border:1px solid #E6DECF;border-radius:12px;overflow:hidden;margin-bottom:8px}}
th{{text-align:left;font-size:10px;color:#5F6459;background:#F1ECE2;padding:6px 8px}} td{{padding:6px 8px;border-top:1px solid #EFE8DB;vertical-align:top}}
table.iso td{{font-size:11px}} table.iso td:first-child{{background:#1C3721;color:#F7F4EE;width:120px}}
table.tiny td,table.tiny th{{padding:2.5px 6px;font-size:9px}}
.cols{{display:grid;grid-template-columns:1fr 1fr;gap:14px}} .cols3{{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;align-items:start}} .small{{font-size:10px;color:#5F6459}}
.note{{background:#F6ECD6;border-radius:12px;padding:9px 12px;margin-top:8px}}
.grid{{display:grid;grid-template-columns:repeat(8,1fr);gap:8px 10px}} .sw b{{display:block;font-size:9.5px;margin-top:3px}}
.chip{{height:46px;border-radius:10px;border:1px solid #E6DECF;display:flex;align-items:flex-end;padding:4px 6px;font:400 8.5px 'Geist Mono'}}
.chip.split{{padding:0;overflow:hidden}} .chip.split span{{flex:1;height:100%;display:flex;align-items:flex-end;padding:4px 5px;font-size:8px}}
.spacing div{{display:flex;align-items:center;gap:8px;margin:2px 0}} .spacing code{{width:28px}} .spacing span{{height:8px;background:#23402A;border-radius:3px;display:inline-block}}
.toc{{font-size:13px;line-height:1.9}}
.btn{{display:inline-block;height:26px;line-height:26px;padding:0 12px;border-radius:99px;font-weight:600}} .btn.p{{background:#23402A;color:#fff}} .btn.s{{border:1px solid #E6DECF;background:#FFFDF9}}
.bd{{display:inline-block;padding:2px 7px;border-radius:99px;font-weight:600;font-size:10px}} .ok{{background:#E4EEE0;color:#2F6B3A}} .dg{{background:#FBE9E7;color:#B42318}} .wn{{background:#F6ECD6;color:#8A5A00}} .nt{{background:#F1ECE2;color:#5F6459}}
.nav{{display:inline-block;padding:5px 10px;border-radius:8px;background:#1C3721;color:#C9D3C6;font-weight:600}} .nav.on{{background:#F7F4EE;color:#1C3721;outline:4px solid #1C3721}}
.pill{{display:inline-block;padding:5px 10px;border-radius:99px;color:#5F6459;font-weight:600}} .pill.on{{background:#FDEBDC;color:#A1490F;font-weight:700}}
.rail{{display:inline-block;padding:6px 10px;border-radius:10px;background:#0B120E;color:#A7B6AB;font-weight:600}} .rail.on{{background:#2A3A1A;color:#C9E77A}}
.scan{{display:inline-block;padding:10px 14px;border-radius:14px;background:#B8DC4F;color:#13210F;font-weight:700}} .sos{{display:inline-block;padding:8px 12px;border-radius:12px;background:#C4262E;color:#EEF2EA;font-weight:700}}
.inp{{display:inline-block;padding:5px 10px;border:1px solid #8C8A80;border-radius:8px;color:#5F6459;background:#FFFDF9;min-width:150px}}
table.comp td:nth-child(3){{width:250px}}
.red{{display:grid;grid-template-columns:1fr 215px;gap:12px;height:150mm}} .red img{{width:100%;height:150mm;object-fit:contain;object-position:top left;border-radius:10px;border:1px solid #E6DECF;background:#fff}}
.red ul{{padding-left:16px;margin:0 0 8px}} .red li{{margin-bottom:5px}}
.dot{{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px;border:1px solid #0002;vertical-align:-1px}}
.cover{{background:#1C3721;color:#F7F4EE;display:flex;flex-direction:column;justify-content:space-between;padding:20mm}}
.cover .logo{{width:190px;margin-bottom:22mm}} .big{{font-size:68px;margin:6px 0}} .lead{{font-size:18px;max-width:180mm;color:#C9D3C6}} .eb.light{{letter-spacing:.12em;text-transform:uppercase;font-weight:700;font-size:11px;color:#C9D3C6}}
.links{{background:#2E4A33;border-radius:16px;padding:12px 16px;font-size:12.5px}} .links a{{color:#B8DC4F}} .links b{{display:inline-block;width:120px}}
'''
doc = f'<!doctype html><html><head><meta charset="utf-8"><title>Vistara — Design Handoff</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'
(HERE / 'handoff.html').write_text(doc)
subprocess.run(['/usr/bin/google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--no-pdf-header-footer',
                f'--print-to-pdf={HERE}/Vistara-Design-Handoff.pdf', f'file://{HERE}/handoff.html'], check=True, capture_output=True)
print('pages', len(pages))
