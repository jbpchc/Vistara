'use strict';

const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { GatePass, Property, Resident, ActivityLog } = require('../models');
const { Op } = require('sequelize');

/**
 * POST /api/qr/generate
 * Body: { property_id, guest_name, expected_date }
 * Auth: Resident only
 * Creates a new GatePass with a UUID pass_id and QR token.
 */
const generatePass = async (req, res) => {
  try {
    const { property_id, guest_name, expected_date, purpose } = req.body;

    if (!property_id || !guest_name || !expected_date) {
      return res.status(400).json({
        success: false,
        message: 'property_id, guest_name, and expected_date are required.',
      });
    }

    // Validate the property belongs to the requesting resident's user
    const property = await Property.findOne({
      where: { id: property_id },
      include: [{ model: Resident, where: { UserId: req.user.id } }],
    });

    if (!property) {
      return res.status(403).json({
        success: false,
        message: 'Property not found or does not belong to your account.',
      });
    }

    const pass_id = uuidv4();

    // Build the QR token payload — signed so it can be verified without DB on fast checks
    const qr_token = jwt.sign(
      {
        pass_id,
        property_id,
        guest_name,
        expected_date,
        issued_by: req.user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Expire any old active passes for the same property + guest + date to avoid duplicates
    await GatePass.update(
      { status: 'expired' },
      {
        where: {
          PropertyId: property_id,
          guest_name,
          expected_date,
          status: 'active',
        },
      }
    );

    const gatePass = await GatePass.create({
      PropertyId: property_id,
      guest_name,
      expected_date,
      pass_id,
      qr_token,
      status: 'active',
      purpose: purpose || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Gate pass created successfully.',
      data: {
        pass_id: gatePass.pass_id,
        guest_name: gatePass.guest_name,
        expected_date: gatePass.expected_date,
        status: gatePass.status,
        qr_token: gatePass.qr_token,
        purpose: gatePass.purpose,
        createdAt: gatePass.createdAt,
        property: {
          block: property.block,
          lot: property.lot,
          street: property.street,
        },
      },
    });
  } catch (error) {
    console.error('[QR] Generate error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/qr/validate
 * Body: { qr_token }
 * Auth: Guard only
 * Validates a QR token, marks pass as 'used', logs the guard's ID.
 */
const validatePass = async (req, res) => {
  try {
    const { qr_token, check_only = false, plate_number = '', is_walkin = false, notes = '' } = req.body;

    if (!qr_token) {
      return res.status(400).json({ success: false, message: 'QR token or Pass ID is required.' });
    }

    let searchPassId = null;

    // Check if it's a JWT (starts with eyJ)
    if (qr_token.startsWith('eyJ')) {
      try {
        const decoded = jwt.verify(qr_token, process.env.JWT_SECRET);
        searchPassId = decoded.pass_id;
      } catch (jwtErr) {
        const isExpired = jwtErr.name === 'TokenExpiredError';
        return res.status(200).json({
          success: false,
          valid: false,
          reason: isExpired ? 'expired' : 'invalid',
          message: isExpired ? 'This pass has expired.' : 'Invalid QR code token.',
        });
      }
    } else {
      // Treat as a manually entered short Pass ID (e.g. A93E82A6)
      // Force lowercase because UUIDs are stored in lowercase and DB lookups might be case-sensitive
      searchPassId = qr_token.trim().toLowerCase();
    }

    // Find the GatePass
    const gatePass = await GatePass.findOne({
      where: searchPassId.length < 36 
        ? { pass_id: { [Op.like]: `${searchPassId}%` } } 
        : { pass_id: searchPassId },
      include: [{ model: Property, include: [Resident] }],
    });

    if (!gatePass) {
      return res.status(200).json({ success: false, valid: false, reason: 'not_found', message: 'Pass not found or invalid.' });
    }

    if (gatePass.status === 'used') {
      return res.status(200).json({
        success: false,
        valid: false,
        reason: 'already_used',
        message: 'This pass has already been used.',
        data: {
          guest_name: gatePass.guest_name,
          scanned_at: gatePass.scanned_at,
        },
      });
    }

    if (gatePass.status === 'expired') {
      return res.status(200).json({
        success: false,
        valid: false,
        reason: 'expired',
        message: 'This pass is expired.',
      });
    }

    // Check if expected_date matches today (using Asia/Manila +08:00 timezone)
    const today = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (gatePass.expected_date !== today) {
      return res.status(200).json({
        success: false,
        valid: false,
        reason: 'wrong_date',
        message: `This pass is valid on ${gatePass.expected_date}, not today.`,
      });
    }

    if (check_only) {
      return res.status(200).json({
        success: true,
        valid: true,
        check_only: true,
        data: {
          pass_id: gatePass.pass_id,
          guest_name: gatePass.guest_name,
          expected_date: gatePass.expected_date,
          block: gatePass.Property?.block,
          lot: gatePass.Property?.lot,
          resident_name: gatePass.Property?.Resident?.full_name,
          purpose: gatePass.purpose || '' // Pre-filled purpose from dedicated column
        },
      });
    }

    // Safety guard — reject if guard identity cannot be determined
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Guard authentication required. Please log in again.' });
    }

    // Process actual check-in — direct column writes, no encoding
    await gatePass.update({
      status: 'checked_in',
      scanned_at: new Date(),
      scanned_by: req.user.id,
      plate_number: is_walkin ? null : (plate_number || null),
      guard_notes:  notes     || null,
    });

    // Record in activity logs
    await ActivityLog.create({
      GatePassId: gatePass.id,
      action: 'entry',
      scanned_at: new Date(),
      scanned_by: req.user.id,
      notes: notes || null,
    });

    return res.status(200).json({
      success: true,
      valid: true,
      message: 'Access Granted.',
      data: {
        guest_name: gatePass.guest_name,
        expected_date: gatePass.expected_date,
        block: gatePass.Property?.block,
        lot: gatePass.Property?.lot,
        resident_name: gatePass.Property?.Resident?.full_name,
        scanned_at: gatePass.scanned_at,
        plate_number: gatePass.plate_number,
        guard_notes: gatePass.guard_notes,
      },
    });
  } catch (error) {
    // Surface the actual DB error in the log so missing-column issues are visible
    console.error('[QR] Validate error:', error.message || error);
    const isDbColumnError = error.message?.includes('Unknown column') || error.message?.includes("doesn't exist");
    return res.status(500).json({
      success: false,
      message: isDbColumnError
        ? 'Database schema is out of date. Please run the migration SQL (migrate_schema_refactor.sql).'
        : 'Internal server error.',
    });
  }
};

/**
 * POST /api/qr/exit
 * Body: { pass_id }
 * Auth: Guard only
 * Marks a checked_in visitor as exited (status → 'used'), records exited_at & exited_by.
 */
const exitPass = async (req, res) => {
  try {
    const { pass_id } = req.body;

    if (!pass_id) {
      return res.status(400).json({ success: false, message: 'pass_id is required.' });
    }

    const gatePass = await GatePass.findOne({
      where: { pass_id: pass_id.trim() },
      include: [{ model: Property, include: [Resident] }],
    });

    if (!gatePass) {
      return res.status(404).json({ success: false, message: 'Pass not found.' });
    }

    if (gatePass.status !== 'checked_in') {
      const msg = gatePass.status === 'used'
        ? 'This visitor has already exited.'
        : gatePass.status === 'active'
        ? 'This visitor has not entered yet.'
        : 'This pass is expired.';
      return res.status(400).json({ success: false, message: msg });
    }

    await gatePass.update({
      status: 'used',
      exited_at: new Date(),
      exited_by: req.user.id,
    });

    // Record in activity logs
    await ActivityLog.create({
      GatePassId: gatePass.id,
      action: 'exit',
      scanned_at: new Date(),
      scanned_by: req.user.id,
    });

    return res.status(200).json({
      success: true,
      message: 'Exit logged successfully.',
      data: {
        pass_id: gatePass.pass_id,
        guest_name: gatePass.guest_name,
        exited_at: gatePass.exited_at,
        block: gatePass.Property?.block,
        lot: gatePass.Property?.lot,
        resident_name: gatePass.Property?.Resident?.full_name,
      },
    });
  } catch (error) {
    console.error('[QR] Exit error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { generatePass, validatePass, exitPass };
