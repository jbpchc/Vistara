import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ScanLine, Megaphone, Ticket, Car, Volume2, VolumeX } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/api/axios';

/**
 * Guard gate console — Figma: MAIN GUARD APP -- REDESIGN › G02 (node 1581:5534).
 * Tokens: Vistara Guard (Night / Day via the shell's data-theme). Targets ≥ 64 px.
 * Data: GET /dashboard/guard, falling back to /guard/stats + /logs/feed.
 */

const Panel = ({ className = '', children, ...rest }) => (
  <section className={`rounded-card border border-g-border bg-g-surface p-6 ${className}`} {...rest}>{children}</section>
);

const legacyFeed = async () => {
  const [s, f] = await Promise.all([api.get('/guard/stats'), api.get('/logs/feed?limit=2')]);
  const st = s.data.data || {};
  return {
    notice: null, expected: [],
    today: { entries: st.entries_today ?? 0, exits: null, inside: st.currently_inside ?? 0 },
    lastScans: (f.data.data || []).map((l) => ({ name: l.guest_name, time: l.scanned_at, dir: l.status === 'checked_in' ? 'entry' : 'exit' })),
  };
};

const GuardDashboard = () => {
  const navigate = useNavigate();
  const [d, setD] = useState(null);
  const [failed, setFailed] = useState(false);
  const [dir, setDir] = useState('entry');
  const [kind, setKind] = useState('Auto');
  const [sound, setSound] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api.get('/dashboard/guard').catch(() => null);
      setD(r ? r.data.data : await legacyFeed());
      setFailed(false);
    } catch {
      setFailed(true); // keep last data on screen (offline edge case)
    }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  const startScan = () => navigate(`/guard/scan?direction=${dir}&type=${encodeURIComponent(kind)}`);

  return (
    <div className="max-w-[1180px] mx-auto anim-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-semibold text-g-text">Gate console</h1>
          <p className="mt-1 text-[16px] text-g-text-2">Scan a visitor pass, vehicle sticker or item pass.</p>
        </div>
        {d?.notice && (
          <p className="flex items-center gap-3 rounded-[20px] bg-g-info-bg px-5 py-3 text-g-info max-w-md">
            <Megaphone className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span><span className="block text-[14px] font-bold">{d.notice.title}</span><span className="block text-[13px]">{d.notice.body}</span></span>
          </p>
        )}
      </div>

      {failed && (
        <div role="alert" className="mt-5 rounded-2xl bg-g-warn-bg text-g-warn px-5 py-4 text-[15px] font-semibold">
          Can’t reach the server. Showing the last synced data — scans are queued and sync when the connection returns.
        </div>
      )}

      <div className="mt-7 grid lg:grid-cols-[1fr_440px] gap-5">
        {/* Left: direction → type → scan (error prevention: direction is chosen first) */}
        <div>
          <div role="radiogroup" aria-label="Direction" className="grid grid-cols-2 gap-3">
            {[['entry', 'ENTRY', ArrowDown], ['exit', 'EXIT', ArrowUp]].map(([k, l, Icon]) => {
              const on = dir === k;
              return (
                <button key={k} role="radio" aria-checked={on} onClick={() => setDir(k)}
                  className={`h-[68px] rounded-[22px] text-[24px] font-bold flex items-center justify-center gap-2 border-2 transition-colors ${
                    on ? (k === 'entry' ? 'bg-g-fab text-g-on-fab border-g-fab' : 'bg-g-info text-g-on-fab border-g-info') : (k === 'entry' ? 'border-g-border text-g-text-2' : 'bg-g-info-bg border-g-info/50 text-g-info')
                  }`}>
                  <Icon className="w-6 h-6" aria-hidden="true" /> {l}
                </button>
              );
            })}
          </div>
          <div role="radiogroup" aria-label="Pass type" className="mt-4 flex flex-wrap gap-2.5">
            {['Auto', 'Visitor Pass', 'Vehicle Sticker', 'Item Pass'].map((k) => (
              <button key={k} role="radio" aria-checked={kind === k} onClick={() => setKind(k)}
                className={`h-12 px-4 rounded-full text-[15px] font-semibold border ${kind === k ? 'bg-g-accent-soft border-g-accent-soft text-g-accent-ink' : 'border-g-border text-g-text-2 hover:text-g-text'}`}>
                {k}
              </button>
            ))}
          </div>
          <button onClick={startScan} aria-label={`Start camera to scan ${kind === 'Auto' ? 'a pass' : `a ${kind.toLowerCase()}`} for ${dir}`}
            className="mt-5 w-full h-[340px] rounded-[28px] border-[3px] border-g-fab bg-g-canvas flex flex-col items-center justify-center gap-5 hover:bg-g-surface transition-colors">
            <span className="w-[200px] h-[180px] rounded-[24px] border-2 border-g-border flex items-center justify-center">
              <ScanLine className="w-14 h-14 text-g-text" aria-hidden="true" />
            </span>
            <span className="text-[22px] font-semibold text-g-text">Tap to start camera · point at the QR code</span>
          </button>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={() => setSound((s) => !s)} aria-pressed={sound}
              className={`inline-flex items-center gap-2 h-11 px-4 rounded-full text-[14px] font-semibold ${sound ? 'bg-g-ok-bg text-g-ok' : 'bg-g-surface-2 text-g-text-2'}`}>
              {sound ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
              Sound & vibration {sound ? 'on' : 'off'}
            </button>
          </div>
        </div>

        {/* Right: status panels */}
        <div className="space-y-4">
          <Panel aria-labelledby="today-title">
            <h2 id="today-title" className="text-[20px] font-semibold text-g-text">Today at this gate</h2>
            <dl className="mt-4 grid grid-cols-3 gap-3">
              {[['Entries', d?.today.entries], ['Exits', d?.today.exits], ['Inside now', d?.today.inside]].filter(([, v]) => v !== null).map(([l, v]) => (
                <div key={l}><dd className="text-[34px] font-semibold text-g-accent-ink tabular-nums">{v ?? '—'}</dd><dt className="text-[15px] text-g-text">{l}</dt></div>
              ))}
            </dl>
          </Panel>

          <Panel aria-labelledby="last-title">
            <h2 id="last-title" className="text-[20px] font-semibold text-g-text">Last scans</h2>
            <ul className="mt-3 space-y-3">
              {(d?.lastScans || []).map((s, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span><span className="block text-[16px] font-semibold text-g-text">{s.name}</span><span className="block text-[14px] text-g-text-2">{format(new Date(s.time), 'h:mm a')} · <Link to="/guard/logs" className="underline">Details</Link></span></span>
                  <span className={`h-8 px-3 rounded-full text-[14px] font-semibold flex items-center ${s.dir === 'entry' ? 'bg-g-ok-bg text-g-ok' : 'bg-g-info-bg text-g-info'}`}>{s.dir === 'entry' ? 'Entry' : 'Exit'}</span>
                </li>
              ))}
              {d && d.lastScans.length === 0 && <li className="text-g-text-2">No scans yet this shift.</li>}
            </ul>
          </Panel>

          {d?.expected?.length > 0 && (
            <Panel aria-labelledby="exp-title">
              <div className="flex items-center justify-between gap-2">
                <h2 id="exp-title" className="text-[20px] font-semibold text-g-text">Expected next hour</h2>
                <span className="h-8 px-3 rounded-full bg-g-info-bg text-g-info text-[14px] font-semibold flex items-center">{d.expected.length} pre-registered</span>
              </div>
              <ul className="mt-3 space-y-3">
                {d.expected.map((e) => (
                  <li key={e.name} className="flex items-start gap-3">
                    {e.vehicle ? <Car className="w-5 h-5 mt-0.5 text-g-text-2" aria-hidden="true" /> : <Ticket className="w-5 h-5 mt-0.5 text-g-text-2" aria-hidden="true" />}
                    <span><span className="block text-[16px] font-semibold text-g-text">{e.name}</span><span className="block text-[14px] text-g-text-2">{e.time ? format(new Date(e.time), 'h:mm a') : 'Today'} · {e.where}</span></span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>

      {/* Secondary paths, always one tap away */}
      <div className="mt-6 rounded-card border border-g-border bg-g-surface p-4 flex flex-wrap gap-3">
        <Link to="/guard/scan?manual=1" className="inline-flex items-center h-14 px-6 rounded-full bg-g-accent text-g-on-accent text-[17px] font-semibold">Enter code manually</Link>
        <Link to="/guard/manual-entry" className="inline-flex items-center h-14 px-6 rounded-full border border-g-border text-g-text text-[17px] font-semibold hover:border-g-accent">Walk-in (no pass)</Link>
        <Link to="/guard/incidents" className="inline-flex items-center h-14 px-6 rounded-full border border-g-border text-g-text text-[17px] font-semibold hover:border-g-accent">Report incident</Link>
      </div>
    </div>
  );
};

export default GuardDashboard;
