/**
 * Demo mode: a browser-only fake API so the app works on static hosting
 * (GitHub Pages) with no backend. It is enabled at build time with VITE_DEMO=true.
 *
 * It mirrors the response shapes of the real Express API in backend/controllers/.
 * Data lives in memory: changes reset when the page is reloaded.
 */

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
  { id: 1, username: 'admin_demo',    email: 'admin@vistara.demo',    role: 'admin',    is_active: true, createdAt: minutesAgo(90000) },
  { id: 2, username: 'guard_alpha',   email: 'guard1@vistara.demo',   role: 'guard',    is_active: true, createdAt: minutesAgo(80000) },
  { id: 3, username: 'guard_beta',    email: 'guard2@vistara.demo',   role: 'guard',    is_active: true, createdAt: minutesAgo(70000) },
  { id: 4, username: 'juan_delacruz', email: 'juan@vistara.demo',     role: 'resident', is_active: true, createdAt: minutesAgo(60000) },
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
    if (!u) return [401, { success: false, message: 'Demo: use admin_demo, guard_alpha or juan_delacruz (any password).' }];
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

  const response = { data, status, statusText: String(status), headers: {}, config, request: {} };
  if (status >= 400) {
    const err = new Error(data.message);
    err.response = response; err.config = config; err.isAxiosError = true;
    throw err;
  }
  return response;
};

export const DEMO_ACCOUNTS = [
  { role: 'Admin', username: 'admin_demo', note: 'HOA office' },
  { role: 'Resident', username: 'juan_delacruz', note: 'Homeowner, B5 L12' },
  { role: 'Guard', username: 'guard_alpha', note: 'Tablet console' },
];
