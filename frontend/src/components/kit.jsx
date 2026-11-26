import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Info, TriangleAlert, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import api from '@/api/axios';

/**
 * Shared building blocks for the list/detail screens (Figma A02–A25, H02–H13, G06–G18).
 * Built on the semantic theme tokens (card, muted, border, foreground, primary, success…),
 * so the same components render correctly in the admin/resident theme and in guard Night/Day.
 */

export const useResource = (url, { poll } = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => api.get(url).then((r) => { setData(r.data.data); setError(null); }).catch((e) => setError(e.response?.data?.message || 'Could not load data.')), [url]);
  useEffect(() => { load(); if (!poll) return undefined; const t = setInterval(load, poll); return () => clearInterval(t); }, [load, poll]);
  return { data, error, reload: load, setData };
};

export const Page = ({ title, subtitle, actions, back, children, width = 'max-w-[1400px]' }) => (
  <div className={`${width} mx-auto space-y-6 anim-fade-in`}>
    {back && (
      <Link to={back.to} className="inline-flex items-center gap-1.5 h-11 px-4 rounded-full border border-border bg-card text-[14px] font-semibold text-foreground hover:bg-muted">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> {back.label}
      </Link>
    )}
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[34px] sm:text-[40px] leading-tight font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {children}
  </div>
);

export const Btn = ({ variant = 'secondary', className = '', children, ...rest }) => {
  const v = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'border border-border bg-card text-foreground hover:bg-muted',
    ghost: 'text-foreground hover:bg-muted',
    danger: 'border border-danger/40 bg-card text-danger hover:bg-danger-bg',
  }[variant];
  return <button type="button" className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full text-[15px] font-semibold transition-colors disabled:opacity-50 ${v} ${className}`} {...rest}>{children}</button>;
};

export const Panel = ({ title, aside, className = '', children, ...rest }) => (
  <section className={`rounded-card border border-border bg-card p-6 ${className}`} {...rest}>
    {(title || aside) && <div className="flex items-center justify-between gap-3 mb-4">{title && <h2 className="text-[19px] font-semibold text-foreground">{title}</h2>}{aside}</div>}
    {children}
  </section>
);

export const Stats = ({ items }) => (
  <div className={`grid gap-4 grid-cols-2 ${items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
    {items.map((s) => (
      <div key={s.label} className={`rounded-[22px] border border-border p-5 ${s.tone === 'danger' ? 'bg-danger-bg' : s.tone === 'warning' ? 'bg-warning-bg' : 'bg-card'}`}>
        <p className={`text-[14px] font-semibold ${s.tone === 'danger' ? 'text-danger' : s.tone === 'warning' ? 'text-warning' : 'text-muted-foreground'}`}>{s.label}</p>
        <p className={`mt-2 text-[34px] leading-none font-semibold tabular-nums ${s.tone === 'danger' ? 'text-danger' : 'text-foreground'}`}>{s.value}</p>
        {s.sub && <p className="mt-2 text-[13px] text-muted-foreground">{s.sub}</p>}
      </div>
    ))}
  </div>
);

export const Tabs = ({ items, value, onChange, label = 'Filter' }) => (
  <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
    {items.map((t) => (
      <button key={t.k} role="tab" aria-selected={value === t.k} onClick={() => onChange(t.k)}
        className={`h-10 px-4 rounded-full text-[14px] font-semibold transition-colors ${value === t.k ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:bg-muted'}`}>
        {t.label}{t.count != null && <span className="ml-1.5 opacity-80 tabular-nums">{t.count}</span>}
      </button>
    ))}
  </div>
);

export const SearchBox = ({ value, onChange, placeholder, className = '' }) => (
  <label className={`flex items-center gap-2 h-11 px-4 rounded-full border border-input bg-card focus-within:ring-2 focus-within:ring-ring ${className}`}>
    <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
    <span className="sr-only">{placeholder}</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="flex-1 min-w-0 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none" />
  </label>
);

export const Notice = ({ tone = 'info', children, action }) => {
  const t = { info: ['bg-success-bg text-success', Info], warning: ['bg-warning-bg text-warning', TriangleAlert], danger: ['bg-danger-bg text-danger', TriangleAlert], success: ['bg-success-bg text-success', CheckCircle2] }[tone];
  const Icon = t[1];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`flex flex-wrap items-center gap-3 rounded-[18px] px-5 py-3.5 text-[14px] font-semibold ${t[0]}`}>
      <Icon className="w-5 h-5 shrink-0" aria-hidden="true" /><span className="flex-1 min-w-[200px]">{children}</span>{action}
    </div>
  );
};

/** Status pill: dot + word + colour (never colour alone). */
const TONES = { success: 'bg-success-bg text-success', warning: 'bg-warning-bg text-warning', danger: 'bg-danger-bg text-danger', info: 'bg-info-bg text-info', neutral: 'bg-muted text-muted-foreground' };
export const Pill = ({ tone = 'neutral', children }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-semibold leading-none whitespace-nowrap ${TONES[tone]}`}>
    <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-current" />{children}
  </span>
);

/** Data table with client-side pagination (10 per page). */
export const Table = ({ cols, rows, onRow, rowTone, empty = 'Nothing here yet.', label, pageSize = 10 }) => {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows?.length]);
  if (!rows) return <div className="rounded-card border border-border bg-card p-10 text-center text-muted-foreground"><Loader2 className="inline w-5 h-5 animate-spin" /> Loading…</div>;
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const shown = rows.slice((page - 1) * pageSize, page * pageSize);
  return (
    <div className="rounded-card border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[760px]" aria-label={label}>
          <thead className="bg-muted">
            <tr>{cols.map((c) => <th key={c.k} scope="col" className="px-4 py-3.5 text-[13px] font-semibold text-muted-foreground whitespace-nowrap" style={c.w ? { width: c.w } : undefined}>{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}
            {shown.map((r, i) => (
              <tr key={r.id ?? i} onClick={onRow ? () => onRow(r) : undefined}
                className={`border-t border-border ${onRow ? 'cursor-pointer hover:bg-muted/60' : ''} ${rowTone?.(r) === 'danger' ? 'bg-danger-bg/60' : rowTone?.(r) === 'warning' ? 'bg-warning-bg/50' : ''}`}>
                {cols.map((c) => <td key={c.k} className={`px-4 py-3.5 text-[15px] text-foreground align-middle ${c.mono ? 'font-mono text-[14px]' : ''}`}>{c.render ? c.render(r) : r[c.k] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border text-[14px] text-muted-foreground">
        <span>Showing {rows.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, rows.length)} of {rows.length}</span>
        {pages > 1 && (
          <span className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
            <span className="tabular-nums">{page} / {pages}</span>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} aria-label="Next page" className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
          </span>
        )}
      </div>
    </div>
  );
};

export const Modal = ({ title, subtitle, onClose, children, footer, wide }) => {
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto rounded-card bg-card border border-border shadow-modal`}>
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div><h2 id="modal-title" className="text-[20px] font-semibold text-foreground">{title}</h2>{subtitle && <p className="text-[14px] text-muted-foreground">{subtitle}</p>}</div>
          <button onClick={onClose} aria-label="Close" className="w-11 h-11 -mr-2 -mt-2 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
        {footer && <div className="px-6 pb-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

let fieldSeq = 0;
export const Field = ({ label, hint, required, children }) => {
  const [id] = useState(() => `f${++fieldSeq}`);
  return (
    <div>
      <label htmlFor={id} className="block text-[14px] font-semibold text-foreground mb-1.5">{label}{required && <span className="text-danger" aria-hidden="true"> *</span>}</label>
      {children(id)}
      {hint && <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
};
export const inputCls = 'w-full h-11 px-3.5 rounded-xl border border-input bg-card text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';
export const areaCls = 'w-full px-3.5 py-2.5 rounded-xl border border-input bg-card text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export const Toggle = ({ checked, onChange, label }) => (
  <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
    className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-muted border border-input'}`}>
    <span className={`absolute top-1 w-5 h-5 rounded-full bg-card shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </button>
);

export const DL = ({ items }) => (
  <dl className="grid grid-cols-[minmax(110px,auto)_1fr] gap-x-4 gap-y-2.5 text-[15px]">
    {items.filter(Boolean).map(([k, v]) => [<dt key={`${k}-t`} className="text-muted-foreground">{k}</dt>, <dd key={`${k}-d`} className="text-foreground">{v ?? '—'}</dd>])}
  </dl>
);

export const useFiltered = (rows, { tab, tabKey = 'status', q, fields = [] }) => useMemo(() => {
  if (!rows) return null;
  const s = q?.trim().toLowerCase();
  return rows.filter((r) => (!tab || tab === 'all' || r[tabKey] === tab) && (!s || fields.some((f) => String(r[f] ?? '').toLowerCase().includes(s))));
}, [rows, tab, tabKey, q, fields.join()]);

export const count = (rows, key, value) => (rows ? rows.filter((r) => r[key] === value).length : null);

export const fmtDate = (d, withTime) => {
  if (!d) return '—';
  const x = new Date(d.length === 10 ? `${d}T12:00:00` : d);
  return x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}) });
};
export const daysUntil = (d) => Math.ceil((new Date(`${d}T12:00:00`) - new Date()) / 86400e3);
