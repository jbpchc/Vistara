import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Download, Plus, ClipboardCheck, CheckCircle2, Bell } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/api/axios';
import { useToast } from '@/hooks/use-toast';
import {
  Page, Btn, Panel, Stats, Tabs, SearchBox, Notice, Pill, Table, Modal, Field, inputCls, areaCls, Toggle, DL,
  useResource, useFiltered, count, fmtDate, daysUntil,
} from '@/components/kit';

/* Admin registry, review and administration screens — Figma A08–A25. */

const csv = (name, rows) => {
  const body = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' })); a.download = name; a.click();
};
const useSave = () => {
  const { toast } = useToast();
  return async (fn, ok) => {
    try { const r = await fn(); toast({ variant: 'success', title: ok || 'Saved', description: r?.data?.message }); return true; }
    catch (e) { toast({ variant: 'destructive', title: 'Could not save', description: e.response?.data?.message || 'Please try again.' }); return false; }
  };
};
const LoadError = ({ error }) => (error ? <Notice tone="danger">{error}</Notice> : null);

/* ── A14 Visitor passes ─────────────────────────────────────────────────── */
const PASS_TONE = { active: 'success', inside: 'info', used: 'neutral', expired: 'danger' };
export const VisitorPasses = () => {
  const { data, error, reload } = useResource('/hub/visitorPasses');
  const save = useSave();
  const [tab, setTab] = useState('active'); const [q, setQ] = useState(''); const [sel, setSel] = useState(null);
  const rows = useFiltered(data, { tab, q, fields: ['guest', 'resident', 'property', 'code'] });
  return (
    <Page title="Visitor passes" subtitle="Every QR pass residents have created. Revoke a pass to stop its QR code from working."
      actions={<Btn onClick={() => data && csv('visitor-passes.csv', [['Code', 'Guest', 'Resident', 'Property', 'Date', 'Status'], ...data.map((p) => [p.code, p.guest, p.resident, p.property, p.date, p.status])])}><Download className="w-4 h-4" aria-hidden="true" /> Export CSV</Btn>}>
      <LoadError error={error} />
      <Tabs value={tab} onChange={setTab} items={[{ k: 'active', label: 'Active', count: count(data, 'status', 'active') }, { k: 'inside', label: 'Inside', count: count(data, 'status', 'inside') }, { k: 'used', label: 'Used', count: count(data, 'status', 'used') }, { k: 'expired', label: 'Expired', count: count(data, 'status', 'expired') }, { k: 'all', label: 'All', count: data?.length }]} />
      <SearchBox value={q} onChange={setQ} placeholder="Search guest, resident, property or pass ID" className="max-w-xl" />
      <Table label="Visitor passes" rows={rows} onRow={setSel} cols={[
        { k: 'code', label: 'Pass ID', mono: true }, { k: 'guest', label: 'Guest' }, { k: 'resident', label: 'Resident' }, { k: 'property', label: 'Property' },
        { k: 'date', label: 'Valid on', render: (r) => fmtDate(r.date) }, { k: 'purpose', label: 'Purpose' },
        { k: 'status', label: 'Status', render: (r) => <Pill tone={PASS_TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Pill> },
      ]} />
      {sel && (
        <Modal title={`Pass ${sel.code}`} subtitle={`${sel.guest} · ${sel.property}`} onClose={() => setSel(null)}
          footer={<>{sel.status === 'active' && <Btn variant="danger" onClick={async () => { if (await save(() => api.patch(`/hub/visitorPasses/${sel.id}`, {}), 'Pass revoked')) { setSel(null); reload(); } }}>Revoke pass</Btn>}<Btn onClick={() => setSel(null)}>Close</Btn></>}>
          <DL items={[['Guest', sel.guest], ['Resident', sel.resident], ['Property', sel.property], ['Valid on', fmtDate(sel.date)], ['Purpose', sel.purpose], ['Created', fmtDate(sel.createdAt, true)], ['Scanned', sel.scannedAt ? fmtDate(sel.scannedAt, true) : 'Not yet'], ['Status', <Pill key="s" tone={PASS_TONE[sel.status]}>{sel.status}</Pill>]]} />
        </Modal>
      )}
    </Page>
  );
};

/* ── A12 Document review queue ──────────────────────────────────────────── */
const DOC_TONE = { pending: 'warning', approved: 'success', rejected: 'danger', reupload: 'info' };
const DOC_LABEL = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', reupload: 'Re-upload requested' };
const waitDays = (d) => Math.max(0, Math.floor((Date.now() - new Date(d)) / 86400e3));
export const Documents = () => {
  const { data, error } = useResource('/hub/documents');
  const nav = useNavigate();
  const [tab, setTab] = useState('pending'); const [q, setQ] = useState('');
  const rows = useFiltered(data, { tab, q, fields: ['resident', 'property', 'related', 'code', 'type'] });
  const sorted = rows && [...rows].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
  const old = data?.filter((d) => d.status === 'pending' && waitDays(d.submittedAt) > 3).length;
  const next = data && [...data].filter((d) => d.status === 'pending').sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt))[0];
  return (
    <Page title="Document review queue" subtitle="Review submissions carefully. Oldest first."
      actions={next && <Btn variant="primary" onClick={() => nav(`/admin/documents/${next.id}`)}><ClipboardCheck className="w-4 h-4" aria-hidden="true" /> Review next</Btn>}>
      <LoadError error={error} />
      <Tabs value={tab} onChange={setTab} items={Object.keys(DOC_LABEL).map((k) => ({ k, label: DOC_LABEL[k], count: count(data, 'status', k) })).concat({ k: 'all', label: 'All', count: data?.length })} />
      <SearchBox value={q} onChange={setQ} placeholder="Search resident, property or related plate" className="max-w-xl" />
      {old > 0 && tab === 'pending' && <Notice tone="warning">{old} submission{old > 1 ? 's have' : ' has'} been waiting more than 3 days. Start with the oldest document.</Notice>}
      <Table label="Documents" rows={sorted} onRow={(r) => nav(`/admin/documents/${r.id}`)} rowTone={(r) => (r.status === 'pending' && waitDays(r.submittedAt) > 3 ? 'warning' : null)} cols={[
        { k: 'submittedAt', label: 'Submitted', render: (r) => fmtDate(r.submittedAt, true) }, { k: 'resident', label: 'Resident' }, { k: 'property', label: 'Property' },
        { k: 'type', label: 'Document type' }, { k: 'related', label: 'Related record', mono: true },
        { k: 'status', label: 'Status', render: (r) => <Pill tone={DOC_TONE[r.status]}>{DOC_LABEL[r.status]}</Pill> },
        { k: 'wait', label: 'Waiting', render: (r) => (r.status === 'pending' ? `${waitDays(r.submittedAt)} day${waitDays(r.submittedAt) === 1 ? '' : 's'}` : '—') },
        { k: 'reviewer', label: 'Reviewer', render: (r) => r.reviewer || 'Unassigned' },
        { k: 'go', label: 'Action', render: () => <span className="font-semibold text-primary">Review →</span> },
      ]} />
    </Page>
  );
};

/* ── A13 Review document ────────────────────────────────────────────────── */
const CHECKS = ['Image readable', 'Name matches resident', 'Plate or property matches', 'Not expired'];
export const DocumentReview = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const save = useSave();
  const { data, error } = useResource('/hub/documents');
  const [checks, setChecks] = useState({}); const [decision, setDecision] = useState('approve'); const [remarks, setRemarks] = useState(''); const [zoom, setZoom] = useState(100);
  const doc = data?.find((d) => d.id === +id);
  const queue = data?.filter((d) => d.status === 'pending').sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)) || [];
  const idx = queue.findIndex((d) => d.id === +id);
  const allChecked = CHECKS.every((c) => checks[c]);
  const needsRemarks = decision !== 'approve';
  const remarksOk = !needsRemarks || (remarks.trim().length >= 10 && remarks.trim().length <= 300);
  const canSubmit = doc?.status === 'pending' && (decision === 'approve' ? allChecked : remarksOk);

  if (!data) return <Page title="Review document"><LoadError error={error} /></Page>;
  if (!doc) return <Page title="Document not found" back={{ to: '/admin/documents', label: 'Back to queue' }} />;

  const submit = async () => {
    const status = { approve: 'approved', reject: 'rejected', reupload: 'reupload' }[decision];
    const ok = await save(() => api.patch(`/hub/documents/${doc.id}`, { status, remarks: remarks.trim() || null, reviewer: 'Julia Baretto', history: [...doc.history, `${DOC_LABEL[status]}${remarks ? `: ${remarks.trim()}` : ''}`] }), 'Decision submitted — the resident was notified');
    if (ok) { const nxt = queue.filter((d) => d.id !== doc.id)[0]; nav(nxt ? `/admin/documents/${nxt.id}` : '/admin/documents'); setChecks({}); setRemarks(''); setDecision('approve'); }
  };

  return (
    <Page title={`Review document · ${doc.code}`} subtitle={`${DOC_LABEL[doc.status]} ${doc.type} · ${doc.resident} · ${doc.property}`}
      actions={<>
        <Link to="/admin/documents" className="inline-flex items-center h-11 px-5 rounded-full border border-border bg-card text-[15px] font-semibold text-foreground hover:bg-muted">Back to queue</Link>
        <Btn disabled={idx <= 0} onClick={() => nav(`/admin/documents/${queue[idx - 1].id}`)}>Previous</Btn>
        <Btn variant="primary" disabled={idx < 0 || idx >= queue.length - 1} onClick={() => nav(`/admin/documents/${queue[idx + 1].id}`)}>Next</Btn>
      </>}>
      <div className="grid xl:grid-cols-[1fr_420px] gap-6 items-start [&>*]:min-w-0">
        <Panel title="Document viewer" aside={<span className="text-[13px] text-muted-foreground">Version {doc.version}</span>}>
          <div className="flex flex-wrap gap-2 mb-4">
            <Btn onClick={() => setZoom((z) => Math.max(50, z - 25))} aria-label="Zoom out">−</Btn>
            <span className="h-11 px-4 rounded-full border border-border flex items-center text-[15px] tabular-nums">{zoom}%</span>
            <Btn onClick={() => setZoom((z) => Math.min(200, z + 25))} aria-label="Zoom in">+</Btn>
          </div>
          <div className="rounded-[18px] bg-muted p-3 sm:p-6 overflow-auto max-h-[560px]">
            {/* Up to 100% the page fits the viewer; zooming in past that scrolls */}
            <div className="mx-auto bg-card border border-border rounded-lg p-5 sm:p-8 shadow-card" style={{ width: zoom <= 100 ? `min(100%, ${(zoom / 100) * 480}px)` : `${(zoom / 100) * 480}px`, fontSize: `${(zoom / 100) * 15}px` }}>
              <p className="text-[0.75em] font-bold tracking-[0.08em] text-success">SAMPLE DOCUMENT — NOT AN OFFICIAL RECORD</p>
              <p className="mt-3 text-[1.35em] font-semibold text-foreground">{doc.type === 'Lease contract' ? 'Lease contract sample' : doc.type === 'OR/CR' ? 'Vehicle registration sample' : 'Driver’s license sample'}</p>
              <hr className="my-4 border-foreground" />
              <DL items={[['Resident', doc.resident], ['Property', doc.property], ['Related record', doc.related], ['Validity', fmtDate(doc.validity)], ['Reference', `SAMPLE-ONLY-${doc.id}`]]} />
              <p className="mt-6 text-center text-[1.2em] font-semibold text-foreground">For HOA review only</p>
            </div>
          </div>
          <div className="mt-4"><Notice tone="info">Opening a document is recorded in the audit log. Use it only for HOA review.</Notice></div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Submission details"><DL items={[['Resident', doc.resident], ['Property', doc.property], ['Document type', doc.type], ['Uploaded', fmtDate(doc.submittedAt, true)], ['Version', `v${doc.version} current`], ['Validity', fmtDate(doc.validity)]]} /></Panel>
          {doc.status === 'pending' ? (
            <>
              <Panel title="Verification checklist">
                <p className="-mt-2 mb-3 text-[14px] text-muted-foreground">All four checks are required before approval.</p>
                <fieldset className="space-y-1"><legend className="sr-only">Verification checklist</legend>
                  {CHECKS.map((c) => (
                    <label key={c} className="flex items-center gap-3 min-h-[44px] text-[15px] text-foreground cursor-pointer">
                      <input type="checkbox" className="w-5 h-5 accent-[hsl(var(--primary))]" checked={!!checks[c]} onChange={(e) => setChecks({ ...checks, [c]: e.target.checked })} /> {c}
                    </label>
                  ))}
                </fieldset>
              </Panel>
              <Panel title="Decision">
                <fieldset className="space-y-1"><legend className="sr-only">Decision</legend>
                  {[['approve', 'Approve'], ['reject', 'Reject'], ['reupload', 'Request re-upload']].map(([k, l]) => (
                    <label key={k} className="flex items-center gap-3 min-h-[44px] text-[15px] text-foreground cursor-pointer">
                      <input type="radio" name="decision" className="w-5 h-5 accent-[hsl(var(--primary))]" checked={decision === k} onChange={() => setDecision(k)} /> {l}
                    </label>
                  ))}
                </fieldset>
                <div className="mt-3">
                  <Field label="Remarks" required={needsRemarks} hint={needsRemarks ? `10–300 characters, shown to the resident (${remarks.trim().length}/300).` : 'Optional when approving.'}>
                    {(fid) => <textarea id={fid} rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={areaCls} placeholder={needsRemarks ? 'e.g. Image is blurred. Please upload a clearer copy.' : 'e.g. Registration details are legible and match the resident record.'} />}
                  </Field>
                </div>
                {decision === 'approve' && !allChecked && <p className="mt-3 text-[14px] text-warning font-semibold">Tick all four checks to approve.</p>}
                <div className="mt-4"><Notice tone="info">The resident will be notified when you submit the decision.</Notice></div>
                <Btn variant="primary" className="mt-4" disabled={!canSubmit} onClick={submit}>Submit decision</Btn>
              </Panel>
            </>
          ) : (
            <Panel title="Decision"><p className="text-[15px] text-foreground"><Pill tone={DOC_TONE[doc.status]}>{DOC_LABEL[doc.status]}</Pill></p>{doc.remarks && <p className="mt-3 text-[15px] text-foreground">“{doc.remarks}”</p>}</Panel>
          )}
          <Panel title="Prior-decision history">{doc.history.length ? <ul className="space-y-2 text-[15px] text-foreground list-disc pl-5">{doc.history.map((h, i) => <li key={i}>{h}</li>)}</ul> : <p className="text-muted-foreground">No earlier decisions.</p>}</Panel>
        </div>
      </div>
    </Page>
  );
};

/* ── A17/A18 Item gate passes ───────────────────────────────────────────── */
const IGP_TONE = { pending: 'warning', approved: 'success', rejected: 'danger', completed: 'neutral' };
export const ItemPasses = () => {
  const { data, error, reload } = useResource('/hub/itemPasses');
  const save = useSave();
  const [tab, setTab] = useState('pending'); const [q, setQ] = useState(''); const [sel, setSel] = useState(null); const [remarks, setRemarks] = useState('');
  const rows = useFiltered(data, { tab, q, fields: ['resident', 'property', 'items', 'code', 'carrier'] });
  const decide = async (status) => {
    if (status === 'rejected' && remarks.trim().length < 10) return;
    if (await save(() => api.patch(`/hub/itemPasses/${sel.id}`, { status, remarks: remarks.trim() || null }), status === 'approved' ? 'Item pass approved' : 'Item pass rejected')) { setSel(null); setRemarks(''); reload(); }
  };
  return (
    <Page title="Item gate pass queue" subtitle="Requests to move furniture, appliances or materials in or out of a property.">
      <LoadError error={error} />
      <Tabs value={tab} onChange={setTab} items={['pending', 'approved', 'rejected', 'completed'].map((k) => ({ k, label: k[0].toUpperCase() + k.slice(1), count: count(data, 'status', k) })).concat({ k: 'all', label: 'All', count: data?.length })} />
      <SearchBox value={q} onChange={setQ} placeholder="Search resident, property, items or pass ID" className="max-w-xl" />
      <Table label="Item gate passes" rows={rows} onRow={(r) => { setSel(r); setRemarks(''); }} cols={[
        { k: 'code', label: 'Pass ID', mono: true }, { k: 'resident', label: 'Resident' }, { k: 'property', label: 'Property' },
        { k: 'direction', label: 'Direction', render: (r) => (r.direction === 'in' ? 'Move in' : 'Move out') }, { k: 'items', label: 'Items' },
        { k: 'date', label: 'Scheduled', render: (r) => fmtDate(r.date) }, { k: 'status', label: 'Status', render: (r) => <Pill tone={IGP_TONE[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Pill> },
      ]} />
      {sel && (
        <Modal title={`Item gate pass · ${sel.code}`} subtitle={`${sel.resident} · ${sel.property}`} onClose={() => setSel(null)} footer={sel.status === 'pending' ? <>
          <Btn variant="danger" disabled={remarks.trim().length < 10} onClick={() => decide('rejected')}>Reject</Btn>
          <Btn variant="primary" onClick={() => decide('approved')}>Approve</Btn></> : <Btn onClick={() => setSel(null)}>Close</Btn>}>
          <DL items={[['Direction', sel.direction === 'in' ? 'Move in' : 'Move out'], ['Items', sel.items], ['Carrier', sel.carrier], ['Scheduled', fmtDate(sel.date)], ['Requested', fmtDate(sel.requestedAt, true)], ['Status', <Pill key="s" tone={IGP_TONE[sel.status]}>{sel.status}</Pill>], sel.remarks && ['Remarks', sel.remarks]]} />
          {sel.status === 'pending' && (
            <Field label="Remarks for the resident" hint="Required to reject (at least 10 characters). The guard sees approved passes when the items leave the gate.">
              {(fid) => <textarea id={fid} rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className={areaCls} />}
            </Field>
          )}
        </Modal>
      )}
    </Page>
  );
};

/* ── A08 Tenants and leases ─────────────────────────────────────────────── */
const LEASE_TONE = { active: 'success', ending: 'warning', ended: 'neutral' };
export const Tenants = () => {
  const { data, error, reload } = useResource('/hub/tenants');
  const save = useSave();
  const [tab, setTab] = useState('all'); const [q, setQ] = useState(''); const [sel, setSel] = useState(null); const [newEnd, setNewEnd] = useState('');
  const rows = useFiltered(data, { tab, q, fields: ['tenant', 'owner', 'property'] });
  const ending = count(data, 'status', 'ending');
  const renew = async () => {
    if (!newEnd || newEnd <= sel.end) return;
    if (await save(() => api.patch(`/hub/tenants/${sel.id}`, { end: newEnd, status: daysUntil(newEnd) <= 30 ? 'ending' : 'active' }), 'Lease renewed')) { setSel(null); reload(); }
  };
  return (
    <Page title="Tenants and leases" subtitle="Tenants keep gate access only while their lease is active.">
      <LoadError error={error} />
      <Stats items={[{ label: 'Active leases', value: count(data, 'status', 'active') ?? '—' }, { label: 'Ending within 30 days', value: ending ?? '—', tone: ending ? 'warning' : null }, { label: 'Ended', value: count(data, 'status', 'ended') ?? '—', sub: 'Gate access removed' }]} />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onChange={setTab} items={[{ k: 'all', label: 'All' }, { k: 'active', label: 'Active' }, { k: 'ending', label: 'Ending soon' }, { k: 'ended', label: 'Ended' }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search tenant, owner or property" className="flex-1 min-w-[240px]" />
      </div>
      <Table label="Leases" rows={rows} onRow={(r) => { setSel(r); setNewEnd(''); }} rowTone={(r) => (r.status === 'ending' ? 'warning' : null)} cols={[
        { k: 'tenant', label: 'Tenant' }, { k: 'owner', label: 'Owner' }, { k: 'property', label: 'Property' }, { k: 'start', label: 'Start', render: (r) => fmtDate(r.start) },
        { k: 'end', label: 'Ends', render: (r) => fmtDate(r.end) }, { k: 'left', label: 'Days left', render: (r) => (r.status === 'ended' ? '—' : daysUntil(r.end)) },
        { k: 'status', label: 'Status', render: (r) => <Pill tone={LEASE_TONE[r.status]}>{r.status === 'ending' ? 'Ending soon' : r.status[0].toUpperCase() + r.status.slice(1)}</Pill> },
      ]} />
      {sel && (
        <Modal title={sel.tenant} subtitle={`${sel.property} · owner ${sel.owner}`} onClose={() => setSel(null)} footer={<>
          {sel.status !== 'ended' && <Btn variant="danger" onClick={async () => { if (await save(() => api.patch(`/hub/tenants/${sel.id}`, { status: 'ended' }), 'Lease ended — gate access removed')) { setSel(null); reload(); } }}>End lease</Btn>}
          <Btn variant="primary" disabled={!newEnd || newEnd <= sel.end} onClick={renew}>Renew lease</Btn></>}>
          <DL items={[['Contact', sel.contact], ['Lease start', fmtDate(sel.start)], ['Lease end', fmtDate(sel.end)], ['Status', <Pill key="s" tone={LEASE_TONE[sel.status]}>{sel.status}</Pill>]]} />
          <Field label="New end date" hint="Must be later than the current end date.">{(fid) => <input id={fid} type="date" min={sel.end} value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className={inputCls} />}</Field>
        </Modal>
      )}
    </Page>
  );
};

/* ── A09/A11 Vehicles and sticker registry ──────────────────────────────── */
const STICKER_TONE = { issued: 'success', pending: 'warning', expired: 'danger', revoked: 'neutral' };
export const Vehicles = () => {
  const { data, error, reload } = useResource('/hub/vehicles');
  const save = useSave();
  const [view, setView] = useState('vehicles'); const [q, setQ] = useState(''); const [sel, setSel] = useState(null);
  const rows = useFiltered(data, { q, fields: ['plate', 'make', 'owner', 'property', 'sticker'] });
  const expSoon = data?.filter((v) => daysUntil(v.orcrExpiry) <= 30).length;
  const setSticker = async (stickerStatus, extra = {}) => {
    if (await save(() => api.patch(`/hub/vehicles/${sel.id}`, { stickerStatus, ...extra }), `Sticker ${stickerStatus}`)) { setSel(null); reload(); }
  };
  const nextSticker = () => `S-0${430 + (data?.length || 0)}`;
  return (
    <Page title="Vehicles and stickers" subtitle="Registered vehicles, OR/CR validity and gate sticker status.">
      <LoadError error={error} />
      <Stats items={[{ label: 'Registered vehicles', value: data?.length ?? '—' }, { label: 'Stickers issued', value: count(data, 'stickerStatus', 'issued') ?? '—' }, { label: 'Waiting for sticker', value: count(data, 'stickerStatus', 'pending') ?? '—', tone: 'warning' }, { label: 'OR/CR expiring ≤ 30 days', value: expSoon ?? '—', tone: expSoon ? 'danger' : null }]} />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={view} onChange={setView} label="View" items={[{ k: 'vehicles', label: 'Vehicles' }, { k: 'stickers', label: 'Sticker registry' }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search plate, owner, property or sticker" className="flex-1 min-w-[240px]" />
      </div>
      {view === 'vehicles' ? (
        <Table label="Vehicles" rows={rows} onRow={setSel} rowTone={(r) => (daysUntil(r.orcrExpiry) <= 0 ? 'danger' : daysUntil(r.orcrExpiry) <= 30 ? 'warning' : null)} cols={[
          { k: 'plate', label: 'Plate', mono: true }, { k: 'make', label: 'Make / model' }, { k: 'owner', label: 'Owner' }, { k: 'property', label: 'Property' },
          { k: 'orcrExpiry', label: 'OR/CR expiry', render: (r) => <>{fmtDate(r.orcrExpiry)}{daysUntil(r.orcrExpiry) <= 30 && <span className="ml-2"><Pill tone={daysUntil(r.orcrExpiry) <= 0 ? 'danger' : 'warning'}>{daysUntil(r.orcrExpiry) <= 0 ? 'Expired' : `${daysUntil(r.orcrExpiry)} days`}</Pill></span>}</> },
          { k: 'stickerStatus', label: 'Sticker', render: (r) => <Pill tone={STICKER_TONE[r.stickerStatus]}>{r.stickerStatus[0].toUpperCase() + r.stickerStatus.slice(1)}</Pill> },
        ]} />
      ) : (
        <Table label="Sticker registry" rows={rows} onRow={setSel} cols={[
          { k: 'sticker', label: 'Sticker no.', mono: true, render: (r) => r.sticker || '—' }, { k: 'plate', label: 'Plate', mono: true }, { k: 'owner', label: 'Owner' }, { k: 'property', label: 'Property' },
          { k: 'stickerStatus', label: 'Status', render: (r) => <Pill tone={STICKER_TONE[r.stickerStatus]}>{r.stickerStatus[0].toUpperCase() + r.stickerStatus.slice(1)}</Pill> },
        ]} />
      )}
      {sel && (
        <Modal title={sel.plate} subtitle={`${sel.make} · ${sel.owner}`} onClose={() => setSel(null)} footer={<>
          {sel.stickerStatus === 'issued' && <Btn variant="danger" onClick={() => setSticker('revoked')}>Revoke sticker</Btn>}
          {['pending', 'expired', 'revoked'].includes(sel.stickerStatus) && <Btn variant="primary" disabled={daysUntil(sel.orcrExpiry) <= 0} onClick={() => setSticker('issued', { sticker: sel.sticker || nextSticker() })}>Issue sticker</Btn>}
          <Btn onClick={() => setSel(null)}>Close</Btn></>}>
          <DL items={[['Property', sel.property], ['OR/CR expiry', fmtDate(sel.orcrExpiry)], ['Sticker', sel.sticker || 'Not issued'], ['Status', <Pill key="s" tone={STICKER_TONE[sel.stickerStatus]}>{sel.stickerStatus}</Pill>]]} />
          {daysUntil(sel.orcrExpiry) <= 0 && <Notice tone="danger">OR/CR is expired. Ask the resident to upload a renewed copy before issuing a sticker.</Notice>}
        </Modal>
      )}
    </Page>
  );
};

/* ── A21 Watchlist ──────────────────────────────────────────────────────── */
export const Watchlist = () => {
  const { data, error, reload } = useResource('/hub/watchlist');
  const save = useSave();
  const [tab, setTab] = useState('active'); const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', plate: '', level: 'alert', reason: '' });
  const rows = useFiltered(data, { tab });
  const valid = form.name.trim() && form.reason.trim().length >= 10;
  return (
    <Page title="Watchlist" subtitle="People and vehicles guards should watch for. Guards get an alert when they scan or search a match."
      actions={<Btn variant="primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" aria-hidden="true" /> Add entry</Btn>}>
      <LoadError error={error} />
      <Tabs value={tab} onChange={setTab} items={[{ k: 'active', label: 'Active', count: count(data, 'status', 'active') }, { k: 'removed', label: 'Removed', count: count(data, 'status', 'removed') }]} />
      <Table label="Watchlist" rows={rows} rowTone={(r) => (r.level === 'deny' && r.status === 'active' ? 'danger' : null)} cols={[
        { k: 'name', label: 'Person / vehicle' }, { k: 'plate', label: 'Plate', mono: true },
        { k: 'level', label: 'Level', render: (r) => <Pill tone={r.level === 'deny' ? 'danger' : 'warning'}>{r.level === 'deny' ? 'Deny entry' : 'Alert guard'}</Pill> },
        { k: 'reason', label: 'Reason' }, { k: 'addedBy', label: 'Added by', render: (r) => `${r.addedBy} · ${fmtDate(r.addedAt)}` },
        { k: 'act', label: 'Action', render: (r) => (r.status === 'active'
          ? <button onClick={async (e) => { e.stopPropagation(); if (await save(() => api.patch(`/hub/watchlist/${r.id}`, { status: 'removed' }), 'Removed from watchlist')) reload(); }} className="h-11 px-3 rounded-full font-semibold text-danger hover:bg-danger-bg">Remove</button>
          : <button onClick={async (e) => { e.stopPropagation(); if (await save(() => api.patch(`/hub/watchlist/${r.id}`, { status: 'active' }), 'Restored')) reload(); }} className="h-11 px-3 rounded-full font-semibold text-primary hover:bg-muted">Restore</button>) },
      ]} />
      {adding && (
        <Modal title="Add to watchlist" subtitle="Record why, so guards know what to do." onClose={() => setAdding(false)} footer={<><Btn onClick={() => setAdding(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={!valid} onClick={async () => { if (await save(() => api.post('/hub/watchlist', { ...form, plate: form.plate.trim() || '—', status: 'active', addedBy: 'Julia Baretto', addedAt: new Date().toISOString() }), 'Added to watchlist')) { setAdding(false); setForm({ name: '', plate: '', level: 'alert', reason: '' }); reload(); } }}>Add entry</Btn></>}>
          <Field label="Person or vehicle description" required>{(fid) => <input id={fid} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />}</Field>
          <Field label="Plate number">{(fid) => <input id={fid} value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} className={`${inputCls} font-mono`} placeholder="Optional" />}</Field>
          <fieldset><legend className="text-[14px] font-semibold text-foreground mb-1.5">Level</legend>
            {[['alert', 'Alert guard (allow with caution)'], ['deny', 'Deny entry']].map(([k, l]) => <label key={k} className="flex items-center gap-3 min-h-[44px] text-[15px] text-foreground"><input type="radio" name="level" className="w-5 h-5" checked={form.level === k} onChange={() => setForm({ ...form, level: k })} /> {l}</label>)}
          </fieldset>
          <Field label="Reason" required hint="At least 10 characters.">{(fid) => <textarea id={fid} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={areaCls} />}</Field>
        </Modal>
      )}
    </Page>
  );
};

/* ── A22 Reports ────────────────────────────────────────────────────────── */
export const Reports = () => {
  const { data: passes, error } = useResource('/hub/visitorPasses');
  const { data: docs } = useResource('/hub/documents');
  const { data: chart } = useResource('/admin/chart-data');
  const [range, setRange] = useState('7');
  const color = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const brand = color('--brand-primary') || '#23402A', grid = color('--border-default') || '#E6DECF', muted = color('--text-secondary') || '#5F6459';
  const byPurpose = useMemo(() => {
    if (!passes) return [];
    const m = {}; passes.forEach((p) => { m[p.purpose || 'Visit'] = (m[p.purpose || 'Visit'] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [passes]);
  const series = (chart || []).slice(-Number(range));
  const total = series.reduce((a, d) => a + d.visitors, 0);
  return (
    <Page title="Reports" subtitle="Gate traffic and review workload. Export any table as CSV."
      actions={<Btn onClick={() => csv(`gate-traffic-${range}d.csv`, [['Date', 'Visitors'], ...series.map((d) => [d.date, d.visitors])])}><Download className="w-4 h-4" aria-hidden="true" /> Export CSV</Btn>}>
      <LoadError error={error} />
      <Tabs value={range} onChange={setRange} label="Range" items={[{ k: '3', label: 'Last 3 days' }, { k: '7', label: 'Last 7 days' }]} />
      <Stats items={[{ label: 'Visitors', value: total, sub: `Last ${range} days` }, { label: 'Daily average', value: series.length ? Math.round(total / series.length) : 0 }, { label: 'Active passes', value: count(passes, 'status', 'active') ?? '—' }, { label: 'Documents pending', value: count(docs, 'status', 'pending') ?? '—', tone: 'warning' }]} />
      <div className="grid xl:grid-cols-2 gap-6 [&>*]:min-w-0">
        <Panel title="Visitors per day">
          <div className="h-64" role="img" aria-label={`Visitors per day: ${series.map((d) => `${d.date} ${d.visitors}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={series} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} /><XAxis dataKey="date" tick={{ fontSize: 12, fill: muted }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: muted }} axisLine={false} tickLine={false} /><Tooltip />
              <Area dataKey="visitors" name="Visitors" stroke={brand} strokeWidth={3} fill={brand} fillOpacity={0.12} />
            </AreaChart></ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Passes by purpose">
          <div className="h-64" role="img" aria-label={`Passes by purpose: ${byPurpose.map((d) => `${d.name} ${d.value}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%"><BarChart data={byPurpose} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={grid} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: muted }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: muted }} axisLine={false} tickLine={false} /><Tooltip />
              <Bar dataKey="value" name="Passes" fill={brand} radius={[0, 8, 8, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel title="Document review workload">
        <Table label="Documents by type" rows={docs ? ['OR/CR', "Driver's license", 'Lease contract'].map((t, i) => ({ id: i, type: t, pending: docs.filter((d) => d.type === t && d.status === 'pending').length, done: docs.filter((d) => d.type === t && d.status !== 'pending').length })) : null}
          cols={[{ k: 'type', label: 'Document type' }, { k: 'pending', label: 'Pending' }, { k: 'done', label: 'Decided' }]} />
      </Panel>
    </Page>
  );
};

/* ── A23 Audit log ──────────────────────────────────────────────────────── */
export const AuditLog = () => {
  const { data, error } = useResource('/hub/audit');
  const [role, setRole] = useState('all'); const [q, setQ] = useState('');
  const rows = useFiltered(data, { tab: role, tabKey: 'role', q, fields: ['actor', 'action', 'target', 'detail'] });
  return (
    <Page title="Audit log" subtitle="Read-only history of actions in Vistara. Entries cannot be edited or deleted."
      actions={<Btn onClick={() => data && csv('audit-log.csv', [['Time', 'Actor', 'Role', 'Action', 'Target', 'Detail'], ...data.map((a) => [a.at, a.actor, a.role, a.action, a.target, a.detail])])}><Download className="w-4 h-4" aria-hidden="true" /> Export CSV</Btn>}>
      <LoadError error={error} />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={role} onChange={setRole} label="Role" items={[{ k: 'all', label: 'All' }, { k: 'admin', label: 'Admin' }, { k: 'guard', label: 'Guard' }, { k: 'resident', label: 'Resident' }]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search person, action or record" className="flex-1 min-w-[240px]" />
      </div>
      <Table label="Audit log" rows={rows} pageSize={12} cols={[
        { k: 'at', label: 'Time', render: (r) => fmtDate(r.at, true) }, { k: 'actor', label: 'Person' }, { k: 'role', label: 'Role', render: (r) => <Pill tone="neutral">{r.role}</Pill> },
        { k: 'action', label: 'Action' }, { k: 'target', label: 'Record', mono: true }, { k: 'detail', label: 'Detail' },
      ]} />
    </Page>
  );
};

/* ── A25 Settings ───────────────────────────────────────────────────────── */
const SECTIONS = [
  ['passRules', 'Pass rules', [['maxActivePasses', 'Max active passes per household', 'number'], ['passValidityHours', 'Pass validity (hours)', 'number'], ['walkinWindowMin', 'Walk-in approval window (minutes)', 'number'], ['requireIdForWalkins', 'Require a valid ID for walk-ins', 'bool'], ['allowOvernight', 'Allow overnight visitor passes', 'bool']]],
  ['documents', 'Documents and retention', [['retentionDays', 'Keep decided documents for (days)', 'number'], ['remindBeforeExpiryDays', 'Remind residents before expiry (days)', 'number'], ['requireChecklist', 'Require the verification checklist to approve', 'bool']]],
  ['notifications', 'Notifications', [['emailResidents', 'Email residents about decisions', 'bool'], ['smsWalkins', 'Text residents for walk-in approvals', 'bool'], ['sosEscalationMin', 'Escalate unanswered SOS after (minutes)', 'number']]],
  ['security', 'Security', [['sessionHours', 'Sign-in session length (hours)', 'number'], ['lockAfterFailedLogins', 'Lock account after failed sign-ins', 'number'], ['require2faAdmins', 'Require two-step verification for admins', 'bool']]],
  ['privacy', 'Data privacy', [['logRetentionDays', 'Keep gate logs for (days)', 'number'], ['maskPlatesForGuards', 'Hide full plate numbers from guards', 'bool'], ['residentDataExport', 'Let residents download their data', 'bool']]],
];
export const Settings = () => {
  const { data, error, reload } = useResource('/hub/settings');
  const save = useSave();
  const [open, setOpen] = useState('passRules'); const [draft, setDraft] = useState({});
  if (!data) return <Page title="Settings"><LoadError error={error} /></Page>;
  const val = (sec, k) => (draft[sec]?.[k] ?? data[sec][k]);
  const set = (sec, k, v) => setDraft({ ...draft, [sec]: { ...(draft[sec] || {}), [k]: v } });
  const invalid = (sec) => SECTIONS.find((s) => s[0] === sec)[2].some(([k, , t]) => t === 'number' && !(Number(val(sec, k)) > 0));
  return (
    <Page title="Settings" subtitle="Rules that apply to every portal. Changes are recorded in the audit log." width="max-w-[1000px]">
      <LoadError error={error} />
      {SECTIONS.map(([sec, label, fields]) => (
        <section key={sec} className="rounded-card border border-border bg-card">
          <button aria-expanded={open === sec} aria-controls={`sec-${sec}`} onClick={() => setOpen(open === sec ? null : sec)} className="w-full flex items-center justify-between gap-3 px-6 min-h-[64px] text-left">
            <h2 className="text-[19px] font-semibold text-foreground">{label}</h2><span className="text-[14px] font-semibold text-primary">{open === sec ? 'Close' : 'Edit'}</span>
          </button>
          {open === sec && (
            <div id={`sec-${sec}`} className="px-6 pb-6 space-y-4">
              {fields.map(([k, l, t]) => (t === 'bool'
                ? <div key={k} className="flex items-center justify-between gap-4 min-h-[44px]"><span className="text-[15px] text-foreground">{l}</span><Toggle label={l} checked={!!val(sec, k)} onChange={(v) => set(sec, k, v)} /></div>
                : <Field key={k} label={l}>{(fid) => <input id={fid} type="number" min="1" value={val(sec, k)} onChange={(e) => set(sec, k, e.target.value)} className={`${inputCls} max-w-[200px]`} />}</Field>))}
              {invalid(sec) && <p className="text-[14px] font-semibold text-danger">Numbers must be greater than 0.</p>}
              <div className="flex gap-2"><Btn onClick={() => setDraft({ ...draft, [sec]: undefined })}>Discard</Btn>
                <Btn variant="primary" disabled={!draft[sec] || invalid(sec)} onClick={async () => {
                  const clean = Object.fromEntries(Object.entries(draft[sec]).map(([k, v]) => [k, typeof data[sec][k] === 'number' ? Number(v) : v]));
                  if (await save(() => api.put('/hub/settings', { [sec]: { ...data[sec], ...clean } }), `${label} saved`)) { setDraft({ ...draft, [sec]: undefined }); reload(); }
                }}>Save changes</Btn></div>
            </div>
          )}
        </section>
      ))}
      <Panel title="Managed lists"><DL items={[['ID types', data.lists.idTypes.join(', ')], ['Visit purposes', data.lists.purposes.join(', ')]]} /></Panel>
    </Page>
  );
};

/* ── Notifications (admin) ──────────────────────────────────────────────── */
export const Notifications = ({ col = 'adminNotifications', title = 'Notifications' }) => {
  const { data, error, reload } = useResource(`/hub/${col}`);
  const nav = useNavigate();
  const unread = data?.filter((n) => !n.read).length;
  const markAll = async () => { await Promise.all(data.filter((n) => !n.read).map((n) => api.patch(`/hub/${col}/${n.id}`, { read: true }))); reload(); };
  return (
    <Page title={title} subtitle={unread ? `${unread} unread` : 'You are all caught up.'} width="max-w-[900px]" actions={unread > 0 && <Btn onClick={markAll}><CheckCircle2 className="w-4 h-4" aria-hidden="true" /> Mark all as read</Btn>}>
      <LoadError error={error} />
      <ul className="space-y-3">
        {(data || []).map((n) => (
          <li key={n.id}>
            <button onClick={async () => { if (!n.read) await api.patch(`/hub/${col}/${n.id}`, { read: true }); nav(n.to); }}
              className={`w-full text-left flex items-start gap-4 rounded-[20px] border p-5 hover:bg-muted ${n.read ? 'bg-card border-border' : 'bg-muted border-ring/40'}`}>
              <Bell className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="flex-1"><span className="block text-[16px] font-semibold text-foreground">{n.title}{!n.read && <span className="sr-only"> (unread)</span>}</span><span className="block text-[14px] text-muted-foreground">{n.body}</span></span>
              <span className="text-[13px] text-muted-foreground whitespace-nowrap">{fmtDate(n.at, true)}</span>
            </button>
          </li>
        ))}
      </ul>
    </Page>
  );
};
