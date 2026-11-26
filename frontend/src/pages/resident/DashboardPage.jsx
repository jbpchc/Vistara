import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  DoorOpen, X, Check, Clock3, Ticket, Package, Car, FileUp, Briefcase, Users, CalendarDays,
  RefreshCw, ArrowRight, CircleCheck, CircleAlert, Circle, CircleX, LogIn, FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

/**
 * Resident home — Figma: MAIN RESIDENT PORTAL -- REDESIGN › H01 (node 1544:4394).
 * Data: GET /dashboard/resident. If the backend does not have it yet, we fall back
 * to /passes/my and show only the sections that data supports.
 */

const Card = ({ className = '', children, ...rest }) => (
  <section className={`rounded-card-home border border-line bg-surface-card p-5 sm:p-7 ${className}`} {...rest}>{children}</section>
);
const Title = ({ children, count, id }) => (
  <h2 id={id} className="flex items-center gap-2.5 text-[22px] font-semibold text-ink">
    {children}
    {count != null && <span className="min-w-[26px] h-[26px] px-2 rounded-full bg-surface-subtle text-[13px] font-bold text-ink-muted flex items-center justify-center">{count}</span>}
  </h2>
);
const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/* Walk-in approval — the one red block on the page (Von Restorff) */
const WalkinAlert = ({ w, onDecide, busy }) => {
  const [left, setLeft] = useState(() => Math.max(0, w.windowSec - Math.floor((Date.now() - new Date(w.requestedAt)) / 1000)));
  useEffect(() => { const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000); return () => clearInterval(t); }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return (
    <section role="alert" aria-labelledby="walkin-title" className="rounded-card-home border-[1.5px] border-status-danger bg-status-danger-bg p-6 flex flex-wrap items-center justify-between gap-5">
      <div className="min-w-0">
        <p id="walkin-title" className="flex items-center gap-2 text-[15px] font-bold text-status-danger"><DoorOpen className="w-5 h-5" aria-hidden="true" /> A visitor is waiting at the gate</p>
        <p className="mt-2 text-[17px] font-semibold text-ink">{w.guest} · {w.purpose}</p>
        <p className="mt-1 text-[14px] text-ink-muted">{[w.address, w.vehicle].filter(Boolean).join(' · ')}</p>
        <p className="mt-2.5 flex items-center gap-2 text-[13px]">
          <Badge variant="warning">Waiting</Badge>
          <span className="font-semibold text-status-danger tabular-nums">{format(new Date(w.requestedAt), 'h:mm a')} · {left > 0 ? `${mm}:${ss} left to respond` : 'Time is up — the guard will call you'}</span>
        </p>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onDecide('deny')} disabled={busy} className="inline-flex items-center gap-2 h-12 px-6 rounded-full border-[1.5px] border-status-danger bg-surface-card text-[15px] font-semibold text-status-danger hover:bg-status-danger-bg disabled:opacity-60">
          <X className="w-4 h-4" aria-hidden="true" /> Deny
        </button>
        <button onClick={() => onDecide('approve')} disabled={busy} className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-brand text-brand-on text-[15px] font-semibold hover:bg-brand/90 disabled:opacity-60">
          <Check className="w-4 h-4" aria-hidden="true" /> Approve
        </button>
      </div>
    </section>
  );
};

const QuickActions = () => {
  const items = [
    { to: '/resident/passes#new-pass', icon: Ticket, title: 'New Visitor Pass', primary: true },
    { to: '/planned/my-home', icon: Package, title: 'Request Item Pass', sub: 'Move items in or out' },
    { to: '/planned/my-home', icon: Car, title: 'Add Vehicle', sub: 'Register for a sticker' },
    { to: '/planned/my-home', icon: FileUp, title: 'Upload Document', sub: 'Send to the HOA' },
  ];
  return (
    <section aria-labelledby="qa-title">
      <h2 id="qa-title" className="text-[16px] font-semibold text-ink mb-3">Quick actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((q) => (
          <Link key={q.title} to={q.to}
            className={`flex items-center gap-4 rounded-[22px] p-5 min-h-[92px] transition-colors ${q.primary ? 'bg-brand-forest text-side-active hover:bg-brand' : 'bg-surface-card border border-line hover:border-home'}`}>
            <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${q.primary ? 'bg-white/10' : 'bg-surface-subtle text-ink'}`}><q.icon className="w-5 h-5" aria-hidden="true" /></span>
            <span>
              <span className={`block text-[16px] font-semibold ${q.primary ? '' : 'text-ink'}`}>{q.title}</span>
              {q.sub && <span className="block text-[13px] text-ink-muted">{q.sub}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

/* Zeigarnik + goal-gradient: unfinished setup stays visible with progress */
const SetupProgress = ({ s, onSkip }) => (
  <section aria-labelledby="setup-title" className="rounded-card-home bg-surface-subtle border border-line p-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 id="setup-title" className="text-[22px] font-semibold text-ink">Make yourself at home</h2>
        <p className="mt-1 text-[14px] text-ink-muted">{s.done} of {s.total} steps complete. Add your household so the HOA knows who lives here.</p>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/planned/household" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand-forest text-side-active text-[15px] font-semibold hover:bg-brand">
          <ArrowRight className="w-4 h-4" aria-hidden="true" /> Resume setup
        </Link>
        <button onClick={onSkip} className="h-11 px-4 rounded-full text-[15px] font-semibold text-ink hover:bg-surface-card">Skip for now</button>
      </div>
    </div>
    <ol className="mt-5 grid grid-cols-2 md:grid-cols-5 gap-4">
      {s.steps.map((st) => (
        <li key={st.label}>
          <span className={`block h-1.5 rounded-full ${st.state === 'done' ? 'bg-brand-forest' : 'bg-line'}`} />
          <span className={`mt-2.5 flex items-center gap-1.5 text-[13px] ${st.state === 'current' ? 'font-semibold text-home-ink' : 'text-ink-muted'}`}>
            {st.state === 'done' ? <CircleCheck className="w-4 h-4" aria-hidden="true" /> : st.state === 'current' ? <CircleAlert className="w-4 h-4" aria-hidden="true" /> : <Circle className="w-4 h-4" aria-hidden="true" />}
            {st.label}<span className="sr-only"> — {st.state === 'done' ? 'done' : st.state === 'current' ? 'next step' : 'not started'}</span>
          </span>
        </li>
      ))}
    </ol>
  </section>
);

const StatCard = ({ label, value, sub, Icon, to }) => (
  <Link to={to} className="rounded-[22px] border border-line bg-surface-card p-5 hover:border-home transition-colors">
    <span className="flex items-center justify-between text-[15px] font-semibold text-ink">{label}<Icon className="w-5 h-5 text-ink-muted" aria-hidden="true" /></span>
    <span className="mt-3 block text-[40px] leading-none font-semibold text-ink tabular-nums">{value}</span>
    <span className="mt-4 block text-[13px] text-ink-muted">{sub}</span>
  </Link>
);

const InsideNow = ({ rows }) => (
  <Card aria-labelledby="in-title">
    <Title id="in-title" count={rows.length}>Visitors inside now</Title>
    <p className="mt-1 text-[14px] text-ink-muted">Today · {format(new Date(), 'MMM d, yyyy')}</p>
    {rows.length === 0 ? <p className="py-8 text-ink-muted">No visitors inside right now.</p> : (
      <div className="mt-5 overflow-x-auto"><table className="w-full text-left min-w-[300px]">
        <thead><tr className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink-muted"><th className="pb-3 font-bold">Visitor / property</th><th className="pb-3 font-bold">Entered</th><th className="pb-3 font-bold hidden md:table-cell">Expected exit</th><th className="pb-3 font-bold">Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-line">
              <td className="py-4"><span className="flex items-center gap-3"><span className="w-10 h-10 rounded-full bg-brand-tint text-brand-forest text-[13px] font-bold flex items-center justify-center">{initials(r.name)}</span><span><span className="block text-[15px] font-semibold text-ink">{r.name}</span><span className="block text-[13px] text-ink-muted">{r.where}</span></span></span></td>
              <td className="py-4 text-[15px] text-ink tabular-nums">{format(new Date(r.entered), 'h:mm a')}</td>
              <td className="py-4 text-[15px] text-ink tabular-nums hidden md:table-cell">{format(new Date(r.expectedExit), 'h:mm a')}</td>
              <td className="py-4"><Badge variant="success">{r.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    )}
    <Link to="/planned/activity" className="mt-4 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:underline">View visit history <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
  </Card>
);

const DocumentAlerts = ({ docs }) => (
  <Card aria-labelledby="doc-title">
    <Title id="doc-title" count={docs.length}>Document alerts</Title>
    <ul className="mt-4 divide-y divide-line">
      {docs.map((d) => (
        <li key={d.title} className="py-4">
          <div className="flex items-center justify-between gap-3"><p className="text-[15px] font-semibold text-ink">{d.title}</p>
            <Badge variant={d.tone === 'danger' ? 'destructive' : 'warning'} dot={false} className="gap-1">{d.tone === 'danger' ? <CircleX className="w-3.5 h-3.5" aria-hidden="true" /> : <Clock3 className="w-3.5 h-3.5" aria-hidden="true" />}{d.status}</Badge></div>
          <p className="mt-1 text-[14px] text-ink-muted">{d.sub}</p>
          <p className="mt-1 text-[14px] text-ink-muted">{d.note}</p>
          <Link to="/planned/my-home" className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:underline">{d.action} <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
        </li>
      ))}
    </ul>
  </Card>
);

const UpcomingVisitors = ({ rows }) => (
  <Card aria-labelledby="up-title">
    <Title id="up-title" count={rows.length}>Upcoming visitors</Title>
    <p className="mt-1 text-[14px] text-ink-muted">Next 7 days</p>
    <ul className="mt-4 divide-y divide-line">
      {rows.length === 0 && <li className="py-6 text-ink-muted">No visitors scheduled. <Link to="/resident/passes#new-pass" className="font-semibold text-ink underline">Create a pass</Link></li>}
      {rows.map((r) => (
        <li key={r.name + r.date} className="py-4 grid grid-cols-[1fr_auto] sm:grid-cols-[130px_1fr_auto] gap-x-4 gap-y-1 items-start">
          <span className="col-span-2 sm:col-span-1 text-[15px] font-semibold text-ink">{format(new Date(`${r.date}T12:00:00`), 'MMM d, yyyy')}</span>
          <span><span className="block text-[15px] font-semibold text-ink">{r.name}</span><span className="block text-[13px] text-ink-muted">{r.kind} · {r.where}</span></span>
          <Badge variant="warning" dot={false} className="gap-1"><Clock3 className="w-3.5 h-3.5" aria-hidden="true" />Upcoming</Badge>
        </li>
      ))}
    </ul>
    <Link to="/resident/passes" className="mt-2 inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:underline">View all passes <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link>
  </Card>
);

const LeaseAlert = ({ l }) => (
  <Card aria-labelledby="lease-title">
    <Title id="lease-title" count={1}>Lease alerts</Title>
    <p className="mt-1 text-[14px] text-ink-muted">Leases ending within 60 days</p>
    <div className="mt-4 flex items-center justify-between"><p className="text-[15px] font-semibold text-ink">{l.tenant}</p><Badge variant="warning" dot={false} className="gap-1"><Clock3 className="w-3.5 h-3.5" aria-hidden="true" />{l.daysLeft} days left</Badge></div>
    <p className="mt-1 text-[14px] text-ink-muted">{l.where}</p>
    <div className="mt-4 rounded-[20px] bg-status-warn-bg p-5">
      <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-status-warn">Lease ends</p>
      <p className="mt-1 text-[24px] font-semibold text-ink">{format(new Date(`${l.ends}T12:00:00`), 'MMM d, yyyy')}</p>
      <p className="mt-1 text-[14px] text-ink-muted">Renew to keep your tenant’s access</p>
    </div>
    <div className="mt-4 flex gap-3">
      <Link to="/planned/tenants" className="flex-1 inline-flex items-center justify-center h-11 rounded-full border border-line text-[15px] font-semibold text-ink hover:bg-surface-subtle">Renew lease</Link>
      <Link to="/planned/household" className="inline-flex items-center justify-center h-11 px-4 rounded-full text-[15px] font-semibold text-ink hover:bg-surface-subtle">View tenants</Link>
    </div>
  </Card>
);

const NOTE_ICON = { gate: DoorOpen, entry: LogIn, doc: FileText };
const Notifications = ({ items }) => (
  <Card aria-labelledby="nt-title">
    <div className="flex items-center justify-between"><Title id="nt-title" count={items.length}>Latest notifications</Title>
      <Link to="/planned/activity" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink hover:underline">See all notifications <ArrowRight className="w-4 h-4" aria-hidden="true" /></Link></div>
    <p className="mt-1 text-[14px] text-ink-muted">{format(new Date(), 'MMM d, yyyy')} · {items.length} unread</p>
    <ul className="mt-5 grid md:grid-cols-3 gap-4">
      {items.map((n) => {
        const Icon = NOTE_ICON[n.icon] || FileText;
        return (
          <li key={n.title} className="rounded-[22px] bg-surface-subtle p-5">
            <p className="flex items-center justify-between text-[13px] text-ink-muted"><span className="flex items-center gap-2"><Icon className="w-4 h-4 text-home-ink" aria-hidden="true" />{format(new Date(n.time), 'h:mm a')}</span><span className="w-2 h-2 rounded-full bg-ink" aria-hidden="true" /><span className="sr-only">Unread</span></p>
            <p className="mt-3 text-[15px] font-semibold text-ink">{n.title}</p>
            <p className="mt-1 text-[14px] text-ink-muted">{n.body}</p>
            <Link to="/planned/activity" className="mt-3 inline-block text-[15px] font-semibold text-ink hover:underline">{n.action}</Link>
          </li>
        );
      })}
    </ul>
  </Card>
);

/* Fallback when /dashboard/resident is not available: use /passes/my */
const legacyFeed = async () => {
  const r = await api.get('/passes/my');
  const ps = r.data.data || [];
  const where = (p) => (p.Property ? `Block ${p.Property.block}, Lot ${p.Property.lot}` : '');
  return {
    walkin: null, setup: null, documents: [], lease: null, notifications: [],
    stats: { activePasses: ps.filter((p) => p.status === 'active').length, inside: ps.filter((p) => p.status === 'checked_in').length, upcoming: ps.filter((p) => p.status === 'active').length },
    inside: ps.filter((p) => p.status === 'checked_in').map((p) => ({ name: p.guest_name, where: where(p), entered: p.scanned_at, expectedExit: new Date(new Date(p.scanned_at).getTime() + 3 * 3600e3).toISOString(), status: 'On time' })),
    upcoming: ps.filter((p) => p.status === 'active').map((p) => ({ date: p.expected_date, name: p.guest_name, kind: p.purpose || 'Visit', where: where(p) })),
  };
};

const ResidentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [d, setD] = useState(null);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [updated, setUpdated] = useState(new Date());
  const [hideSetup, setHideSetup] = useState(false);

  const load = useCallback(() => {
    api.get('/dashboard/resident')
      .then((r) => setD(r.data.data))
      .catch(() => legacyFeed().then(setD).catch(() => setError(true)))
      .finally(() => setUpdated(new Date()));
  }, []);
  // Poll so a walk-in request shows up without refreshing (the guard is waiting).
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  const decide = async (decision) => {
    setBusy(true);
    try {
      const r = await api.post(`/walkins/${d.walkin.id}/decision`, { decision });
      toast({ variant: 'success', title: decision === 'approve' ? 'Visitor approved' : 'Visitor denied', description: r.data.message });
      load();
    } catch {
      toast({ variant: 'destructive', title: 'Could not send your answer', description: 'Please call the guard house.' });
    } finally { setBusy(false); }
  };

  const first = (user?.full_name || user?.username || 'neighbor').split(/[\s_]+/)[0].replace(/^\w/, (c) => c.toUpperCase());
  const hour = new Date().getHours();

  return (
    <div className="max-w-[1180px] mx-auto space-y-7 anim-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[44px] leading-tight font-semibold text-ink">{hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'}, {first}.</h1>
          <p className="mt-1 text-[15px] text-ink-muted">Here’s what’s happening across your properties.</p>
        </div>
        <div className="sm:text-right">
          <p className="text-[15px] font-semibold text-ink">{format(new Date(), 'EEEE · MMM dd, yyyy')}</p>
          <p className="text-[13px] text-ink-muted">Last updated {format(updated, 'h:mm a')} · Asia/Manila</p>
          <button onClick={load} className="mt-1 inline-flex items-center gap-1.5 h-10 px-3 rounded-full text-[14px] font-semibold text-ink hover:bg-surface-subtle"><RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh</button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-2xl bg-status-danger-bg text-status-danger px-5 py-4 text-[15px] font-semibold">Couldn’t load your home dashboard. Check your connection and tap Refresh.</div>}
      {!d && !error && <div className="h-[360px] rounded-card-home bg-surface-subtle animate-pulse" />}

      {d && (
        <>
          {d.walkin && <WalkinAlert w={d.walkin} onDecide={decide} busy={busy} />}
          <QuickActions />
          {d.setup && !hideSetup && <SetupProgress s={d.setup} onSkip={() => setHideSetup(true)} />}
          <div className="grid md:grid-cols-3 gap-4">
            <StatCard label="Active passes" value={d.stats.activePasses} sub="Valid today" Icon={Briefcase} to="/resident/passes" />
            <StatCard label="Visitors inside now" value={d.stats.inside} sub={d.stats.inside ? 'All on time' : 'Nobody inside'} Icon={Users} to="/planned/activity" />
            <StatCard label="Upcoming visitors" value={d.stats.upcoming} sub="Next 7 days" Icon={CalendarDays} to="/resident/passes" />
          </div>
          <div className="grid lg:grid-cols-[1.45fr_1fr] gap-6 items-start">
            <div className="space-y-6 min-w-0">
              <InsideNow rows={d.inside} />
              <UpcomingVisitors rows={d.upcoming} />
            </div>
            <div className="space-y-6 min-w-0">
              {d.documents.length > 0 && <DocumentAlerts docs={d.documents} />}
              {d.lease && <LeaseAlert l={d.lease} />}
            </div>
          </div>
          {d.notifications.length > 0 && <Notifications items={d.notifications} />}
        </>
      )}
    </div>
  );
};

export default ResidentDashboard;
