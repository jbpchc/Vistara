import { useEffect, useState, useCallback } from 'react';
import { TriangleAlert, Siren, CheckCircle2, Loader2, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import api from '@/api/axios';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

/** Admin incident queue: open first, most severe first. Closing requires a resolution note. */
const SEV = { critical: ['destructive', 'Critical'], high: ['warning', 'High'], normal: ['neutral', 'Normal'] };

const IncidentsPage = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('open');
  const [resolving, setResolving] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/incidents${filter === 'all' ? '' : `?status=${filter}`}`).then((r) => setRows(r.data.data)).catch(() => setRows([]));
  }, [filter]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const resolve = async () => {
    setBusy(true);
    try {
      const r = await api.patch(`/incidents/${resolving.id}/resolve`, { resolution: note });
      toast({ variant: 'success', title: 'Incident resolved', description: r.data.message });
      setResolving(null); setNote(''); load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Could not resolve', description: e.response?.data?.message || 'Try again.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 anim-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-2">
        <div>
          <h1 className="text-[40px] leading-tight font-semibold text-ink">Incidents</h1>
          <p className="mt-1 text-[16px] text-ink-muted">Reports and SOS alerts from the gate. Most urgent first.</p>
        </div>
        <div role="tablist" aria-label="Filter incidents" className="flex p-1 rounded-full bg-surface-subtle">
          {[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
              className={`h-10 px-5 rounded-full text-[14px] font-semibold ${filter === k ? 'bg-brand text-brand-on' : 'text-ink-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>
      </div>

      <section className="rounded-card border border-line bg-surface-card shadow-card p-4">
        {rows === null ? <p className="p-8 text-center text-ink-muted"><Loader2 className="inline w-5 h-5 animate-spin" /> Loading…</p>
          : rows.length === 0 ? <p className="p-10 text-center text-ink-muted"><CheckCircle2 className="inline w-5 h-5 text-status-ok mr-2" aria-hidden="true" />{filter === 'open' ? 'No open incidents. All clear.' : 'Nothing here yet.'}</p>
          : (
            <ul className="space-y-2">
              {rows.map((i) => {
                const [variant, label] = SEV[i.severity] || SEV.normal;
                const critical = i.severity === 'critical' && i.status === 'open';
                return (
                  <li key={i.id} className={`flex flex-wrap items-center gap-4 rounded-[18px] px-4 py-4 ${critical ? 'bg-status-danger-bg border-[1.5px] border-status-danger' : 'bg-surface-subtle'}`}>
                    <span className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${critical ? 'bg-status-danger text-brand-on' : 'bg-surface-card text-ink'}`}>
                      {i.type === 'sos' ? <Siren className="w-5 h-5" aria-hidden="true" /> : <TriangleAlert className="w-5 h-5" aria-hidden="true" />}
                    </span>
                    <div className="flex-1 min-w-[240px]">
                      <p className={`text-[16px] font-semibold ${critical ? 'text-status-danger' : 'text-ink'}`}>{i.title}</p>
                      <p className="text-[13px] text-ink-muted">
                        <span className="font-mono">{i.code}</span> · {i.location} · reported by {i.reportedBy || '—'} · {format(new Date(i.createdAt), 'MMM d, h:mm a')} ({formatDistanceToNow(new Date(i.createdAt), { addSuffix: true })})
                      </p>
                      {i.description && <p className="mt-1 text-[14px] text-ink">{i.description}</p>}
                      {i.status === 'resolved' && <p className="mt-1 text-[14px] text-status-ok">Resolved by {i.resolvedBy}: {i.resolution}</p>}
                    </div>
                    <Badge variant={variant}>{label}</Badge>
                    {i.status === 'open'
                      ? <button onClick={() => { setResolving(i); setNote(''); }} className={`h-11 px-5 rounded-full text-[14px] font-semibold ${critical ? 'bg-brand text-brand-on' : 'bg-surface-card border border-line text-ink hover:bg-surface-subtle'}`}>Resolve</button>
                      : <Badge variant="success">Resolved</Badge>}
                  </li>
                );
              })}
            </ul>
          )}
      </section>

      {resolving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="resolve-title">
          <div className="w-full max-w-lg rounded-card bg-surface-card shadow-modal p-6">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="resolve-title" className="text-[20px] font-semibold text-ink">Resolve {resolving.code}</h2><p className="text-[14px] text-ink-muted">{resolving.title}</p></div>
              <button onClick={() => setResolving(null)} aria-label="Close" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-surface-subtle"><X className="w-5 h-5" /></button>
            </div>
            <label className="block mt-4">
              <span className="block text-[14px] font-semibold text-ink mb-1.5">What was done? <span className="text-status-danger" aria-hidden="true">*</span></span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} required
                className="w-full rounded-xl border border-input bg-surface-card px-3.5 py-2.5 text-[15px] text-ink focus:outline-none focus:ring-2 focus:ring-brand" placeholder="e.g. Barrier arm replaced; guard confirmed working." />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setResolving(null)} className="h-11 px-5 rounded-full text-[15px] font-semibold text-ink-muted hover:bg-surface-subtle">Cancel</button>
              <button onClick={resolve} disabled={busy || !note.trim()} className="h-11 px-6 rounded-full bg-brand text-brand-on text-[15px] font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Mark resolved'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentsPage;
