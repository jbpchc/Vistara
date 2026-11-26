import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/api/axios';
import { useToast } from '@/hooks/use-toast';

/** Guard incident report (tablet). Big targets, three quick choices, then send. */
const TYPES = [['security', 'Security'], ['facility', 'Facility / gate'], ['visitor', 'Visitor issue'], ['other', 'Other']];
const SEVS = [['normal', 'Normal'], ['high', 'High'], ['critical', 'Critical']];

const GuardIncidentsPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ type: 'security', severity: 'normal', title: '', description: '', location: 'Main Gate' });
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState([]);

  const load = useCallback(() => { api.get('/incidents').then((r) => setRecent((r.data.data || []).slice(0, 6))).catch(() => {}); }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const r = await api.post('/incidents', form);
      toast({ variant: 'success', title: 'Report sent', description: r.data.message });
      setForm({ ...form, title: '', description: '' });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Could not send', description: err.response?.data?.message || 'Check the connection and try again.' });
    } finally { setBusy(false); }
  };

  const chip = (on) => `h-12 px-5 rounded-full text-[15px] font-semibold border ${on ? 'bg-g-accent-soft border-g-accent-soft text-g-accent-ink' : 'border-g-border text-g-text-2 hover:text-g-text'}`;
  const input = 'w-full rounded-xl border border-g-border-strong bg-g-surface px-4 text-[16px] text-g-text placeholder:text-g-text-2 focus:outline-none focus:ring-2 focus:ring-g-accent';

  return (
    <div className="max-w-[1180px] mx-auto anim-fade-in">
      <Link to="/guard/dashboard" className="inline-flex items-center gap-2 h-12 px-5 rounded-full border border-g-border bg-g-surface text-g-text text-[15px] font-semibold hover:border-g-accent">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to console
      </Link>
      <div className="mt-5 grid lg:grid-cols-[1fr_400px] gap-5">
        <form onSubmit={submit} className="rounded-card border border-g-border bg-g-surface p-6 space-y-5">
          <h1 className="text-[28px] font-semibold text-g-text">Report an incident</h1>
          <fieldset><legend className="text-[15px] font-semibold text-g-text mb-2">Type</legend>
            <div className="flex flex-wrap gap-2.5">{TYPES.map(([k, l]) => <button type="button" key={k} aria-pressed={form.type === k} onClick={() => setForm({ ...form, type: k })} className={chip(form.type === k)}>{l}</button>)}</div>
          </fieldset>
          <fieldset><legend className="text-[15px] font-semibold text-g-text mb-2">Severity</legend>
            <div className="flex flex-wrap gap-2.5">{SEVS.map(([k, l]) => <button type="button" key={k} aria-pressed={form.severity === k} onClick={() => setForm({ ...form, severity: k })} className={chip(form.severity === k)}>{l}</button>)}</div>
          </fieldset>
          <label className="block"><span className="block text-[15px] font-semibold text-g-text mb-1.5">What happened? <span className="text-g-danger" aria-hidden="true">*</span></span>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Barrier arm stuck open" className={`${input} h-14`} /></label>
          <label className="block"><span className="block text-[15px] font-semibold text-g-text mb-1.5">Details</span>
            <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Who, what, plate numbers…" className={`${input} py-3`} /></label>
          <label className="block"><span className="block text-[15px] font-semibold text-g-text mb-1.5">Location</span>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={`${input} h-14`} /></label>
          <button type="submit" disabled={busy || !form.title.trim()} className="w-full h-14 rounded-full bg-g-accent text-g-on-accent text-[17px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" aria-hidden="true" />} Send to HOA office
          </button>
          <p className="text-[14px] text-g-text-2">Emergency? Hold the red SOS button on the rail for 2 seconds instead.</p>
        </form>
        <section className="rounded-card border border-g-border bg-g-surface p-6" aria-labelledby="recent-inc">
          <h2 id="recent-inc" className="text-[20px] font-semibold text-g-text">Recent reports</h2>
          <ul className="mt-3 divide-y divide-g-border">
            {recent.length === 0 && <li className="py-4 text-g-text-2">No reports yet.</li>}
            {recent.map((i) => (
              <li key={i.id} className="py-3">
                <p className="text-[16px] font-semibold text-g-text">{i.title}</p>
                <p className="text-[13px] text-g-text-2"><span className="font-mono">{i.code}</span> · {format(new Date(i.createdAt), 'MMM d, h:mm a')} · <span className={i.status === 'open' ? 'text-g-warn' : 'text-g-ok'}>{i.status === 'open' ? 'Open' : 'Resolved'}</span></p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default GuardIncidentsPage;
