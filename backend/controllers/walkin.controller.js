'use strict';

const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { WalkinRequest, Property, Resident, GatePass, ActivityLog, User } = require('../models');

/**
 * Walk-in approval flow
 *   Guard    POST  /api/walkins              → create a pending request for a property
 *   Guard    GET   /api/walkins/:id          → poll status (pending / approved / denied / expired)
 *   Guard    POST  /api/walkins/:id/admit    → log the entry (approved, or guard override after timeout)
 *   Resident GET   /api/walkins/mine         → pending requests for my properties
 *   Resident POST  /api/walkins/:id/decision → { decision: 'approve' | 'deny', note? }
 */

const isExpired = (w) => w.status === 'pending' && Date.now() - new Date(w.createdAt).getTime() > w.window_sec * 1000;

// Lazily mark timed-out requests as expired.
const refresh = async (w) => {
  if (isExpired(w)) { w.status = 'expired'; await w.save(); }
  return w;
};

const shape = (w) => {
  const p = w.Property;
  const r = p?.Resident;
  return {
    id: w.id, status: w.status, guest: w.guest_name, purpose: w.purpose, vehicle: w.vehicle_plate,
    visitor_id_type: w.visitor_id_type, notes: w.notes, requestedAt: w.createdAt, windowSec: w.window_sec,
    decidedAt: w.decided_at, decisionNote: w.decision_note,
    property: p ? { id: p.id, block: p.block, lot: p.lot, street: p.street } : null,
    resident: r ? { name: r.full_name, contact: r.contact_number } : null,
    address: p ? `${p.street ? `${p.street}, ` : ''}Block ${p.block}, Lot ${p.lot}` : '',
  };
};

const withProperty = { include: [{ model: Property, include: [Resident] }] };

const myPropertyIds = async (userId) => {
  const r = await Resident.findOne({ where: { UserId: userId }, include: [Property] });
  return (r?.Properties || []).map((p) => p.id);
};

const createWalkin = async (req, res) => {
  try {
    const { property_id, visitor_name, purpose, vehicle_plate, visitor_id, notes } = req.body;
    if (!property_id || !visitor_name?.trim()) return res.status(400).json({ success: false, message: 'property_id and visitor_name are required.' });
    const property = await Property.findByPk(property_id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found.' });

    const w = await WalkinRequest.create({
      PropertyId: property_id, guest_name: visitor_name.trim(), purpose: purpose || null, vehicle_plate: vehicle_plate || null,
      visitor_id_type: visitor_id || null, notes: notes || null, requested_by: req.user.id,
    });
    const full = await WalkinRequest.findByPk(w.id, withProperty);
    return res.status(201).json({ success: true, message: 'Resident notified. Waiting for approval.', data: shape(full) });
  } catch (e) {
    console.error('[WALKIN] create', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getWalkin = async (req, res) => {
  try {
    const w = await WalkinRequest.findByPk(req.params.id, withProperty);
    if (!w) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (req.user.role === 'resident' && !(await myPropertyIds(req.user.id)).includes(w.PropertyId)) {
      return res.status(403).json({ success: false, message: 'Not your property.' });
    }
    await refresh(w);
    return res.status(200).json({ success: true, data: shape(w) });
  } catch (e) {
    console.error('[WALKIN] get', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const myPending = async (req, res) => {
  try {
    const ids = await myPropertyIds(req.user.id);
    const rows = await WalkinRequest.findAll({ where: { PropertyId: { [Op.in]: ids.length ? ids : [0] }, status: 'pending' }, order: [['createdAt', 'DESC']], ...withProperty });
    for (const w of rows) await refresh(w);
    return res.status(200).json({ success: true, data: rows.filter((w) => w.status === 'pending').map(shape) });
  } catch (e) {
    console.error('[WALKIN] mine', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const decide = async (req, res) => {
  try {
    const { decision, note } = req.body;
    if (!['approve', 'deny'].includes(decision)) return res.status(400).json({ success: false, message: "decision must be 'approve' or 'deny'." });
    const w = await WalkinRequest.findByPk(req.params.id, withProperty);
    if (!w) return res.status(404).json({ success: false, message: 'Request not found.' });
    if (!(await myPropertyIds(req.user.id)).includes(w.PropertyId)) return res.status(403).json({ success: false, message: 'Not your property.' });
    await refresh(w);
    if (w.status !== 'pending') return res.status(409).json({ success: false, message: `This request is already ${w.status}.` });

    Object.assign(w, { status: decision === 'approve' ? 'approved' : 'denied', decided_by: req.user.id, decided_at: new Date(), decision_note: note || null });
    await w.save();
    return res.status(200).json({
      success: true,
      message: decision === 'approve' ? 'Visitor approved — the guard has been notified.' : 'Visitor denied — the guard has been notified.',
      data: shape(w),
    });
  } catch (e) {
    console.error('[WALKIN] decide', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/** Log the entry. Allowed when approved, or as a guard override after the window expired (e.g. resident confirmed by phone). */
const admit = async (req, res) => {
  try {
    const { override_reason } = req.body || {};
    const w = await WalkinRequest.findByPk(req.params.id, withProperty);
    if (!w) return res.status(404).json({ success: false, message: 'Request not found.' });
    await refresh(w);
    const overriding = w.status !== 'approved';
    if (overriding && !(w.status === 'expired' && override_reason?.trim())) {
      return res.status(409).json({ success: false, message: w.status === 'denied' ? 'The resident denied this visitor.' : 'Wait for the resident, or give a reason to admit after the time runs out.' });
    }
    const now = new Date();
    const pass = await GatePass.create({
      PropertyId: w.PropertyId, guest_name: w.guest_name, expected_date: new Date(now.getTime() + 8 * 3600e3).toISOString().split('T')[0],
      pass_id: uuidv4(), status: 'checked_in', scanned_at: now, scanned_by: req.user.id,
      proof_of_id: w.visitor_id_type, purpose: w.purpose, plate_number: w.vehicle_plate,
      guard_notes: [w.notes, overriding ? `Admitted after timeout: ${override_reason}` : 'Walk-in approved by resident'].filter(Boolean).join(' · '),
    });
    await ActivityLog.create({ GatePassId: pass.id, action: 'entry', scanned_at: now, scanned_by: req.user.id, notes: 'Walk-in' });
    Object.assign(w, { status: 'admitted', GatePassId: pass.id });
    await w.save();
    return res.status(200).json({ success: true, message: 'Entry logged.', data: shape(w) });
  } catch (e) {
    console.error('[WALKIN] admit', e);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { createWalkin, getWalkin, myPending, decide, admit, shapeWalkin: shape, refreshWalkin: refresh, myPropertyIds };
