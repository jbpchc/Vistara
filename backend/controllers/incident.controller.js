'use strict';

const { Incident, User } = require('../models');

/**
 * Incidents & SOS
 *   Guard/Admin POST  /api/incidents            → report ({ type, severity, title, description, location })
 *   Guard       POST  /api/incidents/sos        → SOS alert (critical, from the gate tablet)
 *   Guard/Admin GET   /api/incidents?status=    → list, open first, most severe first
 *   Admin       PATCH /api/incidents/:id/resolve → { resolution } (required)
 */

const SEV_ORDER = { critical: 0, high: 1, normal: 2 };

const shape = (i) => ({
  id: i.id, code: i.code, type: i.type, severity: i.severity, title: i.title, description: i.description,
  location: i.location, status: i.status, createdAt: i.createdAt, resolvedAt: i.resolved_at, resolution: i.resolution,
  reportedBy: i.ReportedBy?.username || null, resolvedBy: i.ResolvedBy?.username || null,
});

const withCode = async (i) => {
  i.code = `INC-${new Date(i.createdAt).getFullYear()}-${String(i.id).padStart(4, '0')}`;
  await i.save();
  return i;
};

const report = async (req, res) => {
  try {
    const { type = 'other', severity = 'normal', title, description, location } = req.body;
    if (!title?.trim()) return res.status(400).json({ success: false, message: 'A short title is required.' });
    const i = await withCode(await Incident.create({ type, severity, title: title.trim(), description: description || null, location: location || 'Main Gate', reported_by: req.user.id }));
    return res.status(201).json({ success: true, message: `Incident ${i.code} reported. The HOA office has been notified.`, data: shape(i) });
  } catch (e) {
    console.error('[INCIDENT] report', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const sos = async (req, res) => {
  try {
    const i = await withCode(await Incident.create({
      type: 'sos', severity: 'critical', title: `SOS from ${req.body.location || 'Main Gate'}`,
      description: req.body.note || 'Emergency alert raised from the guard tablet.', location: req.body.location || 'Main Gate', reported_by: req.user.id,
    }));
    return res.status(201).json({ success: true, message: 'SOS sent. The HOA office has been alerted.', data: shape(i) });
  } catch (e) {
    console.error('[INCIDENT] sos', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const list = async (req, res) => {
  try {
    const where = {};
    if (['open', 'resolved'].includes(req.query.status)) where.status = req.query.status;
    const rows = await Incident.findAll({
      where, order: [['createdAt', 'DESC']], limit: 200,
      include: [{ model: User, as: 'ReportedBy', attributes: ['username'] }, { model: User, as: 'ResolvedBy', attributes: ['username'] }],
    });
    rows.sort((a, b) => (a.status === b.status ? SEV_ORDER[a.severity] - SEV_ORDER[b.severity] : a.status === 'open' ? -1 : 1));
    return res.status(200).json({ success: true, data: rows.map(shape) });
  } catch (e) {
    console.error('[INCIDENT] list', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const resolve = async (req, res) => {
  try {
    const { resolution } = req.body;
    if (!resolution?.trim()) return res.status(400).json({ success: false, message: 'Add a short resolution note before closing.' });
    const i = await Incident.findByPk(req.params.id);
    if (!i) return res.status(404).json({ success: false, message: 'Incident not found.' });
    Object.assign(i, { status: 'resolved', resolution: resolution.trim(), resolved_by: req.user.id, resolved_at: new Date() });
    await i.save();
    return res.status(200).json({ success: true, message: `${i.code} resolved.`, data: shape(i) });
  } catch (e) {
    console.error('[INCIDENT] resolve', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { report, sos, list, resolve, shapeIncident: shape };
