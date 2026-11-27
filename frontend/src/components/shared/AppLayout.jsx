import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, ChevronRight, Plus, Search, Bell, PanelLeft, Sun, Moon,
  LayoutGrid, Ticket, Clock3, Users, ShieldAlert, FileText, Package, TriangleAlert,
  House, User, KeyRound, Car, ChartColumn, History, SlidersHorizontal,
  ScanLine, UserPlus, Route, Siren, Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';

/**
 * One design system, three deliberately different shells, matching the Figma frames:
 *   AdminShell    → A01  (dark forest sidebar, grouped nav, utility top bar)
 *   ResidentShell → H01  (warm top-pill navigation, HOMEOWNER tag)
 *   GuardShell    → G02  (Night/Day tablet console, nav rail with Scan + SOS)
 */
const BASE = import.meta.env.BASE_URL;

/* ─── Shared hooks ───────────────────────────────────────────────────────────── */
const useNow = (ms = 1000) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t); }, [ms]);
  return now;
};

const useOnline = () => {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true); const down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
};

const useOutside = (ref, onOut) => {
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onOut(); };
    const k = (e) => { if (e.key === 'Escape') onOut(); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [ref, onOut]);
};

const displayName = (u) => u?.full_name || u?.username || 'User';
const initialsOf = (u) => displayName(u).split(/[\s_]+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const SignOutItem = ({ className }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  return (
    <button
      id="user-menu-signout-btn"
      role="menuitem"
      onClick={() => { logout(); navigate('/login', { replace: true }); }}
      className={`flex items-center gap-2.5 w-full px-4 h-11 text-sm font-semibold transition-colors ${className}`}
    >
      <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
    </button>
  );
};

/* ═══ ADMIN (A01) ════════════════════════════════════════════════════════════ */
const ADMIN_NAV = [
  { group: 'Overview', items: [{ to: '/admin/dashboard', icon: LayoutGrid, label: 'Dashboard' }] },
  { group: 'Gate', items: [
    { to: '/admin/passes', icon: Ticket, label: 'Visitor passes' },
    { to: '/guard/logs', icon: Clock3, label: 'Gate log', match: (l) => l.pathname === '/guard/logs' && !l.search.includes('checked_in') },
    { to: '/guard/logs?status=checked_in', icon: Users, label: 'Currently inside', badgeKey: 'inside', match: (l) => l.pathname === '/guard/logs' && l.search.includes('checked_in') },
    { to: '/admin/watchlist', icon: ShieldAlert, label: 'Watchlist' },
  ] },
  { group: 'Review queues', items: [
    { to: '/admin/documents', icon: FileText, label: 'Documents' },
    { to: '/admin/item-passes', icon: Package, label: 'Item gate passes' },
    { to: '/admin/incidents', icon: TriangleAlert, label: 'Incidents', badgeKey: 'incidents' },
  ] },
  { group: 'Registry', items: [
    { to: '/admin/properties', icon: House, label: 'Properties' },
    { to: '/admin/residents', icon: User, label: 'Residents & households' },
    { to: '/admin/tenants', icon: KeyRound, label: 'Tenants & leases' },
    { to: '/admin/vehicles', icon: Car, label: 'Vehicles & stickers' },
  ] },
  { group: 'Administration', items: [
    { to: '/admin/reports', icon: ChartColumn, label: 'Reports' },
    { to: '/admin/audit', icon: History, label: 'Audit log' },
    { to: '/admin/users', icon: Users, label: 'Users & roles' },
    { to: '/admin/settings', icon: SlidersHorizontal, label: 'Settings' },
  ] },
];

const ADMIN_TITLES = {
  '/admin/dashboard': 'Dashboard', '/admin/residents': 'Residents & households', '/admin/users': 'Users & roles',
  '/admin/properties': 'Properties', '/guard/logs': 'Gate log', '/admin/incidents': 'Incidents',
  '/admin/passes': 'Visitor passes', '/admin/documents': 'Documents', '/admin/item-passes': 'Item gate passes', '/admin/tenants': 'Tenants & leases',
  '/admin/vehicles': 'Vehicles & stickers', '/admin/watchlist': 'Watchlist', '/admin/reports': 'Reports', '/admin/audit': 'Audit log',
  '/admin/settings': 'Settings', '/admin/notifications': 'Notifications',
};

const AdminSidebar = ({ open, onToggle, counts }) => {
  const { user } = useAuth();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setMenu(false));

  const isActive = (it) => (it.match ? it.match(loc) : loc.pathname === it.to || loc.pathname.startsWith(`${it.to}/`));

  return (
    <aside className={`hidden lg:flex flex-col h-screen sticky top-0 shrink-0 bg-brand-forest transition-all duration-300 ${open ? 'w-[260px]' : 'w-[84px]'}`}>
      <div className="flex items-start justify-between px-4 pt-6 pb-4">
        {open && (
          <div className="pl-2">
            <img src={`${BASE}camella-naga-logo-reversed.svg`} alt="Camella Naga" className="w-[150px] h-auto select-none" draggable={false} />
            <p className="mt-1.5 text-[11px] font-bold tracking-[0.12em] text-side-text/80">VISTARA · ADMIN PORTAL</p>
          </div>
        )}
        <button onClick={onToggle} aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          className={`w-11 h-11 rounded-xl border border-white/15 flex items-center justify-center text-side-text hover:text-side-active hover:bg-white/5 ${open ? '' : 'mx-auto'}`}>
          <PanelLeft className="w-5 h-5" />
        </button>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
        {ADMIN_NAV.map(({ group, items }) => (
          <div key={group} className="mt-3">
            {open && <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-side-text/70">{group}</p>}
            <ul className="space-y-0.5">
              {items.map((it) => {
                const active = isActive(it);
                const badge = it.badgeKey ? (counts[it.badgeKey] || null) : it.badge;
                return (
                  <li key={it.label}>
                    <Link to={it.to} title={open ? undefined : it.label} aria-current={active ? 'page' : undefined}
                      className={`flex items-center h-11 rounded-xl px-3 text-[15px] font-semibold transition-colors ${active ? 'bg-side-active text-brand-forest' : 'text-side-text hover:bg-white/5 hover:text-side-active'}`}>
                      <it.icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                      {open && <span className="ml-3 flex-1 truncate">{it.label}</span>}
                      {open && badge != null && (
                        <span className={`ml-2 min-w-[28px] h-6 px-2 rounded-full text-[12px] font-bold flex items-center justify-center ${active ? 'bg-brand-forest text-side-active' : 'bg-side-badge text-side-active'}`}>{badge}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div ref={ref} className="relative p-3">
        <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}
          className="w-full flex items-center gap-3 rounded-2xl bg-side-badge px-3 py-3 text-left hover:bg-side-badge/80">
          <span className="w-10 h-10 rounded-full bg-side-active text-brand-forest flex items-center justify-center text-[13px] font-bold shrink-0">{initialsOf(user)}</span>
          {open && (
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-bold text-side-active truncate">{displayName(user)}</span>
              <span className="block text-[12px] text-side-text">HOA Administrator</span>
            </span>
          )}
          {open && <ChevronRight className="w-4 h-4 text-side-text" aria-hidden="true" />}
        </button>
        {menu && (
          <div role="menu" className="absolute left-3 right-3 bottom-full mb-2 rounded-2xl border border-line bg-surface-card shadow-modal overflow-hidden">
            <SignOutItem className="text-status-danger hover:bg-status-danger-bg" />
          </div>
        )}
      </div>
    </aside>
  );
};

const NewMenu = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setOpen(false));
  const items = [
    { to: '/admin/passes', label: 'Visitor pass' },
    { to: '/admin/residents', label: 'Resident' },
    { to: '/admin/properties', label: 'Property' },
    { to: '/admin/users', label: 'Staff account' },
  ];
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand text-brand-on text-[15px] font-semibold hover:bg-brand/90">
        <Plus className="w-4 h-4" aria-hidden="true" /> New
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-line bg-surface-card shadow-modal overflow-hidden z-50">
          {items.map((i) => (
            <Link key={i.label} role="menuitem" to={i.to} onClick={() => setOpen(false)} className="flex items-center h-11 px-4 text-[15px] font-semibold text-ink hover:bg-surface-subtle">{i.label}</Link>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminShell = ({ children }) => {
  const [open, setOpen] = useState(true);
  const now = useNow(30000);
  const online = useOnline();
  const loc = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [q, setQ] = useState('');

  // Jakob: "/" focuses search, like most admin tools
  useEffect(() => {
    const h = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) { e.preventDefault(); searchRef.current?.focus(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const title = loc.pathname.startsWith('/admin/documents/') ? 'Documents › Review' : ADMIN_TITLES[loc.pathname] || 'Dashboard';

  // Live counts for the sidebar badges and the gate status pill.
  const [counts, setCounts] = useState({ inside: null, incidents: null });
  useEffect(() => {
    let off = false;
    const pull = async () => {
      const [s, i] = await Promise.allSettled([api.get('/guard/stats'), api.get('/incidents?status=open')]);
      if (off) return;
      setCounts({
        inside: s.status === 'fulfilled' ? s.value.data.data?.currently_inside ?? null : null,
        incidents: i.status === 'fulfilled' ? (i.value.data.data || []).length : null,
      });
    };
    pull();
    const t = setInterval(pull, 30000);
    return () => { off = true; clearInterval(t); };
  }, [loc.pathname]);

  return (
    <div className="flex min-h-screen bg-surface-canvas">
      <AdminSidebar open={open} onToggle={() => setOpen((o) => !o)} counts={counts} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[76px] px-6 lg:px-10 flex items-center justify-between gap-4 sticky top-0 z-30 bg-surface-canvas/90 backdrop-blur">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px]">
            <span className="text-ink-muted">Admin</span>
            <ChevronRight className="w-4 h-4 text-ink-muted" aria-hidden="true" />
            <span className="font-semibold text-ink">{title}</span>
          </nav>
          <div className="flex items-center gap-3">
            {/* Doherty: gate status + data freshness always visible */}
            <span className="hidden xl:inline-flex items-center gap-2.5 h-11 pl-2 pr-4 rounded-full border border-line bg-surface-card text-[14px]">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center ${online ? 'bg-status-ok-bg' : 'bg-status-warn-bg'}`}>
                <span className={`w-2 h-2 rounded-full ${online ? 'bg-status-ok' : 'bg-status-warn'}`} />
              </span>
              <span className="font-semibold text-ink">{online ? 'Gate open' : 'Offline'}</span>
              <span className="text-ink-muted">· {counts.inside ?? '—'} inside · updated {format(now, 'h:mm a')}</span>
            </span>
            <form role="search" onSubmit={(e) => { e.preventDefault(); navigate(`/guard/logs${q ? `?search=${encodeURIComponent(q)}` : ''}`); }}
              className="hidden md:flex items-center gap-2 h-11 pl-4 pr-2 w-[260px] rounded-full border border-input bg-surface-card focus-within:ring-2 focus-within:ring-brand">
              <Search className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
              <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search person, plate or pass"
                placeholder="Search person, plate, pass…" className="flex-1 min-w-0 bg-transparent text-[14px] text-ink placeholder:text-ink-muted/70 focus:outline-none" />
              <kbd className="h-7 min-w-[28px] px-2 rounded-lg bg-surface-subtle text-[13px] font-mono text-ink-muted flex items-center justify-center">/</kbd>
            </form>
            <NewMenu />
            <Link to="/admin/notifications" aria-label="Notifications" className="relative w-11 h-11 rounded-full border border-line bg-surface-card flex items-center justify-center hover:bg-surface-subtle">
              <Bell className="w-5 h-5 text-ink" aria-hidden="true" />
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-auto px-6 lg:px-10 pb-10">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

/* ═══ RESIDENT (H01) ═════════════════════════════════════════════════════════ */
const ResidentShell = ({ children }) => {
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setMenu(false));
  const prop = user?.primary_property;

  const pill = ({ isActive }) =>
    `inline-flex items-center gap-2 h-11 px-4 rounded-full text-[15px] whitespace-nowrap transition-colors ${isActive ? 'bg-home-bg text-home-ink font-bold' : 'text-ink-muted font-semibold hover:bg-surface-subtle hover:text-ink'}`;

  return (
    <div className="min-h-screen bg-home-canvas flex flex-col">
      <header className="bg-surface-card border-b border-line sticky top-0 z-30">
        <div className="max-w-[1320px] mx-auto h-[84px] px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <img src={`${BASE}camella-naga-logo.svg`} alt="Camella Naga" className="h-10 w-auto" />
            <span className="hidden sm:inline-flex h-7 items-center px-2.5 rounded-full bg-home-bg text-home-ink text-[11px] font-bold tracking-[0.1em]">HOMEOWNER</span>
          </div>
          {/* Hick: five top-level destinations */}
          <nav aria-label="Resident" className="hidden lg:flex items-center gap-1">
            <NavLink to="/resident/dashboard" end className={pill}><House className="w-[18px] h-[18px]" aria-hidden="true" /> Home</NavLink>
            <NavLink to="/resident/passes" className={pill}><Ticket className="w-[18px] h-[18px]" aria-hidden="true" /> Passes</NavLink>
            <NavLink to="/resident/household" className={pill}><Users className="w-[18px] h-[18px]" aria-hidden="true" /> Household</NavLink>
            <NavLink to="/resident/home" className={pill}><KeyRound className="w-[18px] h-[18px]" aria-hidden="true" /> My home</NavLink>
            <NavLink to="/resident/activity" className={pill}><Activity className="w-[18px] h-[18px]" aria-hidden="true" /> Activity</NavLink>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {prop && (
              <span className="hidden xl:inline-flex items-center gap-1.5 h-11 px-4 rounded-full bg-surface-subtle text-[14px] font-semibold text-ink" title="Your property">
                <House className="w-4 h-4" aria-hidden="true" /> B{prop.block} L{prop.lot}
              </span>
            )}
            {/* Fitts: the most frequent resident task is on every screen */}
            <Link to="/resident/passes#new-pass" className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand text-brand-on text-[15px] font-semibold hover:bg-brand/90">
              <Plus className="w-4 h-4" aria-hidden="true" /> New visitor pass
            </Link>
            <Link to="/resident/activity/notifications" aria-label="Notifications" className="relative w-11 h-11 rounded-full border border-line flex items-center justify-center hover:bg-surface-subtle">
              <Bell className="w-5 h-5 text-ink" aria-hidden="true" />
            </Link>
            <div ref={ref} className="relative">
              <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu"
                className="w-11 h-11 rounded-full bg-brand-tint text-brand-forest text-[14px] font-bold flex items-center justify-center">
                {initialsOf(user)}
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-line bg-surface-card shadow-modal overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-line">
                    <p className="text-sm font-bold text-ink truncate">{displayName(user)}</p>
                    <p className="text-xs text-ink-muted">Homeowner{prop ? ` · Block ${prop.block}, Lot ${prop.lot}` : ''}</p>
                  </div>
                  {[['profile', 'Profile and security'], ['privacy', 'Privacy and my data'], ['help', 'Help and support']].map(([k, l]) => (
                    <Link key={k} role="menuitem" to={`/resident/account/${k}`} onClick={() => setMenu(false)} className="flex items-center h-11 px-4 text-sm font-semibold text-ink hover:bg-surface-subtle">{l}</Link>
                  ))}
                  <SignOutItem className="text-status-danger hover:bg-status-danger-bg" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 px-4 sm:px-6 py-8 pb-28 lg:pb-8">{children || <Outlet />}</main>
      {/* Phones and tablets: bottom tab bar (thumb reach) replaces the top pills */}
      <nav aria-label="Resident (mobile)" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface-card border-t border-line px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-xl mx-auto grid grid-cols-5 items-end h-[72px]">
          {[
            { to: '/resident/dashboard', icon: House, label: 'Home', end: true },
            { to: '/resident/passes', icon: Ticket, label: 'Passes', end: true },
            null,
            { to: '/resident/household', icon: Users, label: 'Household' },
            { to: '/resident/activity', icon: Activity, label: 'Activity' },
          ].map((it, i) => it === null ? (
            <Link key="new" to="/resident/passes#new-pass" aria-label="New visitor pass"
              className="mx-auto -mt-6 mb-3 w-14 h-14 rounded-full bg-brand text-brand-on flex items-center justify-center shadow-modal">
              <Plus className="w-6 h-6" aria-hidden="true" />
            </Link>
          ) : (
            <NavLink key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => `flex flex-col items-center justify-center gap-1 h-full text-[12px] font-semibold ${isActive ? 'text-home-ink' : 'text-ink-muted'}`}>
              <it.icon className="w-5 h-5" aria-hidden="true" /> {it.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <footer className="hidden lg:flex max-w-[1320px] w-full mx-auto px-6 py-6 justify-between text-[13px] text-ink-muted">
        <span>© 2026 Vistara · Camella Homes Naga</span>
        <span className="flex gap-5"><span>Privacy notice</span><span>Help</span><span>Version 1.0</span></span>
      </footer>
    </div>
  );
};

/* ═══ GUARD (G02) ════════════════════════════════════════════════════════════ */
const SosButton = ({ compact = false }) => {
  const [state, setState] = useState('idle'); // idle | holding | sent
  const timer = useRef(null);
  const send = async () => {
    try { await api.post('/incidents/sos', { location: 'Main Gate' }); setState('sent'); }
    catch { setState('failed'); }
  };
  const start = () => { if (state !== 'idle') return; setState('holding'); timer.current = setTimeout(send, 2000); };
  const cancel = () => { if (state === 'holding') { clearTimeout(timer.current); setState('idle'); } };
  useEffect(() => { if (state === 'sent' || state === 'failed') { const t = setTimeout(() => setState('idle'), 5000); return () => clearTimeout(t); } return undefined; }, [state]);
  return (
    <button
      onPointerDown={start} onPointerUp={cancel} onPointerLeave={cancel}
      onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && state === 'idle') start(); }} onKeyUp={cancel}
      aria-label="SOS — press and hold for 2 seconds to alert the HOA office"
      className={`relative overflow-hidden flex flex-col items-center justify-center gap-0.5 ${compact ? 'w-[68px] h-[68px] rounded-full shadow-modal touch-none' : 'w-[88px] h-[76px] rounded-[20px]'} text-g-bar-text select-none ${state === 'sent' ? 'bg-g-ok-bg text-g-ok' : state === 'failed' ? 'bg-g-warn-bg text-g-warn' : 'bg-g-danger-solid'}`}
    >
      {state === 'holding' && <span className="absolute inset-y-0 left-0 bg-black/25 animate-[sosfill_2s_linear_forwards]" />}
      <Siren className="relative w-6 h-6" aria-hidden="true" />
      <span className="relative text-[14px] font-bold">{state === 'sent' ? 'Sent' : state === 'failed' ? 'Retry' : 'SOS'}</span>
      <span className={`relative text-[11px] ${compact ? 'sr-only' : ''}`}>{state === 'sent' ? 'Office alerted' : state === 'failed' ? 'Call office' : state === 'holding' ? 'Keep holding' : 'Hold 2s'}</span>
      <span role="status" className="sr-only">{state === 'sent' ? 'SOS alert sent to the HOA office' : state === 'failed' ? 'SOS could not be sent. Call the HOA office.' : ''}</span>
    </button>
  );
};

const GuardShell = ({ children }) => {
  const { user } = useAuth();
  const now = useNow();
  const online = useOnline();
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);
  useOutside(ref, () => setMenu(false));
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('vistara-guard-theme') || 'night'; } catch { return 'night'; } });
  useEffect(() => { try { localStorage.setItem('vistara-guard-theme', theme); } catch { /* storage unavailable */ } }, [theme]);
  const loc = useLocation();

  // Consistency: rail badge and approvals pill use the same live numbers as the console.
  const [live, setLive] = useState({ inside: null, approvals: 0 });
  useEffect(() => {
    let off = false;
    const pull = async () => {
      try {
        const r = await api.get('/dashboard/guard');
        if (!off) setLive({ inside: r.data.data.today.inside, approvals: r.data.data.approvalsWaiting || 0 });
      } catch {
        try { const s = await api.get('/guard/stats'); if (!off) setLive({ inside: s.data.data?.currently_inside ?? null, approvals: 0 }); } catch { /* offline: keep last */ }
      }
    };
    pull();
    const t = setInterval(pull, 30000);
    return () => { off = true; clearInterval(t); };
  }, [loc.pathname]);

  const rail = (active) =>
    `relative flex flex-col items-center justify-center gap-1 w-[88px] h-[68px] rounded-rail text-[13px] font-semibold transition-colors ${active ? 'bg-g-accent-soft text-g-accent-ink' : 'text-g-bar-text-2 hover:bg-g-bar-chip hover:text-g-bar-text'}`;
  const items = [
    { to: '/guard/manual-entry', icon: UserPlus, label: 'Walk-in' },
    { to: '/guard/logs?status=checked_in', icon: Users, label: 'Inside', badge: live.inside || null, active: loc.pathname === '/guard/logs' && loc.search.includes('checked_in') },
    { to: '/guard/logs', icon: History, label: 'Gate log', active: loc.pathname === '/guard/logs' && !loc.search.includes('checked_in') },
    { to: '/guard/incidents', icon: TriangleAlert, label: 'Incidents' },
    { to: '/guard/patrol', icon: Route, label: 'Patrol' },
    { to: '/guard/more', icon: LayoutGrid, label: 'More' },
  ];

  return (
    <div data-app="guard" data-theme={theme} className="flex min-h-screen bg-g-canvas text-g-text">
      <style>{'@keyframes sosfill{from{width:0}to{width:100%}}'}</style>
      {/* Navigation rail — Jakob (tablet rail), Fitts (Scan is the biggest target, top-left) */}
      <nav aria-label="Guard" className="hidden md:flex w-[104px] shrink-0 bg-g-rail flex-col items-center gap-1.5 py-4 sticky top-0 h-screen">
        <NavLink to="/guard/dashboard"
          className={({ isActive }) => `flex flex-col items-center justify-center gap-1 w-[88px] h-[88px] rounded-[28px] bg-g-fab text-g-on-fab text-[14px] font-bold transition-transform active:scale-95 ${isActive || loc.pathname === '/guard/scan' ? 'ring-4 ring-g-fab/35' : ''}`}>
          <ScanLine className="w-8 h-8" aria-hidden="true" /> Scan
        </NavLink>
        <div className="w-14 h-px bg-g-border my-2" aria-hidden="true" />
        {items.map(({ to, icon: Icon, label, badge, active }) => (
          <Link key={label} to={to} className={rail(active ?? (loc.pathname === to || loc.pathname.startsWith(`${to}/`)))} aria-current={(active ?? (loc.pathname === to || loc.pathname.startsWith(`${to}/`))) ? 'page' : undefined}>
            <span className="relative">
              <Icon className="w-7 h-7" aria-hidden="true" />
              {badge != null && <span className="absolute -top-2 -right-3 min-w-[20px] h-5 px-1 rounded-full bg-g-warn text-g-on-fab text-[11px] font-bold flex items-center justify-center">{badge}</span>}
            </span>
            {label}
          </Link>
        ))}
        <div className="flex-1" />
        <SosButton />
      </nav>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Status bar — visibility of system status */}
        <header className="h-16 md:h-[72px] shrink-0 bg-g-rail flex items-center justify-between gap-2 md:gap-3 px-3 md:px-5 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <img src={`${BASE}camella-naga-logo-reversed.svg`} alt="Camella Naga" className="h-8 w-auto hidden md:block" />
            <span className="inline-flex h-6 items-center px-2 rounded-full bg-g-accent-soft text-g-accent-ink text-[11px] font-bold tracking-[0.12em]">GUARD</span>
            <span className="hidden lg:block rounded-xl bg-g-bar-chip px-3 py-1.5 leading-tight whitespace-nowrap">
              <span className="block text-[14px] font-bold text-g-bar-text">Main Gate</span>
              <span className="block text-[12px] text-g-bar-text-2">Day shift · 7 AM–7 PM</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2.5 min-w-0">
            <span className="text-right leading-tight mr-1 whitespace-nowrap">
              <span className="block font-semibold text-[18px] md:text-[24px] text-g-bar-text tabular-nums">{format(now, 'h:mm a')}</span>
              <span className="hidden sm:block text-[12px] text-g-bar-text-2">{format(now, 'EEE, d MMM yyyy')}</span>
            </span>
            <span role="status" className={`inline-flex items-center gap-2 h-11 px-3 md:px-4 rounded-full text-[14px] font-bold whitespace-nowrap ${online ? 'bg-g-ok-bg text-g-ok' : 'bg-g-warn-bg text-g-warn'}`}>
              <span className={`w-2 h-2 rounded-full ${online ? 'bg-g-ok' : 'bg-g-warn'}`} aria-hidden="true" />
              <span className="sm:hidden">{online ? 'Online' : 'Offline'}</span>
              <span className="hidden sm:inline">{online ? 'Online · synced' : 'Offline · queued'}</span>
            </span>
            {live.approvals > 0 && (
              <Link to="/guard/manual-entry" className="hidden lg:inline-flex items-center h-11 px-4 rounded-full bg-g-warn-bg text-g-warn text-[14px] font-bold">{live.approvals} approval{live.approvals > 1 ? 's' : ''} waiting</Link>
            )}
            <button onClick={() => setTheme(theme === 'night' ? 'day' : 'night')} aria-label={theme === 'night' ? 'Switch to Day mode' : 'Switch to Night mode'}
              className="w-11 h-11 rounded-full bg-g-bar-chip text-g-bar-text flex items-center justify-center">
              {theme === 'night' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
            </button>
            <div ref={ref} className="relative">
              <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}
                className="flex items-center gap-2.5 h-11 pl-1.5 pr-1.5 xl:pr-4 rounded-full bg-g-bar-chip">
                <span className="w-8 h-8 rounded-full bg-g-accent text-g-on-accent text-[12px] font-bold flex items-center justify-center">{initialsOf(user)}</span>
                <span className="hidden xl:block text-[14px] font-semibold text-g-bar-text">{displayName(user)}</span>
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-g-border bg-g-surface shadow-modal overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-g-border">
                    <p className="text-sm font-bold text-g-text truncate">{displayName(user)}</p>
                    <p className="text-xs text-g-text-2">Guard on duty · Main Gate</p>
                  </div>
                  <SignOutItem className="text-g-danger hover:bg-g-danger-bg" />
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 pb-[120px] md:p-6">{children || <Outlet />}</main>
      </div>

      {/* Phones: bottom tab bar + floating SOS (the rail would take a third of the screen) */}
      <div className="md:hidden fixed right-4 bottom-[88px] z-40"><SosButton compact /></div>
      <nav aria-label="Guard" className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-g-rail border-t border-g-border grid grid-cols-5 px-1 pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))]">
        {[
          { to: '/guard/dashboard', icon: ScanLine, label: 'Scan', active: loc.pathname === '/guard/dashboard' || loc.pathname === '/guard/scan' },
          items[0], items[1], items[2],
          { to: '/guard/more', icon: LayoutGrid, label: 'More', active: ['/guard/more', '/guard/incidents', '/guard/patrol'].some((p) => loc.pathname.startsWith(p)) },
        ].map(({ to, icon: Icon, label, badge, active }) => {
          const on = active ?? (loc.pathname === to);
          return (
            <Link key={label} to={to} aria-current={on ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 h-[60px] rounded-2xl text-[12px] font-semibold ${on ? 'bg-g-accent-soft text-g-accent-ink' : 'text-g-bar-text-2'}`}>
              <span className="relative">
                <Icon className="w-6 h-6" aria-hidden="true" />
                {badge != null && <span className="absolute -top-2 -right-3 min-w-[20px] h-5 px-1 rounded-full bg-g-warn text-g-on-fab text-[11px] font-bold flex items-center justify-center">{badge}</span>}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

/* ─── AppLayout: pick the shell by role ──────────────────────────────────────── */
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  // New page starts at the top (SPA navigation otherwise keeps the old scroll position).
  useEffect(() => { if (!window.location.hash) window.scrollTo(0, 0); }, [pathname]);
  if (user?.role === 'guard') return <GuardShell>{children}</GuardShell>;
  if (user?.role === 'resident') return <ResidentShell>{children}</ResidentShell>;
  return <AdminShell>{children}</AdminShell>;
};

export default AppLayout;
