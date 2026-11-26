import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, ShieldCheck, Download, Mail, Phone } from 'lucide-react';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Page, Btn, Panel, Stats, Tabs, SearchBox, Notice, Pill, Table, Modal, Field, inputCls, areaCls, Toggle, DL, useResource, useFiltered, count, fmtDate, daysUntil } from '@/components/kit';
import { Notifications } from '@/pages/admin/AdminPages';

/* Resident screens — Figma H03–H13. */

const useSave = () => {
  const { toast } = useToast();
  return async (fn, ok) => {
    try { const r = await fn(); toast({ variant: 'success', title: ok || 'Saved', description: r?.data?.message }); return true; }
    catch (e) { toast({ variant: 'destructive', title: 'Could not save', description: e.response?.data?.message || 'Please try again.' }); return false; }
  };
};
const ME = 'Juan Dela Cruz';
const Section = ({ tabs, base, active, children, title, subtitle, actions }) => {
  const nav = useNavigate();
  return (
    <Page title={title} subtitle={subtitle} actions={actions} width="max-w-[1180px]">
      <Tabs value={active} onChange={(k) => nav(`${base}/${k}`)} label="Sections" items={tabs} />
      {children}
    </Page>
  );
};

/* ── H03 Household members ──────────────────────────────────────────────── */
const LOGIN = { active: ['success', 'Active'], invited: ['warning', 'Invited'], none: ['neutral', 'No login'], suspended: ['neutral', 'Suspended'] };
const PERMS = [['passes', 'Visitor passes'], ['walkins', 'Walk-in approvals'], ['history', 'Visit history']];
export const Household = () => {
  const { data, error, reload } = useResource('/hub/household');
  const save = useSave();
  const [q, setQ] = useState(''); const [status, setStatus] = useState('all'); const [editing, setEditing] = useState(null); const [removing, setRemoving] = useState(null);
  const rows = useFiltered(data, { tab: status, tabKey: 'login', q, fields: ['name', 'relation'] });
  const expired = data?.find((m) => m.login === 'invited' && Date.now() - new Date(m.invitedAt) > 2 * 86400e3);
  const blank = { name: '', relation: 'Spouse', contact: '', perms: { passes: true, walkins: false, history: true }, login: 'invited' };
  const submit = async () => {
    const body = { ...editing, name: editing.name.trim() };
    const ok = editing.id
      ? await save(() => api.patch(`/hub/household/${editing.id}`, body), 'Member updated')
      : await save(() => api.post('/hub/household', { ...body, invitedAt: new Date().toISOString() }), 'Invitation sent');
    if (ok) { setEditing(null); reload(); }
  };
  return (
    <Page title="Household members" subtitle="Manage who lives here and what they can do in the app." width="max-w-[1180px]"
      actions={<Btn variant="primary" onClick={() => setEditing(blank)}><Plus className="w-4 h-4" aria-hidden="true" /> Add member</Btn>}>
      {error && <Notice tone="danger">{error}</Notice>}
      {expired && <Notice tone="warning" action={<Btn onClick={async () => { if (await save(() => api.patch(`/hub/household/${expired.id}`, { invitedAt: new Date().toISOString() }), 'Invitation resent')) reload(); }}>Resend invite</Btn>}>{expired.name.split(' ')[0]}’s invitation has expired. Resend it so they can activate their account.</Notice>}
      <Stats items={[{ label: 'Members', value: data?.length ?? '—', sub: 'Block 5, Lot 12' }, { label: 'Active logins', value: count(data, 'login', 'active') ?? '—', sub: 'Delegated access' }, { label: 'Invitations', value: count(data, 'login', 'invited') ?? '—', sub: 'Waiting to accept' }]} />
      <div className="flex flex-wrap gap-3">
        <SearchBox value={q} onChange={setQ} placeholder="Search household members" className="flex-1 min-w-[240px]" />
        <Tabs value={status} onChange={setStatus} label="Status" items={[{ k: 'all', label: 'All' }, { k: 'active', label: 'Active' }, { k: 'invited', label: 'Invited' }, { k: 'suspended', label: 'Suspended' }]} />
      </div>
      <ul className="space-y-4">
        {(rows || []).map((m) => {
          const [tone, label] = LOGIN[m.login];
          const perms = PERMS.filter(([k]) => m.perms[k]).map(([, l]) => l);
          return (
            <li key={m.id} className="rounded-card-home border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-[18px] font-semibold text-foreground">{m.name}</p><p className="text-[14px] text-muted-foreground">{m.relation} · {m.contact || 'No contact'} · Avila St., Block 5, Lot 12</p></div>
                <Pill tone={tone}>{label}</Pill>
              </div>
              <p className="mt-3 text-[15px] text-foreground">{perms.length ? perms.map((p) => `✓ ${p}`).join('  ·  ') : m.login === 'suspended' ? 'Permissions paused · no active access' : 'No app permissions · household record only'}</p>
              {(m.login === 'active' || m.login === 'suspended') && (
                <div className="mt-3 flex items-center justify-between gap-4 min-h-[44px]"><span className="text-[15px] text-foreground">Login access</span>
                  <Toggle label={`Login access for ${m.name}`} checked={m.login === 'active'} onChange={async (v) => { if (await save(() => api.patch(`/hub/household/${m.id}`, { login: v ? 'active' : 'suspended' }), v ? 'Access restored' : 'Access suspended')) reload(); }} /></div>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                <Btn variant="ghost" onClick={() => setEditing(JSON.parse(JSON.stringify(m)))}>Edit</Btn>
                {m.login === 'invited' && <Btn variant="ghost" onClick={async () => { if (await save(() => api.patch(`/hub/household/${m.id}`, { invitedAt: new Date().toISOString() }), 'Invitation resent')) reload(); }}>Resend invite</Btn>}
                <Btn variant="ghost" className="text-danger" onClick={() => setRemoving(m)}>Remove</Btn>
              </div>
            </li>
          );
        })}
        {rows && rows.length === 0 && <li className="rounded-card-home border border-border bg-card p-8 text-center text-muted-foreground">No members match.</li>}
      </ul>
      <Notice tone="warning">You choose their permissions. Login access is optional. Removing a member ends their access and cancels passes they created.</Notice>
      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : 'Add household member'} onClose={() => setEditing(null)} footer={<><Btn onClick={() => setEditing(null)}>Cancel</Btn><Btn variant="primary" disabled={!editing.name.trim()} onClick={submit}>{editing.id ? 'Save' : 'Send invitation'}</Btn></>}>
          <Field label="Full name" required>{(fid) => <input id={fid} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} />}</Field>
          <Field label="Relationship">{(fid) => <select id={fid} value={editing.relation} onChange={(e) => setEditing({ ...editing, relation: e.target.value })} className={inputCls}>{['Spouse', 'Child', 'Parent', 'Sibling', 'Helper', 'Other'].map((r) => <option key={r}>{r}</option>)}</select>}</Field>
          <Field label="Mobile number">{(fid) => <input id={fid} inputMode="tel" value={editing.contact} onChange={(e) => setEditing({ ...editing, contact: e.target.value })} className={inputCls} placeholder="09XX XXX XXXX" />}</Field>
          <fieldset><legend className="text-[14px] font-semibold text-foreground mb-1">What can they do?</legend>
            {PERMS.map(([k, l]) => <div key={k} className="flex items-center justify-between min-h-[44px]"><span className="text-[15px] text-foreground">{l}</span><Toggle label={l} checked={editing.perms[k]} onChange={(v) => setEditing({ ...editing, perms: { ...editing.perms, [k]: v } })} /></div>)}
          </fieldset>
        </Modal>
      )}
      {removing && (
        <Modal title={`Remove ${removing.name}?`} subtitle="This ends their access and cancels passes they created." onClose={() => setRemoving(null)}
          footer={<><Btn onClick={() => setRemoving(null)}>Keep</Btn><Btn variant="danger" onClick={async () => { if (await save(() => api.delete(`/hub/household/${removing.id}`), 'Member removed')) { setRemoving(null); reload(); } }}>Remove member</Btn></>} />
      )}
    </Page>
  );
};

/* ── H04–H07 My home (properties, vehicles, documents, item passes) ─────── */
const HOME_TABS = [{ k: 'properties', label: 'Properties' }, { k: 'vehicles', label: 'Vehicles' }, { k: 'documents', label: 'Documents' }, { k: 'items', label: 'Item gate passes' }];
const STK = { issued: 'success', pending: 'warning', expired: 'danger', revoked: 'neutral' };
const DOCT = { pending: ['warning', 'In review'], approved: ['success', 'Approved'], rejected: ['danger', 'Rejected'], reupload: ['info', 'Re-upload requested'] };
const IGPT = { pending: 'warning', approved: 'success', rejected: 'danger', completed: 'neutral' };

const Properties = () => {
  const { user } = useAuth();
  const p = user?.primary_property;
  const { data: tenants } = useResource('/hub/tenants');
  const lease = tenants?.find((t) => t.owner === ME);
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Panel title={p ? `${p.street || 'Avila St.'}, Block ${p.block}, Lot ${p.lot}` : 'Your property'}>
        <DL items={[['Phase', p?.phase || '1'], ['Role', 'Homeowner'], ['Occupancy', lease ? 'Leased' : 'Owner-occupied'], ['Gate', 'Main Gate']]} />
      </Panel>
      {lease && <Panel title="Lease"><DL items={[['Tenant', lease.tenant], ['Start', fmtDate(lease.start)], ['End', fmtDate(lease.end)], ['Status', <Pill key="s" tone={lease.status === 'ending' ? 'warning' : 'success'}>{lease.status === 'ending' ? `Ending in ${daysUntil(lease.end)} days` : 'Active'}</Pill>]]} /></Panel>}
    </div>
  );
};

const MyVehicles = () => {
  const { data, error, reload } = useResource('/hub/mine/vehicles');
  const save = useSave();
  const [adding, setAdding] = useState(false); const [f, setF] = useState({ plate: '', make: '', orcrExpiry: '' });
  const ok = /^[A-Z0-9 ]{4,10}$/.test(f.plate.trim()) && f.make.trim() && f.orcrExpiry && daysUntil(f.orcrExpiry) > 0;
  return (
    <>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex justify-end"><Btn variant="primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" aria-hidden="true" /> Add vehicle</Btn></div>
      <Table label="My vehicles" rows={data} cols={[{ k: 'plate', label: 'Plate', mono: true }, { k: 'make', label: 'Make / model' }, { k: 'orcrExpiry', label: 'OR/CR expiry', render: (r) => fmtDate(r.orcrExpiry) },
        { k: 'stickerStatus', label: 'Gate sticker', render: (r) => <Pill tone={STK[r.stickerStatus]}>{r.stickerStatus === 'pending' ? 'Waiting for HOA' : r.stickerStatus[0].toUpperCase() + r.stickerStatus.slice(1)}</Pill> }]} />
      {adding && (
        <Modal title="Add vehicle" subtitle="The HOA issues a gate sticker after checking your OR/CR." onClose={() => setAdding(false)} footer={<><Btn onClick={() => setAdding(false)}>Cancel</Btn>
          <Btn variant="primary" disabled={!ok} onClick={async () => { if (await save(() => api.post('/hub/vehicles', { plate: f.plate.trim(), make: f.make.trim(), orcrExpiry: f.orcrExpiry, owner: ME, property: 'Avila St. · B5 L12', sticker: null, stickerStatus: 'pending' }), 'Vehicle added — sticker request sent')) { setAdding(false); setF({ plate: '', make: '', orcrExpiry: '' }); reload(); } }}>Add vehicle</Btn></>}>
          <Field label="Plate number" required hint="Letters and numbers, 4–10 characters.">{(fid) => <input id={fid} value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value.toUpperCase() })} className={`${inputCls} font-mono`} placeholder="NAG 1234" />}</Field>
          <Field label="Make and model" required>{(fid) => <input id={fid} value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} className={inputCls} placeholder="Toyota Vios" />}</Field>
          <Field label="OR/CR valid until" required hint="Must be a future date.">{(fid) => <input id={fid} type="date" value={f.orcrExpiry} onChange={(e) => setF({ ...f, orcrExpiry: e.target.value })} className={inputCls} />}</Field>
        </Modal>
      )}
    </>
  );
};

const MyDocuments = () => {
  const { data, error, reload } = useResource('/hub/mine/documents');
  const save = useSave();
  const [up, setUp] = useState(null); const [file, setFile] = useState(null);
  return (
    <>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex justify-end"><Btn variant="primary" onClick={() => { setUp({ type: 'OR/CR', related: 'NAG 1026' }); setFile(null); }}><Plus className="w-4 h-4" aria-hidden="true" /> Upload document</Btn></div>
      <Table label="My documents" rows={data} cols={[{ k: 'code', label: 'Reference', mono: true }, { k: 'type', label: 'Type' }, { k: 'related', label: 'For', mono: true }, { k: 'submittedAt', label: 'Uploaded', render: (r) => fmtDate(r.submittedAt) },
        { k: 'status', label: 'Status', render: (r) => <Pill tone={DOCT[r.status][0]}>{DOCT[r.status][1]}</Pill> }, { k: 'remarks', label: 'HOA remarks', render: (r) => r.remarks || '—' },
        { k: 'act', label: 'Action', render: (r) => (['rejected', 'reupload'].includes(r.status) ? <button onClick={() => { setUp({ type: r.type, related: r.related, replace: r.id }); setFile(null); }} className="h-11 px-3 rounded-full font-semibold text-primary hover:bg-muted">Upload new copy</button> : '—') }]} />
      {up && (
        <Modal title={up.replace ? 'Upload a new copy' : 'Upload document'} subtitle="JPG, PNG or PDF up to 5 MB. Sent to the HOA for review." onClose={() => setUp(null)} footer={<><Btn onClick={() => setUp(null)}>Cancel</Btn>
          <Btn variant="primary" disabled={!file || file.size > 5 * 1024 * 1024} onClick={async () => {
            const ok = up.replace
              ? await save(() => api.patch(`/hub/documents/${up.replace}`, { status: 'pending', remarks: null, submittedAt: new Date().toISOString(), version: 2 }), 'New copy sent for review')
              : await save(() => api.post('/hub/documents', { code: `DOC-2026-${Math.floor(Math.random() * 900 + 100)}`, resident: ME, property: 'Avila St. · B5 L12', type: up.type, related: up.related, status: 'pending', submittedAt: new Date().toISOString(), version: 1, validity: null, history: [] }), 'Document sent for review');
            if (ok) { setUp(null); reload(); }
          }}>Send for review</Btn></>}>
          {!up.replace && <Field label="Document type">{(fid) => <select id={fid} value={up.type} onChange={(e) => setUp({ ...up, type: e.target.value })} className={inputCls}>{['OR/CR', "Driver's license", 'Lease contract'].map((t) => <option key={t}>{t}</option>)}</select>}</Field>}
          <Field label="File" required hint={file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB${file.size > 5 * 1024 * 1024 ? ' — too large' : ''}` : 'Choose a clear photo or scan.'}>
            {(fid) => <input id={fid} type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-[15px] text-foreground file:mr-3 file:h-11 file:px-5 file:rounded-full file:border file:border-solid file:border-line-strong file:bg-card file:text-foreground file:font-semibold file:cursor-pointer hover:file:bg-muted" />}
          </Field>
        </Modal>
      )}
    </>
  );
};

const MyItemPasses = () => {
  const { data, error, reload } = useResource('/hub/mine/itemPasses');
  const save = useSave();
  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const [req, setReq] = useState(null);
  const ok = req && req.items.trim().length >= 3 && req.date >= today;
  return (
    <>
      {error && <Notice tone="danger">{error}</Notice>}
      <div className="flex justify-end"><Btn variant="primary" onClick={() => setReq({ direction: 'out', items: '', carrier: '', date: today })}><Plus className="w-4 h-4" aria-hidden="true" /> Request item pass</Btn></div>
      <Table label="My item gate passes" rows={data} cols={[{ k: 'code', label: 'Pass ID', mono: true }, { k: 'direction', label: 'Direction', render: (r) => (r.direction === 'in' ? 'Move in' : 'Move out') }, { k: 'items', label: 'Items' },
        { k: 'date', label: 'Scheduled', render: (r) => fmtDate(r.date) }, { k: 'status', label: 'Status', render: (r) => <Pill tone={IGPT[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</Pill> }, { k: 'remarks', label: 'HOA remarks', render: (r) => r.remarks || '—' }]} />
      {req && (
        <Modal title="Request item gate pass" subtitle="The guard checks approved passes when items pass the gate." onClose={() => setReq(null)} footer={<><Btn onClick={() => setReq(null)}>Cancel</Btn>
          <Btn variant="primary" disabled={!ok} onClick={async () => { if (await save(() => api.post('/hub/itemPasses', { ...req, code: `IGP-2026-${Math.floor(Math.random() * 900 + 100)}`, resident: ME, property: 'Avila St. · B5 L12', status: 'pending', requestedAt: new Date().toISOString() }), 'Request sent to the HOA')) { setReq(null); reload(); } }}>Send request</Btn></>}>
          <fieldset><legend className="text-[14px] font-semibold text-foreground mb-1">Direction</legend>
            {[['out', 'Moving items out'], ['in', 'Moving items in']].map(([k, l]) => <label key={k} className="flex items-center gap-3 min-h-[44px] text-[15px] text-foreground"><input type="radio" name="dir" className="w-5 h-5" checked={req.direction === k} onChange={() => setReq({ ...req, direction: k })} /> {l}</label>)}
          </fieldset>
          <Field label="Items" required>{(fid) => <textarea id={fid} rows={2} value={req.items} onChange={(e) => setReq({ ...req, items: e.target.value })} className={areaCls} placeholder="e.g. Refrigerator, 2 boxes" />}</Field>
          <Field label="Mover or vehicle">{(fid) => <input id={fid} value={req.carrier} onChange={(e) => setReq({ ...req, carrier: e.target.value })} className={inputCls} placeholder="e.g. ABC Movers · NAG 9912" />}</Field>
          <Field label="Date" required>{(fid) => <input id={fid} type="date" min={today} value={req.date} onChange={(e) => setReq({ ...req, date: e.target.value })} className={inputCls} />}</Field>
        </Modal>
      )}
    </>
  );
};

export const MyHome = () => {
  const { tab = 'properties' } = useParams();
  const active = HOME_TABS.some((t) => t.k === tab) ? tab : 'properties';
  return (
    <Section title="My home" subtitle="Your property, vehicles, documents and item gate passes." tabs={HOME_TABS} base="/resident/home" active={active}>
      {active === 'properties' && <Properties />}
      {active === 'vehicles' && <MyVehicles />}
      {active === 'documents' && <MyDocuments />}
      {active === 'items' && <MyItemPasses />}
    </Section>
  );
};

/* ── H08/H09/H11 Activity (visit history, walk-in approvals, notifications) ─ */
const ACT_TABS = [{ k: 'visits', label: 'Visit history' }, { k: 'walkins', label: 'Walk-in approvals' }, { k: 'notifications', label: 'Notifications' }];
const WALK = { pending: ['warning', 'Waiting for you'], approved: ['success', 'Approved'], denied: ['danger', 'Denied'], expired: ['neutral', 'No response'], admitted: ['success', 'Approved · entered'] };
export const Activity = () => {
  const { tab = 'visits' } = useParams();
  const active = ACT_TABS.some((t) => t.k === tab) ? tab : 'visits';
  const visits = useResource('/hub/visits');
  const walkins = useResource('/hub/walkinHistory');
  const [q, setQ] = useState('');
  const vrows = useFiltered(visits.data, { q, fields: ['guest', 'purpose'] });
  if (active === 'notifications') {
    return (
      <div className="max-w-[1180px] mx-auto space-y-6">
        <ActivityTabsBar active={active} />
        <Notifications col="residentNotifications" title="Notifications" />
      </div>
    );
  }
  return (
    <Section title="Activity" subtitle="Everyone who visited your home, and the walk-ins you were asked to approve." tabs={ACT_TABS} base="/resident/activity" active={active}>
      {active === 'visits' && (
        <>
          {visits.error && <Notice tone="danger">{visits.error}</Notice>}
          <SearchBox value={q} onChange={setQ} placeholder="Search visitor or purpose" className="max-w-xl" />
          <Table label="Visit history" rows={vrows} cols={[{ k: 'guest', label: 'Visitor' }, { k: 'purpose', label: 'Purpose' }, { k: 'via', label: 'Entry by' },
            { k: 'entered', label: 'Entered', render: (r) => fmtDate(r.entered, true) }, { k: 'exited', label: 'Left', render: (r) => (r.exited ? fmtDate(r.exited, true) : '—') },
            { k: 'status', label: 'Status', render: (r) => <Pill tone={r.status === 'inside' ? 'info' : 'neutral'}>{r.status === 'inside' ? 'Inside now' : 'Left'}</Pill> }]} />
        </>
      )}
      {active === 'walkins' && (
        <>
          {walkins.error && <Notice tone="danger">{walkins.error}</Notice>}
          <Notice tone="info">Pending requests appear on your Home screen with Approve and Deny buttons.</Notice>
          <Table label="Walk-in approvals" rows={walkins.data} cols={[{ k: 'guest', label: 'Visitor' }, { k: 'purpose', label: 'Purpose' }, { k: 'requestedAt', label: 'Requested', render: (r) => fmtDate(r.requestedAt, true) },
            { k: 'status', label: 'Result', render: (r) => <Pill tone={WALK[r.status][0]}>{WALK[r.status][1]}</Pill> }]} />
        </>
      )}
    </Section>
  );
};
const ActivityTabsBar = ({ active }) => {
  const nav = useNavigate();
  return <Tabs value={active} onChange={(k) => nav(`/resident/activity/${k}`)} label="Sections" items={ACT_TABS} />;
};

/* ── H12/H10/H13 Account (profile & security, privacy, help) ────────────── */
const ACC_TABS = [{ k: 'profile', label: 'Profile and security' }, { k: 'privacy', label: 'Privacy and my data' }, { k: 'help', label: 'Help and support' }];
export const Account = () => {
  const { tab = 'profile' } = useParams();
  const active = ACC_TABS.some((t) => t.k === tab) ? tab : 'profile';
  const { data, error, reload } = useResource('/hub/profile');
  const save = useSave();
  const [draft, setDraft] = useState(null);
  const p = draft || data;
  const emailOk = p && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email);
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile: data, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-vistara-data.json'; a.click();
  };
  return (
    <Section title="Account" subtitle="Your details, privacy choices and help." tabs={ACC_TABS} base="/resident/account" active={active}>
      {error && <Notice tone="danger">{error}</Notice>}
      {active === 'profile' && p && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <Panel title="Profile">
            <div className="space-y-4">
              <Field label="Full name">{(fid) => <input id={fid} value={p.name} readOnly className={`${inputCls} bg-muted`} />}</Field>
              <Field label="Email" required hint={!emailOk ? 'Enter a valid email address.' : null}>{(fid) => <input id={fid} type="email" value={p.email} onChange={(e) => setDraft({ ...p, email: e.target.value })} className={inputCls} />}</Field>
              <Field label="Mobile number">{(fid) => <input id={fid} inputMode="tel" value={p.phone} onChange={(e) => setDraft({ ...p, phone: e.target.value })} className={inputCls} />}</Field>
              <div className="flex gap-2"><Btn onClick={() => setDraft(null)} disabled={!draft}>Discard</Btn><Btn variant="primary" disabled={!draft || !emailOk} onClick={async () => { if (await save(() => api.put('/hub/profile', draft), 'Profile saved')) { setDraft(null); reload(); } }}>Save changes</Btn></div>
            </div>
          </Panel>
          <Panel title="Security and alerts">
            {[['twoFactor', 'Two-step verification'], ['notifyWalkinsSms', 'Text me for walk-in approvals'], ['notifyArrivals', 'Tell me when visitors arrive'], ['notifyDocuments', 'Tell me about document decisions']].map(([k, l]) => (
              <div key={k} className="flex items-center justify-between gap-4 min-h-[52px] border-b border-border last:border-0"><span className="text-[15px] text-foreground">{l}</span>
                <Toggle label={l} checked={!!data[k]} onChange={async (v) => { if (await save(() => api.put('/hub/profile', { [k]: v }), 'Saved')) reload(); }} /></div>
            ))}
          </Panel>
        </div>
      )}
      {active === 'privacy' && data && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <Panel title="What we keep"><ul className="space-y-2 text-[15px] text-foreground list-disc pl-5"><li>Your name, contact details and property.</li><li>Visitor passes and gate entries for your home (kept 2 years).</li><li>Documents you upload (kept 1 year after a decision).</li></ul></Panel>
          <Panel title="Your choices">
            <div className="flex items-center justify-between gap-4 min-h-[52px]"><span className="text-[15px] text-foreground">Let household members see visit history</span><Toggle label="Share visit history with household" checked={!!data.shareWithHousehold} onChange={async (v) => { if (await save(() => api.put('/hub/profile', { shareWithHousehold: v }), 'Saved')) reload(); }} /></div>
            <Btn className="mt-4" onClick={exportData}><Download className="w-4 h-4" aria-hidden="true" /> Download my data</Btn>
          </Panel>
        </div>
      )}
      {active === 'help' && (
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <Panel title="Common questions">
            {[['How do I let a visitor in?', 'Create a visitor pass and share the QR code. The guard scans it at the gate.'], ['A visitor arrived without a pass.', 'The guard sends you an approval request. Approve or deny it from Home within 3 minutes.'], ['How do I get a gate sticker?', 'Add your vehicle under My home → Vehicles and upload your OR/CR.']].map(([q, a]) => (
              <details key={q} className="border-b border-border last:border-0 py-3"><summary className="cursor-pointer min-h-[44px] flex items-center text-[15px] font-semibold text-foreground">{q}</summary><p className="text-[15px] text-muted-foreground">{a}</p></details>
            ))}
          </Panel>
          <Panel title="Contact the HOA office">
            <p className="flex items-center gap-2 text-[15px] text-foreground min-h-[44px]"><Phone className="w-4 h-4" aria-hidden="true" /> (054) 811 0000 · Mon–Sat, 8 AM–5 PM</p>
            <p className="flex items-center gap-2 text-[15px] text-foreground min-h-[44px]"><Mail className="w-4 h-4" aria-hidden="true" /> hoa@camellanaga.demo</p>
            <p className="flex items-center gap-2 text-[15px] text-foreground min-h-[44px]"><ShieldCheck className="w-4 h-4" aria-hidden="true" /> Emergencies: call the Main Gate guard house</p>
          </Panel>
        </div>
      )}
    </Section>
  );
};
