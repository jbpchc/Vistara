import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LogOut, ChevronDown, Clock, PanelLeft, Home, Plus, LayoutGrid, ScanLine, UserPlus,
  ListOrdered, Sun, Moon, Wifi, WifiOff,
} from 'lucide-react';
import { format } from 'date-fns';
import Sidebar from '@/components/shared/Sidebar';
import { useAuth } from '@/context/AuthContext';

/**
 * One design system, three deliberately different shells (see design-handoff/HANDOFF.md §3):
 *   admin    → light content + dark forest sidebar
 *   resident → warm top-pill navigation + HOMEOWNER tag
 *   guard    → dark Night / light Day tablet console with a navigation rail
 */

/* ─── Shared hooks ───────────────────────────────────────────────────────────── */
const useNow = (ms = 1000) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
};

const useOnline = () => {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
};

const initialsOf = (user) =>
  (user?.full_name || user?.username || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/* ─── User menu ──────────────────────────────────────────────────────────────── */
const TONES = {
  light: {
    btn: 'hover:bg-surface-subtle',
    avatar: 'bg-brand text-brand-on',
    name: 'text-ink',
    sub: 'text-ink-muted',
    menu: 'bg-surface-card border-line',
    head: 'bg-surface-subtle border-line',
    signout: 'text-status-danger hover:bg-status-danger-bg',
  },
  guard: {
    btn: 'hover:bg-g-bar-chip',
    avatar: 'bg-g-accent text-g-on-accent',
    name: 'text-g-bar-text',
    sub: 'text-g-bar-text-2',
    menu: 'bg-g-surface border-g-border',
    head: 'bg-g-surface-2 border-g-border',
    signout: 'text-g-danger hover:bg-g-danger-bg',
  },
};

const ROLE_LABEL = { admin: 'Administrator', guard: 'Guard on duty', resident: 'Homeowner' };

const UserMenu = ({ tone = 'light' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const t = TONES[tone];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', esc); };
  }, []);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div ref={ref} className="relative">
      <button
        id="user-menu-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex items-center gap-2.5 pl-1.5 pr-2 h-11 rounded-full transition-colors ${t.btn}`}
      >
        <span className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${t.avatar}`}>
          {initialsOf(user)}
        </span>
        <span className="text-left hidden sm:block">
          <span className={`block text-[14px] font-bold leading-tight ${t.name}`}>{user?.full_name || user?.username}</span>
          <span className={`block text-[12px] leading-tight ${t.sub}`}>{ROLE_LABEL[user?.role] || user?.role}</span>
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${t.sub} ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div role="menu" className={`absolute right-0 top-full mt-2 w-60 border rounded-2xl shadow-modal z-50 overflow-hidden ${t.menu}`}>
          <div className={`px-4 py-3 border-b ${t.head}`}>
            <p className={`text-sm font-bold truncate ${t.name}`}>{user?.full_name || user?.username}</p>
            <p className={`text-xs ${t.sub}`}>{ROLE_LABEL[user?.role]}</p>
          </div>
          <button
            id="user-menu-signout-btn"
            role="menuitem"
            onClick={handleLogout}
            className={`flex items-center gap-2.5 w-full px-4 h-11 text-sm font-semibold transition-colors ${t.signout}`}
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── ADMIN shell ────────────────────────────────────────────────────────────── */
const AdminShell = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const now = useNow();
  const online = useOnline();

  return (
    <div className="flex min-h-screen bg-surface-canvas">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-surface-canvas/90 backdrop-blur px-4 lg:px-8 h-[72px] flex items-center justify-between gap-3 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              className="hidden lg:flex w-11 h-11 rounded-full items-center justify-center hover:bg-surface-subtle transition-colors"
            >
              <PanelLeft className="w-5 h-5 text-ink-muted" />
            </button>
            {/* Doherty: data freshness always visible */}
            <span className={`hidden sm:inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] font-semibold ${online ? 'bg-status-ok-bg text-status-ok' : 'bg-status-warn-bg text-status-warn'}`}>
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-status-ok animate-pulse' : 'bg-status-warn'}`} aria-hidden="true" />
              {online ? 'Live' : 'Offline — showing last data'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:flex items-center gap-2 text-[14px] font-semibold text-ink-muted">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span className="font-mono">{format(now, 'hh:mm a')}</span>
              <span className="text-line">|</span>
              {format(now, 'EEE, MMM d')}
            </span>
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-auto px-4 pb-8 lg:px-8">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

/* ─── RESIDENT shell ─────────────────────────────────────────────────────────── */
const ResidentShell = ({ children }) => {
  const navItem = ({ isActive }) =>
    `inline-flex items-center gap-2 h-11 px-4 rounded-full text-[15px] transition-colors ${
      isActive ? 'bg-home-bg text-home-ink font-bold' : 'text-ink-muted font-semibold hover:bg-surface-subtle hover:text-ink'
    }`;

  // Fitts: the most frequent resident task is always one click away.
  const goToNewPass = () => {
    const el = document.getElementById('new-pass');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.querySelector('input')?.focus({ preventScroll: true }); }
  };

  return (
    <div className="min-h-screen bg-home-canvas">
      <header className="bg-surface-card border-b border-line sticky top-0 z-30">
        <div className="max-w-6xl mx-auto h-[84px] px-4 lg:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={`${import.meta.env.BASE_URL}camella-naga-logo.svg`} alt="Camella Naga" className="h-9 w-auto shrink-0" />
            <span className="hidden sm:inline-flex h-7 items-center px-2.5 rounded-full bg-home-bg text-home-ink text-[11px] font-bold tracking-[0.1em]">
              HOMEOWNER
            </span>
          </div>
          <nav aria-label="Resident" className="hidden md:flex items-center gap-1">
            <NavLink to="/resident/dashboard" end className={navItem}>
              <Home className="w-[18px] h-[18px]" aria-hidden="true" /> Home
            </NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={goToNewPass}
              className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-full bg-brand text-brand-on text-[15px] font-semibold hover:bg-brand/90 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> New visitor pass
            </button>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="px-4 lg:px-6 py-8">{children || <Outlet />}</main>
    </div>
  );
};

/* ─── GUARD shell (tablet) ───────────────────────────────────────────────────── */
const RAIL = [
  { to: '/guard/dashboard',    icon: LayoutGrid,  label: 'Console' },
  { to: '/guard/manual-entry', icon: UserPlus,    label: 'Walk-in' },
  { to: '/guard/logs',         icon: ListOrdered, label: 'Gate log' },
];

const GuardShell = ({ children }) => {
  const now = useNow();
  const online = useOnline();
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('vistara-guard-theme') || 'night'; } catch { return 'night'; }
  });
  useEffect(() => { try { localStorage.setItem('vistara-guard-theme', theme); } catch { /* storage unavailable */ } }, [theme]);

  const railItem = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 w-[88px] h-[68px] rounded-rail text-[13px] font-semibold transition-colors ${
      isActive ? 'bg-g-accent-soft text-g-accent-ink' : 'text-g-bar-text-2 hover:bg-g-bar-chip hover:text-g-bar-text'
    }`;

  return (
    <div data-app="guard" data-theme={theme} className="flex min-h-screen bg-g-canvas text-g-text">
      {/* Navigation rail — Jakob (tablet nav-rail), Fitts (Scan is the largest target) */}
      <nav aria-label="Guard" className="w-[104px] shrink-0 bg-g-rail flex flex-col items-center gap-2 py-5 sticky top-0 h-screen">
        <span className="mb-2 inline-flex h-6 items-center px-2 rounded-full bg-g-bar-chip text-g-accent-ink text-[10px] font-bold tracking-[0.12em]">GUARD</span>
        <NavLink to="/guard/dashboard" end className={railItem}>
          <LayoutGrid className="w-7 h-7" aria-hidden="true" /> Console
        </NavLink>
        <NavLink
          to="/guard/scan"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 w-[88px] h-[88px] rounded-[28px] bg-g-fab text-g-on-fab text-[13px] font-bold shadow-lg transition-transform active:scale-95 ${isActive ? 'ring-4 ring-g-fab/40' : ''}`
          }
        >
          <ScanLine className="w-8 h-8" aria-hidden="true" /> Scan
        </NavLink>
        {RAIL.slice(1).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end className={railItem}>
            <Icon className="w-7 h-7" aria-hidden="true" /> {label}
          </NavLink>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
          aria-label={theme === 'night' ? 'Switch to Day mode' : 'Switch to Night mode'}
          className="flex flex-col items-center justify-center gap-1 w-[88px] h-[68px] rounded-rail text-[13px] font-semibold text-g-bar-text-2 hover:bg-g-bar-chip hover:text-g-bar-text"
        >
          {theme === 'night' ? <Sun className="w-6 h-6" aria-hidden="true" /> : <Moon className="w-6 h-6" aria-hidden="true" />}
          {theme === 'night' ? 'Day' : 'Night'}
        </button>
      </nav>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Status bar — visibility of system status */}
        <header className="h-[72px] shrink-0 bg-g-rail flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-[17px] font-bold text-g-bar-text">Main Gate</span>
            <span className="text-[14px] text-g-bar-text-2">{format(now, 'EEE, MMM d')}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[22px] font-medium text-g-bar-text tabular-nums">{format(now, 'HH:mm')}</span>
            <span
              role="status"
              className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] font-bold ${online ? 'bg-g-bar-chip text-g-ok' : 'bg-g-warn-bg text-g-warn'}`}
            >
              {online ? <Wifi className="w-4 h-4" aria-hidden="true" /> : <WifiOff className="w-4 h-4" aria-hidden="true" />}
              {online ? 'Online' : 'Offline · reconnecting'}
            </span>
            <UserMenu tone="guard" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

/* ─── AppLayout: pick the shell by role ──────────────────────────────────────── */
const AppLayout = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'guard') return <GuardShell>{children}</GuardShell>;
  if (user?.role === 'resident') return <ResidentShell>{children}</ResidentShell>;
  return <AdminShell>{children}</AdminShell>;
};

export default AppLayout;
