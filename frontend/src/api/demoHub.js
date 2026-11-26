/**
 * Sample data for the registry, review and operations screens (demo mode).
 * Generic REST over named collections:
 *   GET /hub/:col · POST /hub/:col · PATCH /hub/:col/:id · DELETE /hub/:col/:id · PUT /hub/:col (object collections)
 * Every change is written to the audit log, so the Audit log screen reflects what the user just did.
 */

const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]; };
const me = () => { try { return JSON.parse(localStorage.getItem('guardtrack_user')) || {}; } catch { return {}; } };
let seq = 5000;

const people = [
  ['Juan Dela Cruz', 'Avila St. · B5 L12', 'NAG 1026'], ['Maria Santos', 'Segovia St. · B3 L7', 'ABC 2384'], ['Carlos Mendoza', 'Toledo St. · B8 L2', 'Lease'],
  ['Ana Garcia', 'Mahogany Ln. · B4 L6', 'MC 0926'], ['Pedro Reyes', 'Avila St. · B5 L13', 'NAG 5501'], ['Elena Ramos', 'Segovia St. · B2 L9', 'Lease'],
  ['Luis Torres', 'Narra Dr. · B3 L21', 'ABC 7120'], ['Sofia Cruz', 'Mahogany Ln. · B4 L7', 'NAG 3118'], ['Miguel Lim', 'Avila St. · B6 L4', 'Lease'],
  ['Paula Rivera', 'Acacia St. · B1 L2', 'ABC 2277'], ['Rosa Villanueva', 'Narra Dr. · B3 L22', 'NAG 8810'], ['Ben Aquino', 'Toledo St. · B8 L5', 'MC 4410'],
];
const docType = (rel) => (rel === 'Lease' ? 'Lease contract' : rel.startsWith('MC') || rel.startsWith('NAG 5') ? "Driver's license" : 'OR/CR');

export const hub = {
  documents: people.map(([resident, property, rel], i) => ({
    id: 48 - i, code: `DOC-2026-${String(48 - i).padStart(4, '0')}`, resident, property, type: docType(rel), related: rel === 'Lease' ? resident : rel,
    status: i < 9 ? 'pending' : i === 9 ? 'approved' : i === 10 ? 'rejected' : 'reupload',
    submittedAt: ago(i < 4 ? 5200 + i * 7 : 1500 + i * 30), reviewer: i === 0 ? 'Julia Baretto' : null, version: i === 0 ? 2 : 1,
    validity: day(30 + i * 9), remarks: i === 10 ? 'Image is blurred. Please upload a clearer copy.' : null,
    history: i === 0 ? ['Julia Baretto requested a clearer image for version 1.', 'Resident uploaded version 2.'] : [],
  })),
  itemPasses: [
    ['Juan Dela Cruz', 'Avila St. · B5 L12', 'out', 'Refrigerator, 2 boxes', 'ABC Movers · NAG 9912', 'pending', 0],
    ['Maria Santos', 'Segovia St. · B3 L7', 'in', 'Sofa set, dining table', 'Lalamove · NBC 4021', 'pending', 1],
    ['Carlos Mendoza', 'Toledo St. · B8 L2', 'out', 'Aircon unit (for repair)', 'CoolTech Services', 'pending', 0],
    ['Ana Garcia', 'Mahogany Ln. · B4 L6', 'in', 'Washing machine', 'SM Appliance delivery', 'approved', 0],
    ['Pedro Reyes', 'Avila St. · B5 L13', 'out', 'Construction debris (8 sacks)', 'Own pickup · NAG 5501', 'pending', 2],
    ['Luis Torres', 'Narra Dr. · B3 L21', 'in', 'Bed frame, mattress', 'Mandaue Foam', 'completed', -1],
    ['Sofia Cruz', 'Mahogany Ln. · B4 L7', 'out', 'Old cabinets', 'Junk shop pickup', 'rejected', -2],
  ].map(([resident, property, direction, items, carrier, status, d], i) => ({ id: 41 - i, code: `IGP-2026-${String(41 - i).padStart(4, '0')}`, resident, property, direction, items, carrier, status, date: day(d), requestedAt: ago(300 + i * 140), remarks: status === 'rejected' ? 'Bulk junk pickup is only allowed on Saturdays.' : null })),
  tenants: [
    ['Daniel Mendoza', 'Juan Dela Cruz', 'Avila St. · B5 L12', -310, 55, '0917 222 1001'], ['Elena Ramos', 'Rita Ramos', 'Segovia St. · B2 L9', -200, 22, '0918 222 1002'],
    ['Miguel Lim', 'Henry Lim', 'Avila St. · B6 L4', -90, 275, '0919 222 1003'], ['Carlos Mendoza', 'Arturo Mendoza', 'Toledo St. · B8 L2', -400, 8, '0920 222 1004'],
    ['Grace Tan', 'Lorna Tan', 'Narra Dr. · B3 L18', -365, -5, '0921 222 1005'], ['Kevin Uy', 'Paolo Reyes', 'Toledo St. · B8 L4', -30, 335, '0922 222 1006'],
  ].map(([tenant, owner, property, s, e, contact], i) => ({ id: i + 1, tenant, owner, property, start: day(s), end: day(e), contact, status: e < 0 ? 'ended' : e <= 30 ? 'ending' : 'active' })),
  vehicles: [
    ['NAG 1026', 'Toyota Vios', 'Juan Dela Cruz', 'Avila St. · B5 L12', 22, 'S-0412', 'issued'], ['ABC 2384', 'Honda City', 'Maria Santos', 'Segovia St. · B3 L7', 140, 'S-0413', 'issued'],
    ['MC 0926', 'Honda Click 125', 'Ana Garcia', 'Mahogany Ln. · B4 L6', 60, null, 'pending'], ['NAG 5501', 'Mitsubishi L300', 'Pedro Reyes', 'Avila St. · B5 L13', -12, 'S-0398', 'expired'],
    ['ABC 7120', 'Toyota Innova', 'Luis Torres', 'Narra Dr. · B3 L21', 210, 'S-0420', 'issued'], ['NAG 3118', 'Suzuki Ertiga', 'Sofia Cruz', 'Mahogany Ln. · B4 L7', 95, 'S-0421', 'issued'],
    ['ABC 2277', 'Nissan Almera', 'Paula Rivera', 'Acacia St. · B1 L2', 18, null, 'pending'], ['NAG 8810', 'Ford Ranger', 'Rosa Villanueva', 'Narra Dr. · B3 L22', 300, 'S-0377', 'revoked'],
  ].map(([plate, make, owner, property, exp, sticker, stickerStatus], i) => ({ id: i + 1, plate, make, owner, property, orcrExpiry: day(exp), sticker, stickerStatus })),
  watchlist: [
    { id: 1, name: 'Unknown male, red cap', plate: 'NBC 9081', level: 'alert', reason: 'Seen photographing houses on Toledo St.', addedBy: 'Julia Baretto', addedAt: ago(4000), status: 'active' },
    { id: 2, name: 'Ramon Ortega', plate: '—', level: 'deny', reason: 'Banned after theft report INC-2026-0119 (HOA resolution 12-2026).', addedBy: 'Julia Baretto', addedAt: ago(20000), status: 'active' },
    { id: 3, name: 'QuickFix Plumbing van', plate: 'ABC 6610', level: 'alert', reason: 'Unpaid gate fees — escort to property only.', addedBy: 'admin_test', addedAt: ago(9000), status: 'active' },
    { id: 4, name: 'Ed Santos', plate: '—', level: 'alert', reason: 'Former tenant; lease ended. Needs owner approval.', addedBy: 'admin_test', addedAt: ago(60000), status: 'removed' },
  ],
  audit: [
    ['Julia Baretto', 'admin', 'Approved document', 'DOC-2026-0037', 'OR/CR · NAG 3118'], ['guard_alpha', 'guard', 'Logged entry', 'Ana Villanueva', 'QR pass'],
    ['Julia Baretto', 'admin', 'Rejected document', 'DOC-2026-0038', 'Image is blurred'], ['guard_beta', 'guard', 'Reported incident', 'INC-2026-0141', 'Visitor refused to show ID'],
    ['admin_test', 'admin', 'Updated settings', 'Pass rules', 'Walk-in window 3 → 3 min'], ['juan_dela_cruz', 'resident', 'Created visitor pass', 'Liza Ramos', 'Valid today'],
    ['Julia Baretto', 'admin', 'Added to watchlist', 'NBC 9081', 'Level: alert'], ['guard_alpha', 'guard', 'Logged exit', 'LBC Express', '—'],
    ['admin_test', 'admin', 'Downloaded document', 'DOC-2026-0048', 'Recorded for review'], ['guard_alpha', 'guard', 'Started shift', 'Main Gate', 'Day shift'],
  ].map(([actor, role, action, target, detail], i) => ({ id: i + 1, at: ago(15 + i * 47), actor, role, action, target, detail })),
  settings: {
    passRules: { maxActivePasses: 10, passValidityHours: 24, walkinWindowMin: 3, requireIdForWalkins: true, allowOvernight: false },
    lists: { idTypes: ["Driver's license", 'National ID', 'Passport', 'Company ID'], purposes: ['Visit', 'Delivery', 'Repair', 'Event'] },
    documents: { retentionDays: 365, requireChecklist: true, remindBeforeExpiryDays: 30 },
    notifications: { emailResidents: true, smsWalkins: true, sosEscalationMin: 2 },
    security: { sessionHours: 8, require2faAdmins: true, lockAfterFailedLogins: 5 },
    privacy: { logRetentionDays: 730, maskPlatesForGuards: false, residentDataExport: true },
  },
  adminNotifications: [
    { id: 1, at: ago(3), title: 'Walk-in approval requested', body: 'Juan Reyes is at the Main Gate for Avila St., Block 5, Lot 12.', read: false, to: '/guard/logs' },
    { id: 2, at: ago(40), title: '4 documents waiting more than 3 days', body: 'Oldest: Juan Dela Cruz · OR/CR', read: false, to: '/admin/documents' },
    { id: 3, at: ago(152), title: 'Critical incident reported', body: 'INC-2026-0142 · Barrier damage at main gate', read: false, to: '/admin/incidents' },
    { id: 4, at: ago(600), title: 'Lease ending soon', body: 'Carlos Mendoza · Toledo St. B8 L2 · 8 days left', read: true, to: '/admin/tenants' },
  ],
  household: [
    { id: 1, name: 'Jose Dela Cruz', relation: 'Spouse', contact: '0917 *** 2048', perms: { passes: true, walkins: true, history: true }, login: 'active' },
    { id: 2, name: 'Ana Dela Cruz', relation: 'Child', contact: '0918 *** 3165', perms: { passes: true, walkins: false, history: true }, login: 'invited', invitedAt: ago(2900) },
    { id: 3, name: 'Lucia Dela Cruz', relation: 'Parent', contact: '0919 *** 6281', perms: { passes: false, walkins: false, history: false }, login: 'none' },
    { id: 4, name: 'Carlo Dela Cruz', relation: 'Sibling', contact: '0920 *** 7854', perms: { passes: false, walkins: false, history: false }, login: 'suspended' },
  ],
  residentNotifications: [
    { id: 1, at: ago(3), title: 'Walk-in approval requested', body: 'Juan Reyes is at the Main Gate for Block 5, Lot 12.', read: false, to: '/resident/dashboard' },
    { id: 2, at: ago(16), title: 'Your visitor has arrived', body: 'Ana Villanueva entered at the Main Gate.', read: false, to: '/resident/activity' },
    { id: 3, at: ago(50), title: 'Your OR needs a clearer copy', body: 'The HOA rejected your OR for NBC 1234: image is blurred.', read: false, to: '/resident/home/documents' },
    { id: 4, at: ago(1500), title: 'Item gate pass approved', body: 'IGP-2026-0038 · Washing machine · tomorrow', read: true, to: '/resident/home/items' },
  ],
  profile: { name: 'Juan Dela Cruz', email: 'juan@vistara.demo', phone: '0917 555 0101', notifyWalkinsSms: true, notifyArrivals: true, notifyDocuments: true, twoFactor: false, shareWithHousehold: true },
  patrol: {
    round: 3, of: 4, startedAt: ago(31), nextAt: new Date(Date.now() + 89 * 60000).toISOString(),
    checkpoints: [['Main Gate', 'done', 29], ['Clubhouse', 'done', 22], ['Acacia St.', 'done', 16], ['Narra Dr.', 'done', 10], ['Park & playground', 'issue', 6, 'Light out'],
      ['Mahogany Ln.', 'current'], ['Service Gate', 'todo'], ['Perimeter wall · east', 'todo']].map(([name, status, m, note], i) => ({ id: i + 1, name, status, at: m != null ? ago(m) : null, note: note || null })),
  },
  handoff: {
    from: 'guard_beta', shift: 'Night shift · 7 PM–7 AM', acknowledged: false,
    items: [
      { id: 1, text: '2 visitors still inside (Ana Villanueva, Carlo Mendoza) — confirm exits', done: false },
      { id: 2, text: 'Barrier arm stuck half open — INC-2026-0142, technician due 9 AM', done: false },
      { id: 3, text: 'Clubhouse event 6 PM tomorrow — 34 guests pre-registered', done: false },
      { id: 4, text: 'Radio #2 battery low, charging in the cabinet', done: true },
    ],
    notes: 'Quiet night. One walk-in denied at 11:40 PM (no host response).',
  },
};

// Read-only views for the resident's own records (Juan Dela Cruz).
const mine = (col) => hub[col].filter((r) => (r.resident || r.owner) === 'Juan Dela Cruz');

const audit = (action, target, detail) => {
  const u = me();
  hub.audit.unshift({ id: ++seq, at: new Date().toISOString(), actor: u.full_name || u.username || 'system', role: u.role || '—', action, target, detail: detail || '—' });
};

const LABEL = { documents: 'document', itemPasses: 'item gate pass', tenants: 'lease', vehicles: 'vehicle', watchlist: 'watchlist entry', household: 'household member', settings: 'settings', profile: 'profile', patrol: 'patrol round', handoff: 'shift handoff' };

export const hubRoutes = [
  ['get', /^\/hub\/mine\/(documents|itemPasses|vehicles)$/, ([col]) => [200, { success: true, data: col === 'vehicles' ? hub.vehicles.filter((v) => v.owner === 'Juan Dela Cruz') : mine(col) }]],
  ['get', /^\/hub\/(\w+)$/, ([col]) => (col in hub ? [200, { success: true, data: hub[col] }] : [404, { success: false, message: 'Not found.' }])],
  ['put', /^\/hub\/(\w+)$/, ([col], b) => {
    if (!(col in hub) || Array.isArray(hub[col])) return [404, { success: false, message: 'Not found.' }];
    hub[col] = { ...hub[col], ...b }; audit(`Updated ${LABEL[col] || col}`, col, Object.keys(b).join(', '));
    return [200, { success: true, message: 'Saved.', data: hub[col] }];
  }],
  ['post', /^\/hub\/(\w+)$/, ([col], b) => {
    if (!Array.isArray(hub[col])) return [404, { success: false, message: 'Not found.' }];
    const row = { id: ++seq, ...b }; hub[col].unshift(row); audit(`Added ${LABEL[col] || col}`, b.name || b.plate || b.code || b.tenant || `#${row.id}`, b.reason || b.relation || null);
    return [201, { success: true, message: 'Added.', data: row }];
  }],
  ['patch', /^\/hub\/(\w+)\/(\d+)$/, ([col, id], b) => {
    const row = Array.isArray(hub[col]) && hub[col].find((r) => r.id === +id);
    if (!row) return [404, { success: false, message: 'Not found.' }];
    Object.assign(row, b);
    if (b.status || b.login || b.stickerStatus) audit(`Set ${LABEL[col] || col} to ${b.status || b.login || b.stickerStatus}`, row.code || row.name || row.plate || row.tenant || `#${row.id}`, b.remarks || null);
    return [200, { success: true, message: 'Saved.', data: row }];
  }],
  ['delete', /^\/hub\/(\w+)\/(\d+)$/, ([col, id]) => {
    if (!Array.isArray(hub[col])) return [404, { success: false, message: 'Not found.' }];
    const i = hub[col].findIndex((r) => r.id === +id); if (i < 0) return [404, { success: false, message: 'Not found.' }];
    const [row] = hub[col].splice(i, 1); audit(`Removed ${LABEL[col] || col}`, row.name || row.plate || row.code || `#${row.id}`);
    return [200, { success: true, message: 'Removed.' }];
  }],
];
