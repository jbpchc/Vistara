"""Render the three coded dashboards from the demo build and overlay redlines measured from the DOM."""
import asyncio
from playwright.async_api import async_playwright

OVERLAY = r"""
(specs) => {
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;left:0;top:0;width:0;height:0;z-index:99999;pointer-events:none;font:600 12px/1.2 "Geist Mono",ui-monospace,monospace';
  document.body.appendChild(root);
  const R = '#E5195E';
  const abs = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const tag = (x, y, text) => { const t = document.createElement('div'); t.textContent = text;
    t.style.cssText = `position:absolute;left:${x}px;top:${y}px;transform:translate(-50%,-50%);background:${R};color:#fff;padding:2px 6px;border-radius:6px;white-space:nowrap`; root.appendChild(t); };
  const line = (x, y, w, h) => { const l = document.createElement('div'); l.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${R}`; root.appendChild(l); };
  const box = (b) => { const d = document.createElement('div'); d.style.cssText = `position:absolute;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;outline:1.5px dashed ${R}`; root.appendChild(d); };
  const hdim = (x1, x2, y, label) => { line(x1, y, x2 - x1, 1.5); line(x1, y - 5, 1.5, 11); line(x2 - 1.5, y - 5, 1.5, 11); tag((x1 + x2) / 2, y, label); };
  const vdim = (x, y1, y2, label) => { line(x, y1, 1.5, y2 - y1); line(x - 5, y1, 11, 1.5); line(x - 5, y2 - 1.5, 11, 1.5); tag(x, (y1 + y2) / 2, label); };
  const find = (s) => {
    if (s.text) { const own = (e) => [...e.childNodes].filter(c => c.nodeType === 3).map(c => c.textContent).join('').trim();
      const all = [...document.querySelectorAll(s.tag || '*')].filter(e => own(e) === s.text || (e.childElementCount === 0 && e.textContent.trim() === s.text)); let el = all[s.nth || 0]; for (let i = 0; i < (s.up || 0) && el; i++) el = el.parentElement; return el; }
    return document.querySelectorAll(s.sel)[s.nth || 0];
  };
  let n = 0;
  for (const s of specs) {
    const el = find(s); if (!el) continue; n++;
    const b = abs(el);
    if (s.kind === 'size') { box(b); hdim(b.x, b.x + b.w, b.y - 12, `${Math.round(b.w)}`); vdim(b.x + b.w + 14, b.y, b.y + b.h, `${Math.round(b.h)}`); }
    if (s.kind === 'width') { hdim(b.x, b.x + b.w, b.y + (s.dy ?? 40), `${Math.round(b.w)}`); }
    if (s.kind === 'height') { vdim(b.x + (s.dx ?? b.w / 2), b.y, b.y + b.h, `${Math.round(b.h)}`); }
    if (s.kind === 'pad') { const cs = getComputedStyle(el); const p = parseFloat(cs.paddingLeft), pt = parseFloat(cs.paddingTop), r = parseFloat(cs.borderTopLeftRadius);
      box(b); hdim(b.x, b.x + p, b.y + b.h / 2, `p ${p}`); vdim(b.x + b.w / 2, b.y, b.y + pt, `${pt}`); tag(b.x + 28, b.y + 6, `r ${r}`); }
    if (s.kind === 'gap') { const el2 = find(s.to); if (!el2) continue; const b2 = abs(el2);
      if (s.axis === 'x') hdim(b.x + b.w, b2.x, b.y + (s.dy ?? 30), `${Math.round(b2.x - b.x - b.w)}`);
      else vdim(b.x + (s.dx ?? 40), b.y + b.h, b2.y, `${Math.round(b2.y - b.y - b.h)}`); }
    if (s.label) { const t = document.createElement('div'); t.textContent = s.label;
      t.style.cssText = `position:absolute;left:${b.x + (s.lx ?? 0)}px;top:${b.y + b.h + (s.ly ?? 6)}px;background:#fff;color:${R};border:1.5px solid ${R};padding:2px 6px;border-radius:6px;white-space:nowrap;font:600 11px/1.2 "Geist Mono",monospace`; root.appendChild(t); }
  }
  return n;
}
"""

ADMIN = [
  {'sel': 'aside', 'kind': 'width', 'dy': 108},
  {'text': 'Needs attention', 'up': 3, 'kind': 'pad', 'label': 'Card · bg/card · 1 px border/default · shadow-card', 'ly': 8},
  {'text': 'Needs attention', 'up': 3, 'kind': 'gap', 'axis': 'x', 'to': {'text': 'Gate today', 'up': 2}, 'dy': 300},
  {'text': 'Open incident', 'kind': 'size', 'label': 'Primary button · only one per list (Hick, Von Restorff)', 'ly': 20, 'lx': -260},
  {'text': 'Needs attention', 'up': 3, 'kind': 'gap', 'axis': 'y', 'to': {'text': 'Review queues', 'nth': 1, 'up': 1}, 'dx': 640},
  {'sel': 'nav[aria-label="Admin"] a', 'kind': 'size', 'label': 'Nav item · side/active + brand/forest 11.8:1', 'ly': 10},
  {'sel': 'header', 'kind': 'height', 'dx': 20},
]
RESIDENT = [
  {'sel': 'header', 'kind': 'height', 'dx': 40},
  {'text': 'A visitor is waiting at the gate', 'up': 2, 'kind': 'pad', 'label': 'Walk-in alert · status/danger-bg · 1.5 px status/danger · only red block (Von Restorff)', 'ly': 8},
  {'text': 'Approve', 'kind': 'size'},
  {'text': 'New Visitor Pass', 'up': 2, 'kind': 'size', 'label': 'Quick action · brand/forest (primary)', 'ly': 12},
  {'text': 'Home', 'tag': 'a', 'kind': 'size', 'label': 'Nav pill active · home/accent-bg + home/accent-ink 5.2:1', 'ly': 14, 'lx': -60},
  {'text': 'Quick actions', 'up': 1, 'kind': 'gap', 'axis': 'y', 'to': {'text': 'Make yourself at home', 'up': 2}, 'dx': 288},
]
GUARD = [
  {'sel': 'nav[aria-label="Guard"]', 'kind': 'width', 'dy': 620},
  {'text': 'Scan', 'tag': 'a', 'kind': 'size', 'label': 'Scan · g/fab 8.3:1 vs rail · largest target (Fitts)', 'ly': 10, 'lx': 112},
  {'sel': 'header', 'kind': 'height', 'dx': 420},
  {'text': 'ENTRY', 'kind': 'size'},
  {'text': 'SOS', 'up': 1, 'kind': 'size', 'label': 'SOS · hold 2 s · g/danger-solid 5.1:1', 'ly': -100, 'lx': 104},
  {'text': 'Today at this gate', 'up': 1, 'kind': 'pad', 'label': 'Panel · g/surface · g/border', 'ly': 8},
  {'text': 'Inside', 'tag': 'a', 'kind': 'size'},
]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for role, w, h, specs, full in [('Admin', 1728, 1880, ADMIN, False), ('Resident', 1440, 1000, RESIDENT, False), ('Guard', 1194, 896, GUARD, False)]:
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2)
            pg = await ctx.new_page()
            await pg.goto('http://localhost:8765/Vistara/'); await pg.wait_for_timeout(600)
            await pg.get_by_text(f'Continue as {role}').click(); await pg.wait_for_timeout(1800)
            await pg.screenshot(path=f'clean_{role}.png', full_page=True)
            n = await pg.evaluate(OVERLAY, specs)
            await pg.screenshot(path=f'redline_{role}.png', full_page=full)
            print(role, 'marks', n, '/', len(specs))
            await ctx.close()
        await b.close()
asyncio.run(main())
