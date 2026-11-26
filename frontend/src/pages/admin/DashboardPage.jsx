import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, DoorOpen, ShieldCheck, ArrowUpRight, UserPlus, Building2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/api/axios';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';

/**
 * Admin dashboard (Figma: MAIN ADMIN PORTAL -- REDESIGN › A01).
 * Tokens: Vistara Theme. Cards radius 24, padding 28, 1 px border, card shadow.
 */

// Read chart colours from the tokens so the chart follows the design system.
const cssVar = (name, fallback) =>
  (typeof window !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue(name).trim()) || fallback;

const STATUS = {
  checked_in: { variant: 'success',     label: 'Entry' },
  used:       { variant: 'neutral',     label: 'Exit' },
  manual:     { variant: 'warning',     label: 'Walk-in' },
  active:     { variant: 'default',     label: 'Pass created' },
  expired:    { variant: 'destructive', label: 'Expired' },
};

const greeting = (d) => (d.getHours() < 12 ? 'Good morning' : d.getHours() < 18 ? 'Good afternoon' : 'Good evening');

const StatTile = ({ label, value, Icon, to, action }) => (
  <Link
    to={to}
    className="group rounded-tile bg-surface-subtle p-5 flex flex-col justify-between min-h-[140px] hover:bg-brand-tint transition-colors"
  >
    <div className="flex items-start justify-between">
      <span className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center">
        <Icon className="w-5 h-5 text-brand" aria-hidden="true" />
      </span>
      <ArrowUpRight className="w-5 h-5 text-ink-muted group-hover:text-brand transition-colors" aria-hidden="true" />
    </div>
    <div>
      <p className="text-[40px] leading-none font-semibold text-ink tabular-nums">
        {value ?? <span className="text-ink-muted/50">—</span>}
      </p>
      <p className="mt-1.5 text-[14px] font-semibold text-ink-muted">
        {label} <span className="sr-only">· {action}</span>
      </p>
    </div>
  </Link>
);

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-2 py-3">
    <div className="h-4 w-14 rounded bg-surface-subtle animate-pulse" />
    <div className="h-4 flex-1 rounded bg-surface-subtle animate-pulse" />
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChart] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(false);
  const now = new Date();
  const brand = cssVar('--brand-primary', '#23402A');
  const muted = cssVar('--text-secondary', '#5F6459');
  const grid = cssVar('--border-default', '#E6DECF');

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/chart-data'), api.get('/logs?limit=8&page=1')])
      .then(([s, c, l]) => {
        setStats(s.data.data);
        setChart(c.data.data || []);
        setLogs(l.data.data || []);
      })
      .catch(() => setError(true))
      .finally(() => setLoad(false));
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 anim-fade-in">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <p className="text-[15px] font-semibold text-ink-muted">{format(now, 'EEEE, MMMM d')}</p>
          <h1 className="text-[40px] leading-tight font-semibold text-ink">
            {greeting(now)}, {(user?.full_name || user?.username || 'Admin').split(' ')[0]}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/residents" className="inline-flex items-center gap-2 h-11 px-5 rounded-full border border-line bg-surface-card text-[15px] font-semibold text-ink hover:bg-surface-subtle">
            <UserPlus className="w-4 h-4" aria-hidden="true" /> Add resident
          </Link>
          <Link to="/guard/logs" className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand text-brand-on text-[15px] font-semibold hover:bg-brand/90">
            <DoorOpen className="w-4 h-4" aria-hidden="true" /> Open gate log
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl bg-status-danger-bg text-status-danger px-5 py-4 text-[15px] font-semibold">
          Couldn’t load dashboard data. Check the server connection and refresh the page.
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left: overview + trend */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <section className="rounded-card border border-line bg-surface-card shadow-card p-7">
            <h2 className="text-2xl font-bold text-ink mb-5">Community overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile label="Residents"     value={stats?.total_residents}  Icon={Users}       to="/admin/residents"  action="Manage residents" />
              <StatTile label="Active guards" value={stats?.active_guards}    Icon={ShieldCheck} to="/admin/users"      action="Manage staff" />
              <StatTile label="Entries today" value={stats?.entries_today}    Icon={DoorOpen}    to="/guard/logs"       action="View gate log" />
              <StatTile label="Properties"    value={stats?.total_properties} Icon={Building2}   to="/admin/properties" action="Manage properties" />
            </div>
          </section>

          <section className="rounded-card border border-line bg-surface-card shadow-card p-7">
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="text-2xl font-bold text-ink">Visitors · last 7 days</h2>
              <span className="text-[13px] font-semibold text-ink-muted">Entries per day</span>
            </div>
            <div className="h-64 w-full">
              {loading ? (
                <div className="h-full rounded-tile bg-surface-subtle animate-pulse" aria-label="Loading chart" />
              ) : chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-ink-muted text-[15px]">No visitor data yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="vtArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={brand} stopOpacity={0.22} />
                        <stop offset="95%" stopColor={brand} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: muted }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 13, fill: muted }} />
                    <Tooltip contentStyle={{ borderRadius: 14, border: `1px solid ${grid}`, fontFamily: 'Urbanist' }} />
                    <Area type="monotone" dataKey="visitors" name="Visitors" stroke={brand} strokeWidth={3} fill="url(#vtArea)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>

        {/* Right: recent gate activity */}
        <section className="w-full xl:w-[440px] shrink-0 rounded-card border border-line bg-surface-card shadow-card p-7 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-ink">Recent gate activity</h2>
            <Link to="/guard/logs" className="text-[14px] font-bold text-brand hover:underline">View all</Link>
          </div>
          <div className="flex-1 -mx-2">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : logs.length === 0 ? (
              <p className="py-10 text-center text-[15px] text-ink-muted">No gate activity yet today.</p>
            ) : (
              <ul className="space-y-1">
                {logs.map((log) => {
                  const s = STATUS[log.status] || STATUS.expired;
                  return (
                    <li key={log.id} className={`flex items-center justify-between gap-3 px-3 py-3 rounded-[14px] ${log.status === 'expired' ? 'bg-status-danger-bg/60' : 'hover:bg-surface-subtle'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[14px] text-ink-muted w-[68px] shrink-0">
                          {format(new Date(log.scanned_at || log.createdAt), 'hh:mm a')}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-ink truncate">{log.guest_name}</p>
                          <p className="text-[13px] text-ink-muted truncate">
                            {log.ScannedBy?.username ? `Logged by ${log.ScannedBy.username}` : 'Resident QR pass'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
