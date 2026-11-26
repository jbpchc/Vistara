import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TriangleAlert, UserX, FileText, KeyRound, Car, ChevronRight, Download, ClipboardCheck,
  Users, LogIn, Ticket, Package, Clock3, CheckCircle2, X,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

/**
 * Admin dashboard — Figma: MAIN ADMIN PORTAL -- REDESIGN › A01 (node 1521:9492).
 * Data: GET /dashboard/admin (composite feed). If the backend does not have it yet,
 * we fall back to /admin/stats + /logs and hide the sections that need new endpoints.
 */

const Card = ({ className = '', children, ...rest }) => (
  <section className={`rounded-card border border-line bg-surface-card shadow-card p-7 ${className}`} {...rest}>{children}</section>
);
const Eyebrow = ({ children }) => <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink-muted">{children}</p>;
const H2 = ({ children, id }) => <h2 id={id} className="mt-1 text-[22px] font-semibold text-ink">{children}</h2>;

const SEVERITY = {
  critical: { variant: 'destructive', label: 'Critical' },
  overdue: { variant: 'warning', label: 'Overdue' },
  upcoming: { variant: 'neutral', label: 'Upcoming' },
};
const KIND_ICON = { incident: TriangleAlert, overstay: UserX, documents: FileText, leases: KeyRound, vehicles: Car };
const KIND_LINK = { incident: '/planned/incidents', overstay: '/guard/logs?status=checked_in', documents: '/planned/documents', leases: '/planned/tenants', vehicles: '/planned/vehicles' };
const QUEUE_ICON = { file: FileText, package: Package, alert: TriangleAlert };
const QUEUE_LINK = { file: '/planned/documents', package: '/planned/item-passes', alert: '/planned/incidents' };

const greeting = (d) => (d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening');

/* ─── Sections ─────────────────────────────────────────────────────────────── */
const NeedsAttention = ({ items }) => (
  <Card className="flex-1 min-w-0" aria-labelledby="attn-title">
    <div className="flex items-start justify-between gap-3">
      <div>
        <Eyebrow>Needs attention</Eyebrow>
        <H2 id="attn-title">{items.length} follow-ups, most urgent first</H2>
      </div>
      <Badge variant="neutral">Sorted by urgency</Badge>
    </div>
    <ul className="mt-5 space-y-2.5">
      {items.map((it) => {
        const Icon = KIND_ICON[it.kind] || TriangleAlert;
        const sev = SEVERITY[it.severity] || SEVERITY.upcoming;
        const critical = it.severity === 'critical';
        return (
          <li key={it.id}
            className={`flex items-center gap-4 rounded-[18px] px-4 py-3.5 ${critical ? 'bg-status-danger-bg border-[1.5px] border-status-danger' : 'bg-surface-subtle'}`}>
            <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${critical ? 'bg-status-danger text-brand-on' : 'bg-surface-card text-ink'}`}>
              <Icon className="w-5 h-5" aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-[16px] font-semibold truncate ${critical ? 'text-status-danger' : 'text-ink'}`}>{it.title}</p>
              <p className="text-[13px] text-ink-muted truncate">{it.meta}</p>
            </div>
            <Badge variant={sev.variant} className="hidden md:inline-flex bg-transparent">{sev.label}</Badge>
            {/* Von Restorff + Hick: only the critical item gets the primary button */}
            <Link to={KIND_LINK[it.kind] || '/admin/dashboard'}
              className={`shrink-0 inline-flex items-center h-11 px-5 rounded-full text-[14px] font-semibold ${critical ? 'bg-brand text-brand-on hover:bg-brand/90' : 'bg-surface-card border border-line text-ink hover:bg-surface-subtle'}`}>
              {it.action}
            </Link>
          </li>
        );
      })}
    </ul>
  </Card>
);

const GateToday = ({ t }) => {
  const max = Math.max(...t.hourly.map((h) => Math.max(h.today, h.avg)), 1);
  return (
    <Card className="w-full xl:w-[440px] shrink-0" aria-labelledby="gate-title">
      <div className="flex items-center justify-between">
        <Eyebrow>Gate today</Eyebrow>
        <Badge variant="success">Live</Badge>
      </div>
      <p id="gate-title" className="mt-3 flex items-baseline gap-2">
        <span className="text-[64px] leading-none font-semibold text-ink tabular-nums">{t.entries}</span>
        <span className="text-[17px] text-ink-muted">entries</span>
      </p>
      {t.delta != null && (
        <p className="mt-3 text-[14px] text-ink-muted"><span className="font-semibold text-status-ok">+{t.delta}%</span> vs yesterday · peak {t.peak}</p>
      )}
      {t.hourly.length > 0 && (
        <figure className="mt-5" aria-label={`Entries per hour today; peak ${t.peak}`}>
          <div className="flex items-end gap-1.5 h-[92px]">
            {t.hourly.map((h, i) => (
              <span key={i} className={`flex-1 rounded-full ${h.past ? 'bg-brand' : 'bg-chart-muted'}`}
                style={{ height: `${Math.max(8, ((h.past ? h.today : h.avg) / max) * 100)}%` }} />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-ink-muted">{t.hours.map((h) => <span key={h}>{h}</span>)}</div>
          <figcaption className="mt-1 text-[12px] text-ink-muted">Dark: today so far · light: 7-day average for later hours</figcaption>
        </figure>
      )}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { icon: Users, label: 'Inside now', v: t.inside, to: '/guard/logs?status=checked_in' },
          { icon: LogIn, label: 'Walk-ins', v: t.walkins, to: '/guard/logs' },
          { icon: Ticket, label: 'Active passes', v: t.activePasses, to: '/planned/visitor-passes' },
          { icon: TriangleAlert, label: 'Denied scans', v: t.denied, to: '/guard/logs', danger: true },
        ].filter((s) => s.v != null).map((s) => (
          <Link key={s.label} to={s.to} className={`rounded-tile p-4 hover:ring-2 hover:ring-brand/20 ${s.danger ? 'bg-status-danger-bg' : 'bg-surface-subtle'}`}>
            <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${s.danger ? 'text-status-danger' : 'text-ink-muted'}`}>
              <s.icon className="w-4 h-4" aria-hidden="true" /> {s.label}
            </span>
            <span className={`mt-1 block text-[28px] font-semibold tabular-nums ${s.danger ? 'text-status-danger' : 'text-ink'}`}>{s.v}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
};

const ReviewQueues = ({ queues }) => {
  const done = queues.reduce((a, q) => a + q.done, 0), total = queues.reduce((a, q) => a + q.total, 0);
  return (
    <Card aria-labelledby="rq-title">
      <Eyebrow>Review queues</Eyebrow>
      <H2 id="rq-title">{done} of {total} cleared today</H2>
      {/* Goal-gradient: progress toward clearing each queue */}
      <ul className="mt-5 space-y-3">
        {queues.map((q) => {
          const Icon = QUEUE_ICON[q.icon] || FileText;
          return (
            <li key={q.name}>
              <Link to={QUEUE_LINK[q.icon] || '/admin/dashboard'} className="flex items-center gap-4 rounded-[18px] bg-surface-subtle px-4 py-4 hover:ring-2 hover:ring-brand/20">
                <span className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-ink" aria-hidden="true" /></span>
                <span className="flex-1 min-w-0">
                  <span className="flex justify-between text-[15px]"><span className="font-semibold text-ink">{q.name}</span><span className="text-ink-muted tabular-nums">{q.done}/{q.total}</span></span>
                  <span className="mt-2 block h-2 rounded-full bg-surface-card overflow-hidden" role="progressbar" aria-valuenow={q.done} aria-valuemin={0} aria-valuemax={q.total} aria-label={`${q.name} cleared`}>
                    <span className={`block h-full rounded-full ${q.danger ? 'bg-status-danger' : 'bg-brand'}`} style={{ width: `${(q.done / q.total) * 100}%` }} />
                  </span>
                  <span className={`mt-1.5 block text-[13px] ${q.danger ? 'text-status-danger' : 'text-ink-muted'}`}>{q.meta}</span>
                </span>
                <ChevronRight className="w-5 h-5 text-ink-muted" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
};

const ComingUp = ({ items }) => (
  <Card aria-labelledby="cu-title">
    <Eyebrow>Coming up</Eyebrow>
    <H2 id="cu-title">Next 30 days</H2>
    <ul className="mt-5 divide-y divide-line">
      {items.map((e) => {
        const d = new Date(`${e.day}T12:00:00`);
        return (
          <li key={e.title} className="flex items-center gap-4 py-3.5">
            <span className="w-14 h-14 rounded-2xl border border-line flex flex-col items-center justify-center shrink-0">
              <span className="text-[18px] font-bold text-ink leading-none">{format(d, 'dd')}</span>
              <span className="text-[11px] font-bold text-ink-muted uppercase">{format(d, 'MMM')}</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-semibold text-ink truncate">{e.title}</span>
              <span className="block text-[13px] text-ink-muted truncate">{e.meta}</span>
            </span>
            <Badge variant={e.warn ? 'warning' : 'neutral'}>{e.tag}</Badge>
          </li>
        );
      })}
    </ul>
  </Card>
);

const EntryMix = ({ mix, total, note }) => (
  <Card aria-labelledby="mix-title">
    <Eyebrow>Entry mix · today</Eyebrow>
    <H2 id="mix-title">{total} successful entries</H2>
    <ul className="mt-5 space-y-5">
      {mix.map((m) => (
        <li key={m.label}>
          <div className="flex justify-between text-[15px]"><span className="font-semibold text-ink">{m.label}</span><span className="text-ink"><b className="tabular-nums">{m.count}</b> <span className="text-ink-muted text-[13px]">{m.pct}%</span></span></div>
          <div className="mt-2 h-2 rounded-full bg-surface-subtle overflow-hidden"><div className={`h-full rounded-full ${m.warn ? 'bg-status-warn' : 'bg-brand'}`} style={{ width: `${m.pct}%` }} /></div>
        </li>
      ))}
    </ul>
    {note && (
      <p className="mt-6 flex items-center gap-2 rounded-2xl bg-status-danger-bg px-4 py-3 text-[14px] font-semibold text-status-danger">
        <TriangleAlert className="w-4 h-4 shrink-0" aria-hidden="true" /> {note}
      </p>
    )}
  </Card>
);

const RESULT = {
  allowed: { variant: 'success', label: () => 'Allowed' },
  denied: { variant: 'destructive', label: (r) => `Denied · ${r}` },
  walkin: { variant: 'warning', label: (r) => `Walk-in · ${r}` },
};

const RecentActivity = ({ rows, totals }) => {
  const [filter, setFilter] = useState('all');
  const shown = rows.filter((r) => filter === 'all' || (filter === 'denied' ? r.result === 'denied' : r.result === 'walkin'));
  const cols = 'grid grid-cols-[92px_80px_1.4fr_110px_1.2fr_1fr_1.4fr] items-center gap-3';
  return (
    <Card aria-labelledby="ra-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><Eyebrow>Recent gate activity</Eyebrow><H2 id="ra-title">Latest scans at the main gate</H2></div>
        <div className="flex items-center gap-3">
          <div role="tablist" aria-label="Filter scans" className="flex p-1 rounded-full bg-surface-subtle">
            {[['all', `All · ${totals.all}`], ['denied', `Denied · ${totals.denied}`], ['walkin', `Walk-ins · ${totals.walkins}`]].map(([k, l]) => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className={`h-10 px-4 rounded-full text-[14px] font-semibold ${filter === k ? 'bg-brand text-brand-on' : 'text-ink-muted hover:text-ink'}`}>{l}</button>
            ))}
          </div>
          <Link to="/guard/logs" className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-line text-[15px] font-semibold text-ink hover:bg-surface-subtle">
            <Clock3 className="w-4 h-4" aria-hidden="true" /> View gate log
          </Link>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto">
        <div role="table" aria-label="Latest gate scans" className="min-w-[860px]">
          <div role="row" className={`${cols} rounded-[14px] bg-surface-subtle px-4 py-3.5 text-[13px] font-semibold text-ink-muted`}>
            {['Time', 'Direction', 'Visitor', 'Plate', 'Destination', 'Guard', 'Result'].map((h) => <span key={h} role="columnheader">{h}</span>)}
          </div>
          {shown.map((r, i) => {
            const res = RESULT[r.result] || RESULT.allowed;
            return (
              <div key={i} role="row" className={`${cols} mt-1 rounded-[14px] px-4 py-3.5 text-[15px] ${r.result === 'denied' ? 'bg-status-danger-bg/70' : ''}`}>
                <span role="cell" className="font-mono text-[14px] text-ink">{format(new Date(r.time), 'h:mm a')}</span>
                <span role="cell" className="text-ink">{r.dir}</span>
                <span role="cell" className="text-ink truncate">{r.visitor}</span>
                <span role="cell" className="font-mono text-[14px] text-ink">{r.plate}</span>
                <span role="cell" className="text-ink truncate">{r.dest}</span>
                <span role="cell" className="text-ink truncate">{r.guard}</span>
                <span role="cell"><Badge variant={res.variant}>{res.label(r.reason)}</Badge></span>
              </div>
            );
          })}
          {shown.length === 0 && <p className="py-8 text-center text-ink-muted">Nothing matches this filter.</p>}
        </div>
      </div>
      <p className="mt-4 text-[13px] text-ink-muted">Showing {shown.length} of {totals.all} events today · gate log entries are read-only</p>
    </Card>
  );
};

/* ─── Fallback: build what we can from the existing API ───────────────────── */
const legacyFeed = async () => {
  const [s, l] = await Promise.all([api.get('/admin/stats'), api.get('/logs?limit=8&page=1')]);
  const st = s.data.data || {};
  const logs = l.data.data || [];
  return {
    attention: [], queues: [], upcoming: [], mix: [],
    today: { entries: st.entries_today ?? 0, hourly: [], hours: [], inside: logs.filter((x) => x.status === 'checked_in').length },
    recent: logs.map((x) => ({
      time: x.scanned_at || x.createdAt, dir: x.status === 'used' ? 'Exit' : 'Entry', visitor: x.guest_name, plate: x.plate_number || '—',
      dest: x.Property ? `B${x.Property.block} L${x.Property.lot}` : '—', guard: x.ScannedBy?.username || '—', result: 'allowed',
    })),
    totals: { all: logs.length, denied: 0, walkins: 0 },
  };
};

/* ─── Page ─────────────────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState(false);
  const [toast, setToast] = useState(null);
  const now = new Date();

  useEffect(() => {
    api.get('/dashboard/admin')
      .then((r) => setD(r.data.data))
      .catch(() => legacyFeed().then(setD).catch(() => setError(true)));
  }, []);

  const exportSnapshot = () => {
    if (!d) return;
    const rows = [['Time', 'Direction', 'Visitor', 'Plate', 'Destination', 'Guard', 'Result'],
      ...d.recent.map((r) => [format(new Date(r.time), 'yyyy-MM-dd HH:mm'), r.dir, r.visitor, r.plate, r.dest, r.guard, r.result + (r.reason ? ` (${r.reason})` : '')])];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `vistara-gate-snapshot-${format(now, 'yyyyMMdd-HHmm')}.csv`; a.click();
    setToast('Snapshot exported as CSV');
  };
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  const critical = d?.attention.filter((a) => a.severity === 'critical').length || 0;
  const overdueDocs = d?.attention.find((a) => a.kind === 'documents');

  return (
    <div className="max-w-[1480px] mx-auto space-y-6 anim-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-[44px] leading-tight font-semibold text-ink">
            {greeting(now)}, {displayFirst(user)}
          </h1>
          <p className="mt-1 text-[16px] text-ink-muted">
            {format(now, 'EEEE, MMMM d')}
            {d && critical > 0 && <> · <Link to="/planned/incidents" className="font-semibold text-status-danger hover:underline">{critical} critical incident</Link></>}
            {d && overdueDocs && <> and {overdueDocs.title.split(' ')[0]} overdue documents need you today.</>}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportSnapshot} disabled={!d} className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-line bg-surface-card text-[15px] font-semibold text-ink hover:bg-surface-subtle disabled:opacity-50">
            <Download className="w-4 h-4" aria-hidden="true" /> Export snapshot
          </button>
          <Link to="/planned/documents" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand text-brand-on text-[15px] font-semibold hover:bg-brand/90">
            <ClipboardCheck className="w-4 h-4" aria-hidden="true" /> Open review queue
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl bg-status-danger-bg text-status-danger px-5 py-4 text-[15px] font-semibold">
          Couldn’t load dashboard data. Check the server connection and refresh the page.
        </div>
      )}

      {!d && !error && <div className="grid gap-6 xl:grid-cols-[1fr_440px]"><div className="h-[420px] rounded-card bg-surface-subtle animate-pulse" /><div className="h-[420px] rounded-card bg-surface-subtle animate-pulse" /></div>}

      {d && (
        <>
          <div className="flex flex-col xl:flex-row gap-6">
            {d.attention.length > 0 && <NeedsAttention items={d.attention} />}
            <GateToday t={d.today} />
          </div>
          {(d.queues.length > 0 || d.upcoming.length > 0 || d.mix.length > 0) && (
            <div className="grid gap-6 lg:grid-cols-3">
              {d.queues.length > 0 && <ReviewQueues queues={d.queues} />}
              {d.upcoming.length > 0 && <ComingUp items={d.upcoming} />}
              {d.mix.length > 0 && <EntryMix mix={d.mix} total={d.today.entries} note={d.deniedNote} />}
            </div>
          )}
          <RecentActivity rows={d.recent} totals={d.totals} />
        </>
      )}

      {/* Peak-end: clear confirmation, with undo where it applies */}
      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-brand-forest pl-3 pr-2 py-2 text-side-active shadow-modal">
          <CheckCircle2 className="w-6 h-6 text-status-ok-bg" aria-hidden="true" />
          <span className="text-[15px] font-semibold">{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

const displayFirst = (u) => (u?.full_name || u?.username || 'Admin').split(/[\s_]+/)[0].replace(/^\w/, (c) => c.toUpperCase());

export default AdminDashboard;
