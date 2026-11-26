'use strict';

const { Op } = require('sequelize');
const { User, Resident, Property, GatePass, ActivityLog, WalkinRequest, Incident, ScanDenial } = require('../models');
const { shapeWalkin, refreshWalkin, myPropertyIds } = require('./walkin.controller');

/**
 * Composite feeds for the three dashboards (Figma A01, H01, G02).
 * One request per screen keeps the dashboards fast (Doherty threshold).
 * All "today" maths uses Asia/Manila (+08:00).
 */

const TZ = 8 * 3600e3;
const manilaDate = (d = new Date()) => new Date(d.getTime() + TZ).toISOString().split('T')[0];
const dayStart = (offsetDays = 0) => { const s = new Date(`${manilaDate()}T00:00:00+08:00`); s.setDate(s.getDate() + offsetDays); return s; };
const manilaHour = (d) => new Date(new Date(d).getTime() + TZ).getUTCHours();
const where = (p) => (p ? `B${p.block} L${p.lot}` : '—');
const street = (p) => (p ? `${p.street ? `${p.street} ` : ''}B${p.block} L${p.lot}` : '—');
const fail = (res, tag, e) => { console.error(`[DASHBOARD] ${tag}`, e); return res.status(500).json({ success: false, message: 'Internal server error.' }); };
const DENY_LABEL = { expired: 'expired pass', already_used: 'pass already used', wrong_date: 'wrong date', not_found: 'unknown pass', invalid: 'invalid QR' };
const passInclude = [{ model: GatePass, include: [Property] }, { model: User, as: 'ScannedBy', attributes: ['username'] }];

/* ─── Admin (A01) ─────────────────────────────────────────────────────────── */
const admin = async (req, res) => {
  try {
    const today = dayStart(), yesterday = dayStart(-1), weekAgo = dayStart(-7), todayStr = manilaDate();
    const [logsToday, logsYesterdayCount, logsWeek, inside, activePasses, denials, openIncidents, incidents7d,
      walkinsToday, overstays, upcomingPasses] = await Promise.all([
      ActivityLog.findAll({ where: { scanned_at: { [Op.gte]: today } }, include: passInclude, order: [['scanned_at', 'DESC']] }),
      ActivityLog.count({ where: { action: 'entry', scanned_at: { [Op.gte]: yesterday, [Op.lt]: today } } }),
      ActivityLog.findAll({ where: { action: 'entry', scanned_at: { [Op.gte]: weekAgo, [Op.lt]: today } }, attributes: ['scanned_at'] }),
      GatePass.count({ where: { status: 'checked_in' } }),
      GatePass.count({ where: { status: 'active', expected_date: { [Op.gte]: todayStr } } }),
      ScanDenial.findAll({ where: { scanned_at: { [Op.gte]: today } }, include: [{ model: User, as: 'ScannedBy', attributes: ['username'] }], order: [['scanned_at', 'DESC']] }),
      Incident.findAll({ where: { status: 'open' }, order: [['createdAt', 'ASC']] }),
      Incident.findAll({ where: { createdAt: { [Op.gte]: weekAgo } }, attributes: ['status', 'severity'] }),
      WalkinRequest.findAll({ where: { createdAt: { [Op.gte]: today } }, attributes: ['status'] }),
      GatePass.findAll({ where: { status: 'checked_in', scanned_at: { [Op.lt]: new Date(Date.now() - 4 * 3600e3) } }, include: [Property], order: [['scanned_at', 'ASC']] }),
      GatePass.findAll({ where: { status: 'active', expected_date: { [Op.gt]: todayStr } }, include: [Property], order: [['expected_date', 'ASC']], limit: 4 }),
    ]);

    const entriesToday = logsToday.filter((l) => l.action === 'entry');
    const walkinEntries = entriesToday.filter((l) => !l.GatePass?.qr_token);

    // Needs attention — most urgent first
    const sevRank = { critical: 0, high: 1, normal: 2 };
    const attention = [
      ...openIncidents.sort((a, b) => sevRank[a.severity] - sevRank[b.severity]).slice(0, 3).map((i) => ({
        id: `inc-${i.id}`, kind: 'incident', severity: i.severity === 'critical' ? 'critical' : 'overdue', title: i.title,
        meta: `${i.code} · ${i.location} · open ${Math.max(1, Math.round((Date.now() - new Date(i.createdAt)) / 60000))} min`, action: 'Open incident',
      })),
      ...(overstays.length ? [{
        id: 'overstay', kind: 'overstay', severity: 'overdue', title: `${overstays.length} visitor${overstays.length > 1 ? 's' : ''} inside for over 4 hours`,
        meta: `Longest: ${overstays[0].guest_name} · ${street(overstays[0].Property)}`, action: 'View inside',
      }] : []),
      ...(denials.length ? [{
        id: 'denied', kind: 'denied', severity: 'upcoming', title: `${denials.length} denied scan${denials.length > 1 ? 's' : ''} today`,
        meta: `Latest: ${DENY_LABEL[denials[0].reason] || denials[0].reason}`, action: 'Review log',
      }] : []),
    ];

    // Hourly 6 AM – 10 PM: today so far vs 7-day average
    const hours = Array.from({ length: 17 }, (_, i) => i + 6);
    const nowHour = manilaHour(new Date());
    const hourly = hours.map((h) => ({
      today: entriesToday.filter((l) => manilaHour(l.scanned_at) === h).length,
      avg: Math.round(logsWeek.filter((l) => manilaHour(l.scanned_at) === h).length / 7),
      past: h <= nowHour,
    }));
    const perHour = Array.from({ length: 24 }, (_, h) => entriesToday.filter((l) => manilaHour(l.scanned_at) === h).length);
    const peakHour = perHour.reduce((b, x, h) => (x > perHour[b] ? h : b), 0);
    const fmtH = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;

    const qrEntries = entriesToday.length - walkinEntries.length;
    const total = entriesToday.length || 1;
    const denyCounts = denials.reduce((m, d) => ({ ...m, [d.reason]: (m[d.reason] || 0) + 1 }), {});

    const recent = [
      ...logsToday.map((l) => ({
        time: l.scanned_at, dir: l.action === 'entry' ? 'Entry' : 'Exit', visitor: l.GatePass?.guest_name || '—', plate: l.GatePass?.plate_number || '—',
        dest: where(l.GatePass?.Property), guard: l.ScannedBy?.username || '—',
        result: l.action === 'entry' && !l.GatePass?.qr_token ? 'walkin' : 'allowed', reason: l.action === 'entry' && !l.GatePass?.qr_token ? 'host confirmed' : undefined,
      })),
      ...denials.map((d) => ({ time: d.scanned_at, dir: 'Entry', visitor: d.guest_name || 'Unknown', plate: '—', dest: '—', guard: d.ScannedBy?.username || '—', result: 'denied', reason: DENY_LABEL[d.reason] || d.reason })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    const resolved7 = incidents7d.filter((i) => i.status === 'resolved').length;
    const decided = walkinsToday.filter((w) => w.status !== 'pending').length;

    return res.status(200).json({ success: true, data: {
      gate: { open: true, inside, updated: new Date().toISOString() },
      attention,
      today: {
        entries: entriesToday.length,
        delta: logsYesterdayCount ? Math.round(((entriesToday.length - logsYesterdayCount) / logsYesterdayCount) * 1000) / 10 : null,
        peak: entriesToday.length ? `${fmtH(peakHour)}–${fmtH((peakHour + 1) % 24)}` : '—',
        hours: ['6 AM', '10 AM', '2 PM', '6 PM', '10 PM'], hourly,
        inside, walkins: walkinEntries.length, activePasses, denied: denials.length,
      },
      queues: [
        { name: 'Incidents (7 days)', done: resolved7, total: incidents7d.length || 0, meta: `${openIncidents.length} open · ${openIncidents.filter((i) => i.severity === 'critical').length} critical`, icon: 'alert', danger: openIncidents.some((i) => i.severity === 'critical') },
        { name: 'Walk-in approvals today', done: decided, total: walkinsToday.length, meta: `${walkinsToday.filter((w) => w.status === 'pending').length} waiting for residents`, icon: 'users' },
      ].filter((q) => q.total > 0),
      upcoming: upcomingPasses.map((p) => ({ day: p.expected_date, title: p.guest_name, meta: `Visitor pass · ${street(p.Property)}`, tag: 'Visit' })),
      mix: entriesToday.length ? [
        { label: 'QR visitor pass', count: qrEntries, pct: Math.round((qrEntries / total) * 100) },
        { label: 'Walk-in', count: walkinEntries.length, pct: Math.round((walkinEntries.length / total) * 100), warn: true },
      ] : [],
      deniedNote: denials.length ? `${denials.length} denied scan${denials.length > 1 ? 's' : ''} not counted: ${Object.entries(denyCounts).map(([k, v]) => `${v} ${DENY_LABEL[k] || k}`).join(', ')}` : null,
      recent: recent.slice(0, 8),
      totals: { all: recent.length, denied: denials.length, walkins: walkinEntries.length },
    } });
  } catch (e) { return fail(res, 'admin', e); }
};

/* ─── Resident (H01) ──────────────────────────────────────────────────────── */
const resident = async (req, res) => {
  try {
    const ids = await myPropertyIds(req.user.id);
    const pid = { [Op.in]: ids.length ? ids : [0] };
    const todayStr = manilaDate();
    const weekStr = manilaDate(new Date(Date.now() + 7 * 86400e3));

    const [pending, insideRows, upcomingRows, activeToday, recentLogs, recentWalkins] = await Promise.all([
      WalkinRequest.findAll({ where: { PropertyId: pid, status: 'pending' }, include: [{ model: Property, include: [Resident] }], order: [['createdAt', 'DESC']] }),
      GatePass.findAll({ where: { PropertyId: pid, status: 'checked_in' }, include: [Property], order: [['scanned_at', 'DESC']] }),
      GatePass.findAll({ where: { PropertyId: pid, status: 'active', expected_date: { [Op.gte]: todayStr, [Op.lte]: weekStr } }, include: [Property], order: [['expected_date', 'ASC']] }),
      GatePass.count({ where: { PropertyId: pid, status: 'active', expected_date: todayStr } }),
      ActivityLog.findAll({ include: [{ model: GatePass, where: { PropertyId: pid }, include: [Property] }], order: [['scanned_at', 'DESC']], limit: 3 }),
      WalkinRequest.findAll({ where: { PropertyId: pid, status: { [Op.in]: ['approved', 'denied', 'expired', 'admitted'] } }, order: [['updatedAt', 'DESC']], limit: 2 }),
    ]);
    for (const w of pending) await refreshWalkin(w);
    const live = pending.filter((w) => w.status === 'pending');
    const addr = (p) => (p ? `${p.street ? `${p.street}, ` : ''}Block ${p.block}, Lot ${p.lot}` : '');

    const notifications = [
      ...live.map((w) => ({ icon: 'gate', time: w.createdAt, title: 'Walk-in approval requested', body: `${w.guest_name} is at the Main Gate for ${addr(w.Property)}.`, action: 'Review request' })),
      ...recentLogs.map((l) => ({ icon: 'entry', time: l.scanned_at, title: l.action === 'entry' ? 'Your visitor has arrived' : 'Your visitor has left', body: `${l.GatePass.guest_name} ${l.action === 'entry' ? 'entered' : 'exited'} at the Main Gate.`, action: 'View visit' })),
      ...recentWalkins.map((w) => ({ icon: 'doc', time: w.updatedAt, title: `Walk-in ${w.status}`, body: `${w.guest_name} · ${w.purpose || 'Visit'}`, action: 'View visit' })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 3);

    return res.status(200).json({ success: true, data: {
      walkin: live[0] ? shapeWalkin(live[0]) : null,
      setup: null, documents: [], lease: null,
      stats: { activePasses: activeToday, inside: insideRows.length, upcoming: upcomingRows.length },
      inside: insideRows.map((p) => ({ name: p.guest_name, where: addr(p.Property), entered: p.scanned_at, expectedExit: new Date(new Date(p.scanned_at).getTime() + 3 * 3600e3).toISOString(), status: Date.now() - new Date(p.scanned_at) > 4 * 3600e3 ? 'Overstaying' : 'On time' })),
      upcoming: upcomingRows.map((p) => ({ date: p.expected_date, name: p.guest_name, kind: p.purpose || 'Visit', where: addr(p.Property) })),
      notifications,
    } });
  } catch (e) { return fail(res, 'resident', e); }
};

/* ─── Guard (G02) ─────────────────────────────────────────────────────────── */
const guard = async (req, res) => {
  try {
    const today = dayStart(), todayStr = manilaDate();
    const [entries, exits, inside, last, expected, pending] = await Promise.all([
      ActivityLog.count({ where: { action: 'entry', scanned_at: { [Op.gte]: today } } }),
      ActivityLog.count({ where: { action: 'exit', scanned_at: { [Op.gte]: today } } }),
      GatePass.count({ where: { status: 'checked_in' } }),
      ActivityLog.findAll({ include: [{ model: GatePass, attributes: ['guest_name'] }], order: [['scanned_at', 'DESC']], limit: 2 }),
      GatePass.findAll({ where: { status: 'active', expected_date: todayStr }, include: [Property], limit: 3, order: [['createdAt', 'ASC']] }),
      WalkinRequest.findAll({ where: { status: 'pending' } }),
    ]);
    for (const w of pending) await refreshWalkin(w);
    return res.status(200).json({ success: true, data: {
      shift: null,
      approvalsWaiting: pending.filter((w) => w.status === 'pending').length,
      notice: null,
      today: { entries, exits, inside },
      lastScans: last.map((l) => ({ name: l.GatePass?.guest_name, time: l.scanned_at, dir: l.action })),
      expected: expected.map((p) => ({ name: `${p.guest_name} · ${p.purpose || 'Guest'}`, time: null, where: street(p.Property), vehicle: Boolean(p.plate_number) })),
    } });
  } catch (e) { return fail(res, 'guard', e); }
};

module.exports = { admin, resident, guard };
