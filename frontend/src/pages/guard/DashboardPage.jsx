import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DoorOpen, Users, ShieldCheck, ScanLine, UserPlus, RefreshCw } from 'lucide-react';
import api from '@/api/axios';
import { format } from 'date-fns';

/**
 * Guard console (Figma: MAIN GUARD APP -- REDESIGN › G02).
 * Tokens: Vistara Guard (Night / Day, set by the shell's data-theme).
 * Touch targets ≥ 64 px for a standing guard on a landscape tablet.
 */

const Stat = ({ label, value, Icon, to, emphasis }) => {
  const body = (
    <>
      <span className={`w-12 h-12 rounded-full flex items-center justify-center ${emphasis ? 'bg-g-accent text-g-on-accent' : 'bg-g-surface-2 text-g-accent-ink'}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[44px] leading-none font-semibold text-g-text tabular-nums">
          {value ?? <span className="text-g-text-2">—</span>}
        </p>
        <p className="mt-1.5 text-[15px] font-semibold text-g-text-2">{label}</p>
      </div>
    </>
  );
  const cls = 'rounded-card bg-g-surface border border-g-border p-6 flex flex-col justify-between gap-6 min-h-[168px]';
  return to ? <Link to={to} className={`${cls} hover:border-g-accent transition-colors`}>{body}</Link> : <div className={cls}>{body}</div>;
};

const BigAction = ({ to, label, sub, Icon, primary }) => (
  <Link
    to={to}
    className={`flex items-center gap-5 rounded-card p-6 min-h-[112px] transition-transform active:scale-[0.99] ${
      primary ? 'bg-g-fab text-g-on-fab' : 'bg-g-surface border border-g-border text-g-text hover:border-g-accent'
    }`}
  >
    <span className={`w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 ${primary ? 'bg-g-on-fab/10' : 'bg-g-surface-2 text-g-accent-ink'}`}>
      <Icon className="w-8 h-8" aria-hidden="true" />
    </span>
    <span>
      <span className="block text-[22px] font-bold leading-tight">{label}</span>
      <span className={`block text-[15px] mt-0.5 ${primary ? 'opacity-80' : 'text-g-text-2'}`}>{sub}</span>
    </span>
  </Link>
);

const GuardDashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([api.get('/guard/stats'), api.get('/logs/feed?limit=20')]);
      setStats(statsRes.data.data);
      setLogs(logsRes.data.data || []);
      setFailed(false);
      setLastSync(new Date());
    } catch {
      // Keep the last known data on screen (offline edge case) and flag it.
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);


  return (
    <div className="max-w-[1400px] mx-auto space-y-6 anim-fade-in">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-[32px] font-semibold text-g-text">Gate console</h1>
        <button
          id="guard-stats-refresh-btn"
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center gap-2 h-12 px-5 rounded-full bg-g-surface border border-g-border text-[15px] font-bold text-g-text hover:border-g-accent disabled:opacity-60"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'spin' : ''}`} aria-hidden="true" />
          {lastSync ? `Synced ${format(lastSync, 'HH:mm')}` : 'Sync'}
        </button>
      </div>

      {failed && (
        <div role="alert" className="rounded-2xl bg-g-warn-bg text-g-warn px-5 py-4 text-[15px] font-semibold">
          Can’t reach the server. Showing the last synced data — scans still work and will sync when the connection returns.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Entries today"   value={stats?.entries_today}    Icon={DoorOpen} emphasis />
            <Stat label="Still inside"    value={stats?.currently_inside} Icon={Users} to="/guard/logs?status=checked_in" />
            <Stat label="Guards on duty"  value={stats?.active_guards}    Icon={ShieldCheck} />
          </div>
          <div className="grid gap-4">
            <BigAction to="/guard/scan"         label="Scan QR pass"  sub="Validate a resident’s visitor pass with the camera" Icon={ScanLine} primary />
            <BigAction to="/guard/manual-entry" label="Log a walk-in" sub="Visitor without a pass — the resident is asked to approve" Icon={UserPlus} />
          </div>
        </div>

        {/* Live feed — newest first; entry vs exit shown by dot + word + colour */}
        <section className="rounded-card bg-g-surface border border-g-border flex flex-col overflow-hidden">
          <div className="px-6 py-5 border-b border-g-border flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-g-text">Live feed</h2>
            <span className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-g-ok-bg text-g-ok text-[13px] font-bold">
              <span className="h-2 w-2 rounded-full bg-g-ok animate-pulse" aria-hidden="true" /> Live
            </span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[620px]">
            {loading && logs.length === 0 ? (
              <p className="p-8 text-center text-[15px] text-g-text-2">Loading…</p>
            ) : logs.length === 0 ? (
              <p className="p-8 text-center text-[15px] text-g-text-2">No gate activity yet this shift.</p>
            ) : (
              <ul className="divide-y divide-g-border">
                {logs.map((log) => {
                  const isIn = log.status === 'checked_in';
                  const t = log.status === 'used' ? log.exited_at || log.scanned_at || log.createdAt : log.scanned_at || log.createdAt;
                  return (
                    <li key={log.id} className="flex items-center justify-between gap-3 px-6 py-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="font-mono text-[15px] text-g-text-2 w-12 shrink-0">{format(new Date(t), 'HH:mm')}</span>
                        <div className="min-w-0">
                          <p className="text-[16px] font-bold text-g-text truncate">{log.guest_name}</p>
                          <p className="text-[13px] text-g-text-2 truncate">Logged by {log.ScannedBy?.username || 'system'}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-bold shrink-0 ${isIn ? 'bg-g-ok-bg text-g-ok' : 'bg-g-surface-2 text-g-text-2'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isIn ? 'bg-g-ok' : 'bg-g-text-2'}`} aria-hidden="true" />
                        {isIn ? 'Entry' : 'Exit'}
                      </span>
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

export default GuardDashboard;
