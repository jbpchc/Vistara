/**
 * Demo mode: a browser-only fake API so the app works on static hosting
 * (GitHub Pages) with no backend. It is enabled at build time with VITE_DEMO=true.
 *
 * It mirrors the response shapes of the real Express API in backend/controllers/.
 * Data lives in memory: changes reset when the page is reloaded.
 */

import { hubRoutes } from '@/api/demoHub';

const uuid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }));

const ymd = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };

/* ─── Seed data ─────────────────────────────────────────────────────────────── */
const users = [
  { id: 1, username: 'admin_test',    email: 'admin@vistara.demo',    role: 'admin',    is_active: true, createdAt: minutesAgo(90000) },
  { id: 2, username: 'guard_alpha',   email: 'guard1@vistara.demo',   role: 'guard',    is_active: true, createdAt: minutesAgo(80000) },
  { id: 3, username: 'guard_beta',    email: 'guard2@vistara.demo',   role: 'guard',    is_active: true, createdAt: minutesAgo(70000) },
  { id: 4, username: 'juan_dela_cruz', email: 'juan@vistara.demo',     role: 'resident', is_active: true, createdAt: minutesAgo(60000) },
  { id: 5, username: 'maria_santos',  email: 'maria@vistara.demo',    role: 'resident', is_active: true, createdAt: minutesAgo(50000) },
  { id: 6, username: 'paolo_reyes',   email: 'paolo@vistara.demo',    role: 'resident', is_active: true, createdAt: minutesAgo(40000) },
];

const residents = [
  { id: 1, full_name: 'Juan Dela Cruz', contact_number: '0917 555 0101', UserId: 4 },
  { id: 2, full_name: 'Maria Santos',   contact_number: '0918 555 0202', UserId: 5 },
  { id: 3, full_name: 'Paolo Reyes',    contact_number: '0919 555 0303', UserId: 6 },
];

const properties = [
  { id: 1, block: '5', lot: '12', street: 'Avila St.',     phase: '1', ResidentId: 1 },
  { id: 2, block: '3', lot: '7',  street: 'Segovia St.',   phase: '1', ResidentId: 2 },
  { id: 3, block: '8', lot: '2',  street: 'Toledo St.',    phase: '2', ResidentId: 3 },
  { id: 4, block: '8', lot: '4',  street: 'Toledo St.',    phase: '2', ResidentId: null },
];

const mkPass = (o) => ({
  id: o.id, pass_id: uuid(), qr_token: uuid(), guest_name: o.guest, expected_date: o.date || ymd(new Date()),
  purpose: o.purpose || 'Visit', status: o.status, PropertyId: o.prop,
  scanned_at: o.in != null ? minutesAgo(o.in) : null, scanned_by: o.in != null ? 2 : null,
  exited_at: o.out != null ? minutesAgo(o.out) : null, plate_number: o.plate || null, notes: null, guard_notes: null,
  createdAt: minutesAgo((o.in ?? 30) + 60),
});

let passes = [
  mkPass({ id: 1, guest: 'Ana Villanueva',   prop: 1, status: 'checked_in', in: 12,  purpose: 'Family visit', plate: 'NBC 4821' }),
  mkPass({ id: 2, guest: 'LBC Express',      prop: 2, status: 'used',       in: 55, out: 40, purpose: 'Delivery' }),
  mkPass({ id: 3, guest: 'Carlo Mendoza',    prop: 3, status: 'checked_in', in: 70,  purpose: 'Plumbing repair' }),
  mkPass({ id: 4, guest: 'Rosa Bautista',    prop: 1, status: 'used',       in: 180, out: 120, purpose: 'Visit' }),
  mkPass({ id: 5, guest: 'Grab Food',        prop: 2, status: 'used',       in: 240, out: 236, purpose: 'Food delivery' }),
  mkPass({ id: 6, guest: 'Liza Ramos',       prop: 1, status: 'active',     date: daysFromNow(0), purpose: 'Birthday party' }),
  mkPass({ id: 7, guest: 'Mark Tan',         prop: 1, status: 'active',     date: daysFromNow(2), purpose: 'Visit' }),
  mkPass({ id: 8, guest: 'Joy Fernandez',    prop: 1, status: 'expired',    date: daysFromNow(-3), purpose: 'Visit' }),
  mkPass({ id: 9, guest: 'Ben Aquino',       prop: 1, status: 'used',       in: 3000, out: 2900, date: daysFromNow(-2), purpose: 'Visit' }),
];
let nextId = 100;

// A walk-in waiting for the demo resident's approval (Figma H01 alert).
let walkins = [
  { id: 1, status: 'pending', guest: 'Juan Reyes', purpose: 'Lalamove delivery', address: 'Avila St., Block 5, Lot 12', vehicle: 'Motorcycle 123 ABC',
    requestedAt: new Date().toISOString(), windowSec: 180, PropertyId: 1, resident: { name: 'Juan Dela Cruz', contact: '0917 555 0101' } },
];
const pendingFor = (propId) => walkins.find((w) => w.status === 'pending' && (propId == null || w.PropertyId === propId));
const tickWalkins = () => walkins.forEach((w) => {
  const age = (Date.now() - new Date(w.requestedAt)) / 1000;
  // Demo only: guard-created requests are approved by a simulated resident after 8 s.
  if (w.status === 'pending' && w.simulated && age > 8) Object.assign(w, { status: 'approved', decidedAt: new Date().toISOString() });
  if (w.status === 'pending' && age > w.windowSec) w.status = 'expired';
});
let incidents = [
  { id: 142, code: 'INC-2026-0142', type: 'facility', severity: 'critical', title: 'Barrier damage at main gate', description: 'Barrier arm hit by a delivery truck; stuck half open.', location: 'Main Gate', status: 'open', createdAt: minutesAgo(152), reportedBy: 'guard_alpha' },
  { id: 141, code: 'INC-2026-0141', type: 'visitor', severity: 'high', title: 'Visitor refused to show ID', description: null, location: 'Main Gate', status: 'open', createdAt: minutesAgo(400), reportedBy: 'guard_beta' },
  { id: 140, code: 'INC-2026-0140', type: 'security', severity: 'normal', title: 'Streetlight out near Block 8', description: null, location: 'Toledo St.', status: 'resolved', createdAt: minutesAgo(3000), reportedBy: 'guard_alpha', resolvedBy: 'admin_test', resolution: 'Electrician replaced the bulb.' },
];

let activity = passes
  .filter((p) => p.scanned_at)
  .flatMap((p) => [
    { id: nextId++, GatePassId: p.id, action: 'entry', scanned_at: p.scanned_at, scanned_by: 2 },
    ...(p.exited_at ? [{ id: nextId++, GatePassId: p.id, action: 'exit', scanned_at: p.exited_at, scanned_by: 3 }] : []),
  ]);

/* ─── Helpers that mimic Sequelize includes ─────────────────────────────────── */
const userById = (id) => users.find((u) => u.id === id);
const residentOf = (prop) => residents.find((r) => r.id === prop?.ResidentId);
const withProperty = (p) => {
  const prop = properties.find((x) => x.id === p.PropertyId);
  const r = residentOf(prop);
  return {
    ...p,
    Property: prop && { block: prop.block, lot: prop.lot, street: prop.street, Resident: r && { full_name: r.full_name, contact_number: r.contact_number } },
    ScannedBy: p.scanned_by ? { username: userById(p.scanned_by)?.username } : null,
  };
};
const isToday = (iso) => iso && ymd(new Date(iso)) === ymd(new Date());

const loginPayload = (u) => {
  const r = residents.find((x) => x.UserId === u.id);
  const prop = r && properties.find((p) => p.ResidentId === r.id);
  return {
    success: true, message: 'Login successful.', token: `demo.${u.id}.${Date.now()}`,
    user: {
      id: u.id, username: u.username, email: u.email, role: u.role,
      full_name: r?.full_name || (u.role === 'admin' ? 'Julia Baretto' : u.role === 'guard' ? 'Ramon Guevarra' : null),
      primary_property: prop ? { id: prop.id, block: prop.block, lot: prop.lot, street: prop.street, phase: prop.phase } : null,
    },
  };
};

const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('guardtrack_user')); } catch { return null; }
};

/* ─── Routes ────────────────────────────────────────────────────────────────── */
const routes = [
  ['post', /^\/auth\/login$/, (_, body) => {
    const u = users.find((x) => x.username === String(body.username || '').trim());
    if (!u) return [401, { success: false, message: 'Demo: use admin_test, guard_alpha or juan_dela_cruz (any password).' }];
    return [200, loginPayload(u)];
  }],

  // Admin
  ['get', /^\/admin\/stats$/, () => [200, { success: true, data: {
    total_residents: residents.length,
    active_guards: users.filter((u) => u.role === 'guard' && u.is_active).length,
    entries_today: passes.filter((p) => isToday(p.scanned_at)).length,
    total_properties: properties.length,
  } }]],
  ['get', /^\/admin\/chart-data$/, () => {
    const base = [14, 19, 11, 23, 17, 26];
    const data = base.map((v, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      return { date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), visitors: v };
    });
    data.push({ date: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), visitors: passes.filter((p) => isToday(p.scanned_at)).length });
    return [200, { success: true, data }];
  }],
  ['get', /^\/admin\/users$/, () => [200, { success: true, data: users.map(({ id, username, email, role, is_active, createdAt }) => ({ id, username, email, role, is_active, createdAt })) }]],
  ['post', /^\/admin\/users$/, (_, b) => { const u = { id: nextId++, is_active: true, createdAt: new Date().toISOString(), ...b }; delete u.password; users.unshift(u); return [201, { success: true, message: 'User created', data: { id: u.id } }]; }],
  ['put', /^\/admin\/users\/(\d+)$/, ([id], b) => { const u = userById(+id); if (u) Object.assign(u, b); return [200, { success: true, message: 'User updated' }]; }],
  ['delete', /^\/admin\/users\/(\d+)$/, ([id]) => { const i = users.findIndex((u) => u.id === +id); if (i > -1) users.splice(i, 1); return [200, { success: true, message: 'User deleted' }]; }],

  ['get', /^\/admin\/residents$/, () => [200, { success: true, data: residents.map((r) => {
    const u = userById(r.UserId);
    return { ...r, User: u && { id: u.id, username: u.username, email: u.email, is_active: u.is_active }, Properties: properties.filter((p) => p.ResidentId === r.id).map(({ id, block, lot, street }) => ({ id, block, lot, street })) };
  }) }]],
  ['post', /^\/admin\/residents$/, (_, b) => {
    const u = { id: nextId++, username: b.username || `resident${nextId}`, email: b.email || '', role: 'resident', is_active: true, createdAt: new Date().toISOString() };
    users.push(u);
    const r = { id: nextId++, full_name: b.full_name || 'New resident', contact_number: b.contact_number || '', UserId: u.id };
    residents.push(r);
    return [201, { success: true, message: 'Resident created successfully', data: r }];
  }],
  ['put', /^\/admin\/residents\/(\d+)$/, ([id], b) => { const r = residents.find((x) => x.id === +id); if (r) Object.assign(r, { full_name: b.full_name ?? r.full_name, contact_number: b.contact_number ?? r.contact_number }); return [200, { success: true, message: 'Resident updated' }]; }],
  ['delete', /^\/admin\/residents\/(\d+)$/, ([id]) => { const i = residents.findIndex((r) => r.id === +id); if (i > -1) residents.splice(i, 1); return [200, { success: true, message: 'Resident deleted successfully' }]; }],

  ['get', /^\/admin\/properties$/, () => [200, { success: true, data: properties.map((p) => {
    const r = residentOf(p); const u = r && userById(r.UserId);
    return { ...p, Resident: r ? { ...r, User: u && { username: u.username, email: u.email } } : null };
  }) }]],
  ['post', /^\/admin\/properties$/, (_, b) => { const p = { id: nextId++, ResidentId: b.ResidentId || b.resident_id || null, ...b }; properties.push(p); return [201, { success: true, message: 'Property created', data: p }]; }],
  ['put', /^\/admin\/properties\/(\d+)$/, ([id], b) => { const p = properties.find((x) => x.id === +id); if (p) Object.assign(p, b); return [200, { success: true, message: 'Property updated' }]; }],
  ['delete', /^\/admin\/properties\/(\d+)$/, ([id]) => { const i = properties.findIndex((p) => p.id === +id); if (i > -1) properties.splice(i, 1); return [200, { success: true, message: 'Property deleted' }]; }],

  // Guard
  ['get', /^\/guard\/stats$/, () => [200, { success: true, data: {
    entries_today: passes.filter((p) => isToday(p.scanned_at)).length,
    currently_inside: passes.filter((p) => p.status === 'checked_in').length,
    active_guards: users.filter((u) => u.role === 'guard' && u.is_active).length,
  } }]],
  ['get', /^\/logs\/feed$/, (_, __, q) => {
    const rows = [...activity].sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at)).slice(0, +(q.get('limit') || 20));
    return [200, { success: true, data: rows.map((row) => {
      const p = passes.find((x) => x.id === row.GatePassId);
      return { id: row.id, guest_name: p?.guest_name, status: row.action === 'entry' ? 'checked_in' : 'used', scanned_at: row.scanned_at, ScannedBy: { username: userById(row.scanned_by)?.username } };
    }) }];
  }],
  ['get', /^\/logs$/, (_, __, q) => {
    const limit = +(q.get('limit') || 20), page = +(q.get('page') || 1);
    const status = q.get('status'), date = q.get('date'), search = (q.get('search') || '').toLowerCase();
    let rows = passes.filter((p) => p.scanned_at);
    if (status && status !== 'all') rows = rows.filter((p) => (status === 'checked_in' ? p.status === 'checked_in' : status === 'used' ? p.status === 'used' : true));
    if (date) rows = rows.filter((p) => ymd(new Date(p.scanned_at)) === date);
    if (search) rows = rows.filter((p) => p.guest_name.toLowerCase().includes(search));
    rows.sort((a, b) => (q.get('sort') === 'asc' ? 1 : -1) * (new Date(a.scanned_at) - new Date(b.scanned_at)));
    return [200, { success: true, total: rows.length, page, totalPages: Math.max(1, Math.ceil(rows.length / limit)), data: rows.slice((page - 1) * limit, page * limit).map(withProperty) }];
  }],
  ['get', /^\/properties\/search$/, (_, __, q) => {
    const term = (q.get('q') || '').toLowerCase();
    const data = properties.filter((p) => {
      const r = residentOf(p);
      return `${p.block} ${p.lot} blk ${p.block} lot ${p.lot} ${p.street} ${r?.full_name || ''}`.toLowerCase().includes(term);
    }).slice(0, 10).map((p) => {
      const r = residentOf(p); const u = r && userById(r.UserId);
      return { property_id: p.id, block: p.block, lot: p.lot, street: p.street, phase: p.phase, resident_id: r?.id, resident_name: r?.full_name, contact_number: r?.contact_number, username: u?.username };
    });
    return [200, { success: true, count: data.length, data }];
  }],
  ['post', /^\/logs\/manual$/, (_, b) => {
    const p = mkPass({ id: nextId++, guest: b.visitor_name, prop: b.property_id, status: 'checked_in', in: 0, purpose: b.purpose, plate: b.vehicle_plate });
    p.scanned_by = currentUser()?.id || 2;
    passes.unshift(p);
    activity.push({ id: nextId++, GatePassId: p.id, action: 'entry', scanned_at: p.scanned_at, scanned_by: p.scanned_by });
    return [201, { success: true, message: 'Walk-in visitor logged.', data: p }];
  }],
  ['post', /^\/qr\/validate$/, (_, b) => {
    const token = String(b.qr_token || '').trim().toLowerCase();
    const p = passes.find((x) => x.qr_token === token || x.pass_id === token || x.pass_id.startsWith(token) || token.includes(x.qr_token));
    if (!p) return [200, { success: false, valid: false, reason: 'not_found', message: 'Pass not found or invalid.' }];
    if (p.status === 'used' || p.status === 'checked_in') return [200, { success: false, valid: false, reason: 'already_used', message: 'This pass has already been used.', data: { guest_name: p.guest_name, scanned_at: p.scanned_at } }];
    if (p.status === 'expired') return [200, { success: false, valid: false, reason: 'expired', message: 'This pass is expired.' }];
    if (p.expected_date !== ymd(new Date())) return [200, { success: false, valid: false, reason: 'wrong_date', message: `This pass is valid on ${p.expected_date}, not today.` }];
    const prop = properties.find((x) => x.id === p.PropertyId); const r = residentOf(prop);
    const info = { pass_id: p.pass_id, guest_name: p.guest_name, expected_date: p.expected_date, block: prop?.block, lot: prop?.lot, resident_name: r?.full_name, purpose: p.purpose };
    if (b.check_only) return [200, { success: true, valid: true, check_only: true, data: info }];
    Object.assign(p, { status: 'checked_in', scanned_at: new Date().toISOString(), scanned_by: currentUser()?.id || 2, plate_number: b.plate_number || null, guard_notes: b.notes || null });
    activity.push({ id: nextId++, GatePassId: p.id, action: 'entry', scanned_at: p.scanned_at, scanned_by: p.scanned_by });
    return [200, { success: true, valid: true, message: 'Access Granted.', data: { ...info, scanned_at: p.scanned_at, plate_number: p.plate_number, guard_notes: p.guard_notes } }];
  }],
  ['post', /^\/qr\/exit$/, (_, b) => {
    const p = passes.find((x) => x.pass_id === String(b.pass_id || '').trim());
    if (!p) return [404, { success: false, message: 'Pass not found.' }];
    Object.assign(p, { status: 'used', exited_at: new Date().toISOString() });
    activity.push({ id: nextId++, GatePassId: p.id, action: 'exit', scanned_at: p.exited_at, scanned_by: currentUser()?.id || 2 });
    return [200, { success: true, message: 'Exit logged.' }];
  }],

  // Resident
  ['get', /^\/passes\/my$/, () => {
    const me = currentUser(); const r = residents.find((x) => x.UserId === me?.id);
    const mine = properties.filter((p) => p.ResidentId === r?.id).map((p) => p.id);
    return [200, { success: true, data: passes.filter((p) => mine.includes(p.PropertyId)).map(withProperty).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) }];
  }],
  ['post', /^\/qr\/generate$/, (_, b) => {
    const p = mkPass({ id: nextId++, guest: b.guest_name, prop: b.property_id, status: 'active', date: b.expected_date, purpose: b.purpose });
    p.createdAt = new Date().toISOString();
    passes.unshift(p);
    return [201, { success: true, message: 'Gate pass generated.', data: withProperty(p) }];
  }],
  ['put', /^\/passes\/([\w-]+)$/, ([id], b) => { const p = passes.find((x) => x.pass_id === id); if (p) Object.assign(p, { guest_name: b.guest_name, expected_date: b.expected_date, purpose: b.purpose }); return [200, { success: true, message: 'Pass updated', data: p }]; }],
  ['delete', /^\/passes\/([\w-]+)$/, ([id]) => { const p = passes.find((x) => x.pass_id === id); if (p) p.status = 'expired'; return [200, { success: true, message: 'Pass cancelled' }]; }],


  // ── Composite dashboard feeds (Figma A01 / H01 / G02). Demo-only for now. ──
  ['get', /^\/dashboard\/admin$/, () => {
    const inside = passes.filter((p) => p.status === 'checked_in').length;
    const hourly = [3, 2, 4, 9, 14, 17, 21, 19, 15, 6, 0, 0, 0, 0, 0, 0, 0];
    const avg =    [4, 3, 5, 8, 12, 15, 17, 18, 16, 12, 9, 10, 12, 11, 8, 6, 4];
    return [200, { success: true, data: {
      gate: { open: true, inside: 24, updated: new Date().toISOString() },
      attention: [
        ...incidents.filter((i) => i.status === 'open' && i.severity === 'critical').map((i) => ({ id: `inc-${i.id}`, kind: 'incident', severity: 'critical', title: i.title, meta: `${i.code} · ${i.location} · reported by ${i.reportedBy}`, action: 'Open incident' })),
        { id: 'ovr', kind: 'overstay', severity: 'overdue', title: '2 visitors overstaying', meta: 'Camella St. B5 L12 · expected exit 9:30 AM', action: 'Notify hosts' },
        { id: 'doc', kind: 'documents', severity: 'overdue', title: '4 documents waiting more than 3 days', meta: 'Oldest: Juan Dela Cruz · OR/CR · submitted 3 days ago', action: 'Review' },
        { id: 'lea', kind: 'leases', severity: 'upcoming', title: '6 leases expiring within 30 days', meta: 'Next: Maria Santos · Acacia St. B2 L8 · 22 days left', action: 'Send reminders' },
        { id: 'veh', kind: 'vehicles', severity: 'upcoming', title: '8 OR/CR records expiring', meta: 'Next: NAG 1026 · Toyota Vios', action: 'View vehicles' },
      ],
      today: {
        entries: 128, delta: 10.3, peak: '10–11 AM', hours: ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM'],
        hourly: hourly.map((v, i) => ({ today: v, avg: avg[i], past: i < 10 })),
        inside: 24, walkins: 12, activePasses: 86, denied: 3,
      },
      queues: [
        { name: 'Documents', done: 8, total: 20, meta: '12 pending · 4 overdue', icon: 'file' },
        { name: 'Item gate passes', done: 5, total: 12, meta: '7 pending · 3 scheduled today', icon: 'package' },
        { name: 'Incidents', done: 3, total: 8, meta: '5 open · 1 critical', icon: 'alert', danger: true },
      ],
      upcoming: [
        { day: daysFromNow(2), title: 'Basketball league finals', meta: 'Event pass · 34 guests · Clubhouse', tag: 'Event' },
        { day: daysFromNow(6), title: 'Lease renewal due', meta: 'Maria Santos · Acacia St. B2 L8', tag: 'Lease', warn: true },
        { day: daysFromNow(22), title: 'OR/CR expiry', meta: 'NAG 1026 · Juan Dela Cruz', tag: 'Vehicle', warn: true },
        { day: daysFromNow(25), title: 'Undas visitor rules start', meta: 'Extended gate hours · pass rules', tag: 'Policy' },
      ],
      mix: [
        { label: 'Single pass', count: 82, pct: 64 },
        { label: 'Event pass', count: 34, pct: 27 },
        { label: 'Walk-in', count: 12, pct: 9, warn: true },
      ],
      deniedNote: '3 denied scans not counted: 1 expired, 1 cancelled, 1 revoked',
      recent: [
        { time: minutesAgo(4),  dir: 'Exit',  visitor: 'Delivery contractor', plate: '—',        dest: 'Camella B5 L12',  guard: 'M. Arevalo', result: 'allowed' },
        { time: minutesAgo(7),  dir: 'Entry', visitor: 'Cruz family',         plate: 'NAG 3312', dest: 'Acacia B2 L8',    guard: 'R. Lopez',   result: 'allowed' },
        { time: minutesAgo(91), dir: 'Entry', visitor: 'Carla Reyes',         plate: 'NAG 2391', dest: 'Camella B5 L12',  guard: 'M. Arevalo', result: 'allowed' },
        { time: minutesAgo(171),dir: 'Entry', visitor: "Ana's guests",        plate: '—',        dest: 'Acacia B2 L8',    guard: 'M. Arevalo', result: 'denied', reason: 'expired pass' },
        { time: minutesAgo(178),dir: 'Entry', visitor: 'Sofia Rivera',        plate: '—',        dest: 'Acacia B2 L8',    guard: 'R. Lopez',   result: 'denied', reason: 'cancelled pass' },
        { time: minutesAgo(216),dir: 'Entry', visitor: 'Paula Valdez',        plate: '—',        dest: 'Mahogany B4 L6',  guard: 'R. Lopez',   result: 'walkin', reason: 'host confirmed' },
      ],
      totals: { all: 235, denied: 3, walkins: 12 },
    } }];
  }],

  ['get', /^\/dashboard\/resident$/, () => [200, { success: true, data: {
    walkin: (tickWalkins(), pendingFor(1) || null),
    setup: { done: 3, total: 5, steps: [
      { label: 'Confirm profile', state: 'done' }, { label: 'Add household members', state: 'current' },
      { label: 'Add tenants if leased', state: 'done' }, { label: 'Register vehicles', state: 'done' },
      { label: 'Upload documents', state: 'todo' },
    ] },
    stats: {
      activePasses: passes.filter((p) => p.PropertyId === 1 && p.status === 'active' && p.expected_date === ymd(new Date())).length || 1,
      inside: passes.filter((p) => p.PropertyId === 1 && p.status === 'checked_in').length,
      upcoming: passes.filter((p) => p.PropertyId === 1 && p.status === 'active').length,
    },
    inside: passes.filter((p) => p.PropertyId === 1 && p.status === 'checked_in').map((p) => ({
      name: p.guest_name, where: 'Block 5, Lot 12 · Avila St.', entered: p.scanned_at, expectedExit: new Date(new Date(p.scanned_at).getTime() + 3 * 3600e3).toISOString(), status: 'On time',
    })),
    documents: [
      { title: 'OR · NBC 1234', sub: 'Toyota Vios · Block 5, Lot 12', note: '“Image is blurred. Please upload a clearer copy.”', status: 'Rejected', tone: 'danger', action: 'Re-upload OR' },
      { title: 'OR/CR · ABC 1234', sub: 'Honda City · Block 5, Lot 12', note: 'Valid for 25 more days', status: 'Expiring soon', tone: 'warn', action: 'Upload renewed OR/CR' },
    ],
    upcoming: passes.filter((p) => p.PropertyId === 1 && p.status === 'active').map((p) => ({ date: p.expected_date, name: p.guest_name, kind: p.purpose, where: 'Block 5, Lot 12 · Avila St.' })),
    lease: { tenant: 'Daniel Mendoza', where: 'Avila St., Block 5, Lot 12 · Leased', ends: daysFromNow(55), daysLeft: 55 },
    notifications: [
      { icon: 'gate', time: minutesAgo(3), title: 'Walk-in approval requested', body: 'Juan Reyes is at the Main Gate for Block 5, Lot 12.', action: 'Review request' },
      { icon: 'entry', time: minutesAgo(16), title: 'Your visitor has arrived', body: 'Ana Villanueva entered at the Main Gate.', action: 'View visit' },
      { icon: 'doc', time: minutesAgo(50), title: 'Your OR needs a clearer copy', body: 'The HOA rejected your OR for NBC 1234: image is blurred.', action: 'Re-upload document' },
    ],
  } }]],
  // Walk-in approvals
  ['post', /^\/walkins$/, (_, b) => {
    const prop = properties.find((x) => x.id === +b.property_id); const r = residentOf(prop);
    const w = { id: nextId++, status: 'pending', guest: b.visitor_name, purpose: b.purpose, vehicle: b.vehicle_plate, requestedAt: new Date().toISOString(), windowSec: 180,
      PropertyId: prop?.id, simulated: true, address: prop ? `${prop.street}, Block ${prop.block}, Lot ${prop.lot}` : '', resident: r ? { name: r.full_name, contact: r.contact_number } : null };
    walkins.unshift(w);
    return [201, { success: true, message: 'Resident notified. Waiting for approval.', data: w }];
  }],
  ['get', /^\/walkins\/mine$/, () => { tickWalkins(); return [200, { success: true, data: walkins.filter((w) => w.status === 'pending' && w.PropertyId === 1) }]; }],
  ['get', /^\/walkins\/(\d+)$/, ([id]) => { tickWalkins(); const w = walkins.find((x) => x.id === +id); return w ? [200, { success: true, data: w }] : [404, { success: false, message: 'Request not found.' }]; }],
  ['post', /^\/walkins\/(\d+)\/decision$/, ([id], b) => {
    tickWalkins(); const w = walkins.find((x) => x.id === +id);
    if (!w || w.status !== 'pending') return [409, { success: false, message: `This request is already ${w?.status || 'gone'}.` }];
    Object.assign(w, { status: b.decision === 'approve' ? 'approved' : 'denied', decidedAt: new Date().toISOString(), decisionNote: b.note || null });
    if (b.decision === 'approve' && !w.simulated) {
      // Nobody is at the demo gate tablet, so admit straight away to keep the data consistent.
      const p = mkPass({ id: nextId++, guest: w.guest, prop: w.PropertyId, status: 'checked_in', in: 0, purpose: w.purpose });
      passes.unshift(p); activity.push({ id: nextId++, GatePassId: p.id, action: 'entry', scanned_at: p.scanned_at, scanned_by: 2 });
      w.status = 'admitted';
    }
    return [200, { success: true, message: b.decision === 'approve' ? 'Visitor approved — the guard has been notified.' : 'Visitor denied — the guard has been notified.', data: w }];
  }],
  ['post', /^\/walkins\/(\d+)\/admit$/, ([id], b) => {
    tickWalkins(); const w = walkins.find((x) => x.id === +id);
    if (!w) return [404, { success: false, message: 'Request not found.' }];
    if (w.status !== 'approved' && !(w.status === 'expired' && b.override_reason)) return [409, { success: false, message: 'Wait for the resident, or give a reason to admit after the time runs out.' }];
    const p = mkPass({ id: nextId++, guest: w.guest, prop: w.PropertyId, status: 'checked_in', in: 0, purpose: w.purpose, plate: w.vehicle });
    p.scanned_by = currentUser()?.id || 2; passes.unshift(p);
    activity.push({ id: nextId++, GatePassId: p.id, action: 'entry', scanned_at: p.scanned_at, scanned_by: p.scanned_by });
    w.status = 'admitted';
    return [200, { success: true, message: 'Entry logged.', data: w }];
  }],

  // Incidents & SOS
  ['get', /^\/incidents$/, (_, __, q) => {
    const st = q.get('status'); const rank = { critical: 0, high: 1, normal: 2 };
    const rows = incidents.filter((i) => !st || i.status === st).sort((a, b) => (a.status === b.status ? rank[a.severity] - rank[b.severity] : a.status === 'open' ? -1 : 1));
    return [200, { success: true, data: rows }];
  }],
  ['post', /^\/incidents\/sos$/, () => {
    const id = nextId++; const i = { id, code: `INC-2026-${String(id).padStart(4, '0')}`, type: 'sos', severity: 'critical', title: 'SOS from Main Gate', description: 'Emergency alert raised from the guard tablet.', location: 'Main Gate', status: 'open', createdAt: new Date().toISOString(), reportedBy: currentUser()?.username };
    incidents.unshift(i); return [201, { success: true, message: 'SOS sent. The HOA office has been alerted.', data: i }];
  }],
  ['post', /^\/incidents$/, (_, b) => {
    if (!b.title?.trim()) return [400, { success: false, message: 'A short title is required.' }];
    const id = nextId++; const i = { id, code: `INC-2026-${String(id).padStart(4, '0')}`, type: b.type || 'other', severity: b.severity || 'normal', title: b.title, description: b.description || null, location: b.location || 'Main Gate', status: 'open', createdAt: new Date().toISOString(), reportedBy: currentUser()?.username };
    incidents.unshift(i); return [201, { success: true, message: `Incident ${i.code} reported. The HOA office has been notified.`, data: i }];
  }],
  ['patch', /^\/incidents\/(\d+)\/resolve$/, ([id], b) => {
    const i = incidents.find((x) => x.id === +id);
    if (!i) return [404, { success: false, message: 'Incident not found.' }];
    if (!b.resolution?.trim()) return [400, { success: false, message: 'Add a short resolution note before closing.' }];
    Object.assign(i, { status: 'resolved', resolution: b.resolution, resolvedBy: currentUser()?.username, resolvedAt: new Date().toISOString() }); return [200, { success: true, message: `${i.code} resolved.`, data: i }];
  }],

  ['get', /^\/dashboard\/guard$/, () => {
    const today = activity.filter((a) => isToday(a.scanned_at));
    return [200, { success: true, data: {
      shift: 'Day shift · 7 AM–7 PM',
      approvalsWaiting: (tickWalkins(), walkins.filter((w) => w.status === 'pending').length),
      notice: { title: 'HOA notice · 1–5 PM', body: 'Acacia St. road works — send deliveries via Service Gate' },
      today: { entries: 43 + today.filter((a) => a.action === 'entry').length, exits: 41 + today.filter((a) => a.action === 'exit').length, inside: passes.filter((p) => p.status === 'checked_in').length },
      lastScans: [...activity].sort((a, b) => new Date(b.scanned_at) - new Date(a.scanned_at)).slice(0, 2).map((a) => ({ name: passes.find((p) => p.id === a.GatePassId)?.guest_name, time: a.scanned_at, dir: a.action })),
      expected: passes.filter((p) => p.status === 'active' && p.expected_date === ymd(new Date())).slice(0, 2).map((p, i) => {
        const prop = properties.find((x) => x.id === p.PropertyId);
        return { name: `${p.guest_name} · ${i ? 'Service' : 'Guest'}`, time: new Date(Date.now() + (20 + i * 25) * 60000).toISOString(), where: `${prop?.street} B${prop?.block} L${prop?.lot}`, vehicle: i === 1 };
      }),
    } }];
  }],

  // Views over the live pass list (admin Visitor passes, resident Visit history / Walk-in approvals)
  ['get', /^\/hub\/visitorPasses$/, () => [200, { success: true, data: passes.map((p) => {
    const prop = properties.find((x) => x.id === p.PropertyId); const r = residentOf(prop);
    return { id: p.id, code: p.pass_id.slice(0, 8).toUpperCase(), guest: p.guest_name, resident: r?.full_name || '—', property: prop ? `${prop.street} · B${prop.block} L${prop.lot}` : '—',
      date: p.expected_date, purpose: p.purpose, status: p.status === 'checked_in' ? 'inside' : p.status, createdAt: p.createdAt, scannedAt: p.scanned_at };
  }) }]],
  ['patch', /^\/hub\/visitorPasses\/(\d+)$/, ([id]) => {
    const p = passes.find((x) => x.id === +id);
    if (!p || p.status !== 'active') return [409, { success: false, message: 'Only active passes can be revoked.' }];
    p.status = 'expired'; return [200, { success: true, message: 'Pass revoked. The QR code no longer works.' }];
  }],
  ['get', /^\/hub\/visits$/, () => [200, { success: true, data: passes.filter((p) => p.PropertyId === 1 && p.scanned_at).map((p) => ({
    id: p.id, guest: p.guest_name, purpose: p.purpose, entered: p.scanned_at, exited: p.exited_at, status: p.status === 'checked_in' ? 'inside' : 'left', via: p.qr_token ? 'QR pass' : 'Walk-in',
  })).sort((a, b) => new Date(b.entered) - new Date(a.entered)) }]],
  ['get', /^\/hub\/walkinHistory$/, () => { tickWalkins(); return [200, { success: true, data: walkins.filter((w) => w.PropertyId === 1) }]; }],
  ...hubRoutes,

  ['get', /^\/health$/, () => [200, { success: true, status: 'OK', service: 'Vistara demo API' }]],
];

/** axios adapter: resolves requests against the in-memory routes above. */
export const demoAdapter = async (config) => {
  const [path, qs = ''] = String(config.url || '').replace(/^https?:\/\/[^/]+/, '').replace(/^\/api/, '').split('?');
  const query = new URLSearchParams(qs);
  Object.entries(config.params || {}).forEach(([k, v]) => query.set(k, v));
  let body = {};
  try { body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {}; } catch { /* non-JSON body */ }

  const method = (config.method || 'get').toLowerCase();
  const route = routes.find(([m, re]) => m === method && re.test(path));
  await new Promise((r) => setTimeout(r, 250)); // feel like a network call

  const [status, data] = route
    ? route[2](path.match(route[1]).slice(1), body, query)
    : [404, { success: false, message: `Demo mode: ${method.toUpperCase()} ${path} is not simulated.` }];

  // Copy like a real network response, so the UI never holds a reference to the in-memory store.
  const response = { data: structuredClone(data), status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 400) {
    const err = new Error(data.message);
    err.response = response; err.config = config; err.isAxiosError = true;
    throw err;
  }
  return response;
};

export const DEMO_ACCOUNTS = [
  { role: 'Admin', username: 'admin_test', note: 'HOA office' },
  { role: 'Resident', username: 'juan_dela_cruz', note: 'Homeowner, B5 L12' },
  { role: 'Guard', username: 'guard_alpha', note: 'Tablet console' },
];
