import { useEffect, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock3, PhoneCall, DoorOpen } from 'lucide-react';
import api from '@/api/axios';

/**
 * Guard side of the walk-in flow (Figma G05 states):
 * waiting → approved (admit) | denied (turn away) | no response (call resident / admit with reason) | reconnecting.
 */
const WalkinWaiting = ({ request, onDone }) => {
  const [w, setW] = useState(request);
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [left, setLeft] = useState(() => Math.max(0, request.windowSec - Math.floor((Date.now() - new Date(request.requestedAt)) / 1000)));

  const poll = useCallback(async () => {
    try { const r = await api.get(`/walkins/${request.id}`); setW(r.data.data); setOffline(false); }
    catch { setOffline(true); }
  }, [request.id]);

  useEffect(() => {
    if (w.status !== 'pending') return undefined;
    const t = setInterval(poll, 3000);
    const c = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => { clearInterval(t); clearInterval(c); };
  }, [w.status, poll]);

  // The server marks the request expired; refresh once the countdown ends.
  useEffect(() => { if (left === 0 && w.status === 'pending') poll(); }, [left, w.status, poll]);

  const admit = async () => {
    setBusy(true); setError('');
    try { const r = await api.post(`/walkins/${w.id}/admit`, w.status === 'expired' ? { override_reason: reason } : {}); setW(r.data.data); }
    catch (e) { setError(e.response?.data?.message || 'Could not log the entry. Try again.'); }
    finally { setBusy(false); }
  };

  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  const box = 'rounded-card border p-6 space-y-4';
  const btn = 'inline-flex items-center justify-center gap-2 h-14 px-6 rounded-full text-[17px] font-semibold disabled:opacity-60';

  return (
    <div className="max-w-3xl mx-auto space-y-4" aria-live="polite">
      <div className="rounded-card border border-g-border bg-g-surface p-5">
        <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-g-text-2">Walk-in visitor</p>
        <p className="mt-1 text-[22px] font-semibold text-g-text">{w.guest}{w.purpose ? ` · ${w.purpose}` : ''}</p>
        <p className="text-[15px] text-g-text-2">{w.address}{w.vehicle ? ` · ${w.vehicle}` : ''}</p>
        {w.resident && <p className="text-[15px] text-g-text-2">Host: {w.resident.name}{w.resident.contact ? ` · ${w.resident.contact}` : ''}</p>}
      </div>

      {offline && <p role="status" className="rounded-2xl bg-g-warn-bg text-g-warn px-5 py-3 font-semibold">Reconnecting… the request is saved and will update when the connection returns.</p>}

      {w.status === 'pending' && (
        <div className={`${box} border-g-border bg-g-surface`}>
          <p className="flex items-center gap-3 text-[22px] font-semibold text-g-text"><Loader2 className="w-6 h-6 animate-spin text-g-accent-ink" aria-hidden="true" /> Waiting for the resident</p>
          <p className="text-[16px] text-g-text-2">The resident got an approval request. Keep the visitor at the gate.</p>
          <p className="text-[40px] font-semibold text-g-accent-ink tabular-nums">{mm}:{ss}</p>
        </div>
      )}

      {w.status === 'approved' && (
        <div className={`${box} border-g-ok bg-g-ok-bg`}>
          <p className="flex items-center gap-3 text-[24px] font-bold text-g-ok"><CheckCircle2 className="w-7 h-7" aria-hidden="true" /> Approved by the resident</p>
          {w.decisionNote && <p className="text-g-text">“{w.decisionNote}”</p>}
          <button onClick={admit} disabled={busy} className={`${btn} bg-g-accent text-g-on-accent w-full`}>{busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <DoorOpen className="w-5 h-5" aria-hidden="true" />} Admit and log entry</button>
        </div>
      )}

      {w.status === 'denied' && (
        <div className={`${box} border-g-danger bg-g-danger-bg`}>
          <p className="flex items-center gap-3 text-[24px] font-bold text-g-danger"><XCircle className="w-7 h-7" aria-hidden="true" /> Denied by the resident</p>
          <p className="text-g-text">{w.decisionNote ? `Reason: ${w.decisionNote}` : 'Politely turn the visitor away. The request is logged.'}</p>
          <button onClick={onDone} className={`${btn} border border-g-border text-g-text w-full`}>Done</button>
        </div>
      )}

      {w.status === 'expired' && (
        <div className={`${box} border-g-warn bg-g-warn-bg`}>
          <p className="flex items-center gap-3 text-[24px] font-bold text-g-warn"><Clock3 className="w-7 h-7" aria-hidden="true" /> No response from the resident</p>
          <p className="text-g-text">Call the resident{w.resident?.contact ? ` at ${w.resident.contact}` : ''}. If they confirm by phone, write that below and admit.</p>
          {w.resident?.contact && <a href={`tel:${w.resident.contact.replace(/\s/g, '')}`} className={`${btn} border border-g-border text-g-text`}><PhoneCall className="w-5 h-5" aria-hidden="true" /> Call resident</a>}
          <label className="block">
            <span className="block text-[15px] font-semibold text-g-text mb-1.5">Reason for admitting</span>
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Resident confirmed by phone at 2:41 PM"
              className="w-full h-12 px-4 rounded-xl border border-g-border-strong bg-g-surface text-g-text placeholder:text-g-text-2" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onDone} className={`${btn} border border-g-border text-g-text`}>Turn away</button>
            <button onClick={admit} disabled={busy || !reason.trim()} className={`${btn} bg-g-accent text-g-on-accent`}>Admit with reason</button>
          </div>
        </div>
      )}

      {w.status === 'admitted' && (
        <div className={`${box} border-g-ok bg-g-ok-bg`}>
          <p className="flex items-center gap-3 text-[24px] font-bold text-g-ok"><CheckCircle2 className="w-7 h-7" aria-hidden="true" /> Entry logged</p>
          <p className="text-g-text">{w.guest} is now listed as inside.</p>
          <button onClick={onDone} className={`${btn} bg-g-accent text-g-on-accent w-full`}>Log another walk-in</button>
        </div>
      )}

      {error && <p role="alert" className="rounded-2xl bg-g-danger-bg text-g-danger px-5 py-3 font-semibold">{error}</p>}
    </div>
  );
};

export default WalkinWaiting;
