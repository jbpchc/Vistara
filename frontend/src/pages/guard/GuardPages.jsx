import { useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Check, TriangleAlert, ScanLine, Clock3, Car, Users, ShieldAlert, ClipboardList, PackageCheck, ArrowLeft, Search, Route } from 'lucide-react';
import api from '@/api/axios';
import { useToast } from '@/hooks/use-toast';
import { Notice, Pill, Table, Tabs, Modal, Field, areaCls, useResource, fmtDate } from '@/components/kit';

/* Guard tablet screens — Figma G08, G09, G13, G14, G15, G18. Targets ≥ 56 px. */

const big = 'inline-flex items-center justify-center gap-2 h-14 px-6 rounded-full text-[17px] font-semibold disabled:opacity-50';
const time = (d) => (d ? new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—');
const useSave = () => {
  const { toast } = useToast();
  return async (fn, ok) => {
    try { const r = await fn(); toast({ variant: 'success', title: ok, description: r?.data?.message }); return true; }
    catch (e) { toast({ variant: 'destructive', title: 'Could not save', description: e.response?.data?.message || 'Check the connection and try again.' }); return false; }
  };
};
const Shell = ({ title, subtitle, aside, children }) => (
  <div className="max-w-[1180px] mx-auto space-y-5 anim-fade-in">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-[32px] font-semibold text-g-text">{title}</h1>{subtitle && <p className="mt-1 text-[16px] text-g-text-2">{subtitle}</p>}</div>{aside}
    </div>
    {children}
  </div>
);

/* ── G18 Patrol rounds ──────────────────────────────────────────────────── */
export const Patrol = () => {
  const { data, error, reload } = useResource('/hub/patrol');
  const save = useSave();
  const [issue, setIssue] = useState(false); const [note, setNote] = useState('');
  if (!data) return <Shell title="Patrol rounds">{error && <Notice tone="danger">{error}</Notice>}</Shell>;
  const cps = data.checkpoints;
  const cleared = cps.filter((c) => c.status === 'done' || c.status === 'issue').length;
  const current = cps.find((c) => c.status === 'current');
  const complete = !current;
  const advance = async (status, noteText) => {
    const idx = cps.findIndex((c) => c.status === 'current');
    const next = cps.map((c, i) => (i === idx ? { ...c, status, at: new Date().toISOString(), note: noteText || null } : i === idx + 1 ? { ...c, status: 'current' } : c));
    if (await save(() => api.put('/hub/patrol', { checkpoints: next }), status === 'issue' ? 'Issue noted — the office can see it' : `${cps[idx].name} cleared`)) { setIssue(false); setNote(''); reload(); }
  };
  const restart = async () => { if (await save(() => api.put('/hub/patrol', { round: Math.min(data.round + 1, data.of), startedAt: new Date().toISOString(), checkpoints: cps.map((c, i) => ({ ...c, status: i === 0 ? 'current' : 'todo', at: null, note: null })) }), 'New round started')) reload(); };
  return (
    <Shell title="Patrol rounds" subtitle={`Round ${data.round} of ${data.of} tonight · started ${time(data.startedAt)} · next round at ${time(data.nextAt)}`}
      aside={<Pill tone={complete ? 'success' : 'info'}>{complete ? 'Round complete' : 'On schedule'}</Pill>}>
      <section className="rounded-card border border-g-border bg-g-surface p-5" aria-label="Round progress">
        <div className="flex justify-between text-[17px]"><span className="font-semibold text-g-text">{cleared} of {cps.length} checkpoints cleared</span><span className="text-g-text-2">about {Math.max(0, (cps.length - cleared) * 5)} min left</span></div>
        <div className="mt-3 h-3 rounded-full bg-g-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={cps.length} aria-valuenow={cleared} aria-label="Checkpoints cleared">
          <div className="h-full rounded-full bg-g-accent" style={{ width: `${(cleared / cps.length) * 100}%` }} />
        </div>
      </section>
      <div className="grid lg:grid-cols-[1fr_400px] gap-5 items-start">
        <ol className="rounded-card border border-g-border bg-g-surface p-4 space-y-1">
          {cps.map((c) => (
            <li key={c.id} className={`flex flex-wrap items-center gap-x-4 gap-y-1 min-h-[56px] px-3 py-2 rounded-[18px] ${c.status === 'current' ? 'border-2 border-g-accent bg-g-accent-soft' : ''}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center ${c.status === 'done' ? 'bg-g-ok-bg text-g-ok' : c.status === 'issue' ? 'bg-g-warn-bg text-g-warn' : c.status === 'current' ? 'bg-g-accent text-g-on-accent' : 'bg-g-surface-2'}`}>
                {c.status === 'done' ? <Check className="w-5 h-5" aria-hidden="true" /> : c.status === 'issue' ? <TriangleAlert className="w-5 h-5" aria-hidden="true" /> : c.status === 'current' ? <ScanLine className="w-5 h-5" aria-hidden="true" /> : null}
              </span>
              <span className={`flex-1 min-w-[120px] text-[17px] ${c.status === 'todo' ? 'text-g-text-2' : 'text-g-text font-semibold'}`}>{c.name}<span className="sr-only"> — {c.status === 'todo' ? 'not yet' : c.status}</span></span>
              {c.status === 'issue' && <Pill tone="warning">{c.note} · noted</Pill>}
              {c.status === 'current' ? <span className="ml-auto text-g-accent-ink font-semibold">Now</span> : <span className="ml-auto font-mono text-[15px] text-g-text-2 whitespace-nowrap">{time(c.at)}</span>}
            </li>
          ))}
        </ol>
        <section className="rounded-card border border-g-border bg-g-surface p-6 space-y-4">
          {complete ? (
            <>
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-g-text-2">Round complete</p>
              <p className="text-[24px] font-semibold text-g-text">All {cps.length} checkpoints visited</p>
              <button onClick={restart} disabled={data.round >= data.of} className={`${big} w-full bg-g-accent text-g-on-accent`}>{data.round >= data.of ? 'Last round done for tonight' : 'Start next round'}</button>
            </>
          ) : (
            <>
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-g-text-2">Current checkpoint</p>
              <p className="text-[28px] font-semibold text-g-text">{current.name}</p>
              <p className="text-[15px] text-g-text-2">Scan the checkpoint QR, or confirm below, to prove you were here.</p>
              <button onClick={() => advance('done')} className={`${big} w-full bg-g-accent text-g-on-accent`}><ScanLine className="w-5 h-5" aria-hidden="true" /> Scan checkpoint</button>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => advance('done')} className={`${big} border border-g-border text-g-text`}><Check className="w-5 h-5" aria-hidden="true" /> All clear</button>
                <button onClick={() => setIssue(true)} className={`${big} border border-g-border text-g-text`}><TriangleAlert className="w-5 h-5" aria-hidden="true" /> Issue</button>
              </div>
            </>
          )}
          <p className="flex items-center gap-2 rounded-2xl bg-g-surface-2 px-4 py-3 text-[14px] text-g-text-2"><Clock3 className="w-4 h-4 shrink-0" aria-hidden="true" /> Missed checkpoints are flagged to the office after 10 minutes.</p>
        </section>
      </div>
      {issue && (
        <Modal title={`Issue at ${current?.name}`} onClose={() => setIssue(false)} footer={<><button onClick={() => setIssue(false)} className={`${big} border border-border text-foreground`}>Cancel</button><button disabled={note.trim().length < 3} onClick={() => advance('issue', note.trim())} className={`${big} bg-primary text-primary-foreground`}>Save and continue</button></>}>
          <Field label="What did you find?" required>{(fid) => <textarea id={fid} rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={areaCls} placeholder="e.g. Light out, gate unlocked" />}</Field>
        </Modal>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
    </Shell>
  );
};

/* ── More: G08 vehicle lookup · G09 item pass check · G13 occupancy · G14 watchlist · G15 handoff ── */
const MORE = [
  { k: 'handoff', label: 'Shift handoff', icon: ClipboardList, desc: 'Read and acknowledge the notes from the last shift' },
  { k: 'vehicles', label: 'Vehicle lookup', icon: Car, desc: 'Check a plate: owner, sticker and OR/CR' },
  { k: 'items', label: 'Item pass check', icon: PackageCheck, desc: 'Verify furniture or appliances leaving the gate' },
  { k: 'occupancy', label: 'Visitor occupancy', icon: Users, desc: 'Who is inside, by property' },
  { k: 'watchlist', label: 'Watchlist', icon: ShieldAlert, desc: 'People and vehicles to watch for (view only)' },
];

const Handoff = () => {
  const { data, error, reload } = useResource('/hub/handoff');
  const save = useSave();
  if (!data) return error ? <Notice tone="danger">{error}</Notice> : null;
  const open = data.items.filter((i) => !i.done).length;
  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
      <section className="rounded-card border border-g-border bg-g-surface p-6">
        <h2 className="text-[20px] font-semibold text-g-text">From {data.from} · {data.shift}</h2>
        <ul className="mt-4 space-y-2">
          {data.items.map((it) => (
            <li key={it.id}>
              <label className="flex items-center gap-4 min-h-[56px] px-3 rounded-[16px] hover:bg-g-surface-2 cursor-pointer">
                <input type="checkbox" className="w-6 h-6 accent-[hsl(var(--primary))]" checked={it.done} onChange={async (e) => { if (await save(() => api.put('/hub/handoff', { items: data.items.map((x) => (x.id === it.id ? { ...x, done: e.target.checked } : x)) }), e.target.checked ? 'Marked as checked' : 'Marked as open')) reload(); }} />
                <span className={`text-[17px] ${it.done ? 'text-g-text-2 line-through' : 'text-g-text'}`}>{it.text}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[15px] text-g-text-2">Notes: {data.notes}</p>
      </section>
      <section className="rounded-card border border-g-border bg-g-surface p-6 space-y-4">
        <p className="text-[22px] font-semibold text-g-text">{data.acknowledged ? 'Handoff acknowledged' : open ? `${open} item${open > 1 ? 's' : ''} to review` : 'All items checked'}</p>
        <p className="text-[15px] text-g-text-2">Acknowledging tells the office you read the handoff. Open items stay on your list.</p>
        <button disabled={data.acknowledged} onClick={async () => { if (await save(() => api.put('/hub/handoff', { acknowledged: true }), 'Handoff acknowledged')) reload(); }} className={`${big} w-full bg-g-accent text-g-on-accent`}>{data.acknowledged ? 'Acknowledged' : 'Acknowledge handoff'}</button>
      </section>
    </div>
  );
};

const VehicleLookup = () => {
  const { data } = useResource('/hub/vehicles');
  const { data: watch } = useResource('/hub/watchlist');
  const [q, setQ] = useState('');
  const norm = (s) => s.replace(/\s/g, '').toUpperCase();
  const hit = q.trim().length >= 3 && data ? data.filter((v) => norm(v.plate).includes(norm(q))) : [];
  const flagged = q.trim().length >= 3 && watch ? watch.filter((w) => w.status === 'active' && w.plate !== '—' && norm(w.plate).includes(norm(q))) : [];
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 h-16 px-5 rounded-full border border-g-border-strong bg-g-surface max-w-xl focus-within:ring-2 focus-within:ring-g-accent">
        <Search className="w-5 h-5 text-g-text-2" aria-hidden="true" /><span className="sr-only">Plate number</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a plate, e.g. NAG 1026" className="flex-1 bg-transparent text-[20px] font-mono uppercase text-g-text placeholder:text-g-text-2 focus:outline-none" />
      </label>
      {flagged.map((w) => <Notice key={w.id} tone="danger">WATCHLIST · {w.name} ({w.plate}) — {w.level === 'deny' ? 'Deny entry' : 'Alert'}: {w.reason}</Notice>)}
      {q.trim().length >= 3 && hit.length === 0 && flagged.length === 0 && <Notice tone="warning">No registered vehicle with that plate. Treat it as a visitor: ask for a pass or log a walk-in.</Notice>}
      <div className="grid md:grid-cols-2 gap-4">
        {hit.map((v) => {
          const expired = new Date(`${v.orcrExpiry}T12:00:00`) < new Date();
          const ok = v.stickerStatus === 'issued' && !expired;
          return (
            <section key={v.id} className={`rounded-card border-2 p-6 ${ok ? 'border-g-ok bg-g-ok-bg' : 'border-g-warn bg-g-warn-bg'}`}>
              <p className="font-mono text-[28px] font-semibold text-g-text">{v.plate}</p>
              <p className="text-[17px] text-g-text">{v.make} · {v.owner}</p>
              <p className="text-[15px] text-g-text-2">{v.property}</p>
              <p className="mt-3 text-[17px] font-semibold" style={{ color: 'inherit' }}>
                <span className={ok ? 'text-g-ok' : 'text-g-warn'}>{ok ? '✓ Resident vehicle — sticker valid' : v.stickerStatus !== 'issued' ? `Sticker ${v.stickerStatus} — check with resident` : 'OR/CR expired — remind the resident'}</span>
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const ItemCheck = () => {
  const { data, reload } = useResource('/hub/itemPasses');
  const save = useSave();
  const [q, setQ] = useState('');
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const rows = useMemo(() => (data || []).filter((p) => ['approved', 'completed'].includes(p.status) && (!q.trim() || `${p.code} ${p.resident} ${p.property}`.toLowerCase().includes(q.trim().toLowerCase()))), [data, q]);
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 h-14 px-5 rounded-full border border-g-border-strong bg-g-surface max-w-xl focus-within:ring-2 focus-within:ring-g-accent">
        <Search className="w-5 h-5 text-g-text-2" aria-hidden="true" /><span className="sr-only">Pass ID or resident</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pass ID or resident name" className="flex-1 bg-transparent text-[17px] text-g-text placeholder:text-g-text-2 focus:outline-none" />
      </label>
      <Notice tone="info">Only HOA-approved item passes appear here. Check the items match before letting them through.</Notice>
      <Table label="Approved item passes" rows={data ? rows : null} empty="No approved item passes match." cols={[
        { k: 'code', label: 'Pass ID', mono: true }, { k: 'resident', label: 'Resident' }, { k: 'items', label: 'Items' }, { k: 'carrier', label: 'Carrier' },
        { k: 'date', label: 'Date', render: (r) => <>{fmtDate(r.date)}{r.date !== today && r.status === 'approved' && <span className="ml-2"><Pill tone="warning">Not today</Pill></span>}</> },
        { k: 'act', label: 'Verify', render: (r) => (r.status === 'completed' ? <Pill tone="success">Verified</Pill>
          : <button disabled={r.date !== today} onClick={async () => { if (await save(() => api.patch(`/hub/itemPasses/${r.id}`, { status: 'completed' }), 'Items verified and logged')) reload(); }} className="h-12 px-4 rounded-full bg-g-accent text-g-on-accent font-semibold disabled:opacity-40">Items match</button>) },
      ]} />
    </div>
  );
};

const Occupancy = () => {
  const { data, error } = useResource('/logs?status=checked_in&limit=100&page=1', { poll: 30000 });
  const groups = useMemo(() => {
    const m = {};
    (data || []).forEach((l) => { const k = l.Property ? `Block ${l.Property.block}, Lot ${l.Property.lot}` : 'Unknown'; (m[k] = m[k] || []).push(l); });
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [data]);
  return (
    <div className="space-y-4">
      {error && <Notice tone="danger">{error}</Notice>}
      <p className="text-[20px] font-semibold text-g-text">{data ? `${data.length} visitor${data.length === 1 ? '' : 's'} inside` : 'Loading…'}</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.map(([prop, list]) => (
          <section key={prop} className="rounded-card border border-g-border bg-g-surface p-5">
            <p className="text-[17px] font-semibold text-g-text">{prop}</p>
            <ul className="mt-2 space-y-1">{list.map((l) => <li key={l.id} className="flex justify-between text-[15px]"><span className="text-g-text">{l.guest_name}</span><span className="font-mono text-g-text-2">{time(l.scanned_at)}</span></li>)}</ul>
          </section>
        ))}
      </div>
      <Link to="/guard/logs?status=checked_in" className={`${big} border border-g-border text-g-text`}>Log exits in “Inside”</Link>
    </div>
  );
};

const GuardWatchlist = () => {
  const { data, error } = useResource('/hub/watchlist');
  return (
    <div className="space-y-4">
      {error && <Notice tone="danger">{error}</Notice>}
      <Notice tone="info">View only. Ask the HOA office to add or remove entries.</Notice>
      <Table label="Watchlist" rows={data ? data.filter((w) => w.status === 'active') : null} rowTone={(r) => (r.level === 'deny' ? 'danger' : null)} cols={[
        { k: 'name', label: 'Person / vehicle' }, { k: 'plate', label: 'Plate', mono: true },
        { k: 'level', label: 'What to do', render: (r) => <Pill tone={r.level === 'deny' ? 'danger' : 'warning'}>{r.level === 'deny' ? 'Deny entry' : 'Alert office'}</Pill> }, { k: 'reason', label: 'Reason' },
      ]} />
    </div>
  );
};

export const More = () => {
  const { tab } = useParams();
  const nav = useNavigate();
  const cur = MORE.find((m) => m.k === tab);
  if (!cur) {
    return (
      <Shell title="More" subtitle="Shift tools and lookups.">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* On phones the rail is gone, so its extra destinations live here */}
          {[{ to: '/guard/incidents', icon: TriangleAlert, label: 'Incidents', desc: 'Report an incident and see open reports.' }, { to: '/guard/patrol', icon: Route, label: 'Patrol', desc: 'Walk the checkpoints for this round.' }].map((m) => (
            <Link key={m.to} to={m.to} className="md:hidden rounded-card border border-g-border bg-g-surface p-5 min-h-[120px] flex flex-col gap-3 hover:border-g-accent">
              <span className="w-12 h-12 rounded-full bg-g-surface-2 text-g-accent-ink flex items-center justify-center"><m.icon className="w-6 h-6" aria-hidden="true" /></span>
              <span className="text-[19px] font-semibold text-g-text">{m.label}</span><span className="text-[15px] text-g-text-2">{m.desc}</span>
            </Link>
          ))}
          {MORE.map((m) => (
            <Link key={m.k} to={`/guard/more/${m.k}`} className="rounded-card border border-g-border bg-g-surface p-6 min-h-[140px] flex flex-col gap-3 hover:border-g-accent">
              <span className="w-12 h-12 rounded-full bg-g-surface-2 text-g-accent-ink flex items-center justify-center"><m.icon className="w-6 h-6" aria-hidden="true" /></span>
              <span className="text-[19px] font-semibold text-g-text">{m.label}</span><span className="text-[15px] text-g-text-2">{m.desc}</span>
            </Link>
          ))}
        </div>
      </Shell>
    );
  }
  return (
    <Shell title={cur.label} subtitle={cur.desc}>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => nav('/guard/more')} className={`${big} h-12 border border-g-border text-g-text`}><ArrowLeft className="w-4 h-4" aria-hidden="true" /> All tools</button>
        <Tabs value={cur.k} onChange={(k) => nav(`/guard/more/${k}`)} label="Tools" items={MORE.map((m) => ({ k: m.k, label: m.label }))} />
      </div>
      {cur.k === 'handoff' && <Handoff />}
      {cur.k === 'vehicles' && <VehicleLookup />}
      {cur.k === 'items' && <ItemCheck />}
      {cur.k === 'occupancy' && <Occupancy />}
      {cur.k === 'watchlist' && <GuardWatchlist />}
    </Shell>
  );
};
