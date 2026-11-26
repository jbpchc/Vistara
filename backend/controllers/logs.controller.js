'use strict';

const { GatePass, Property, Resident, User, ActivityLog } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/logs
 * Auth: Guard + Admin
 * Query params: page, limit, status, date_from, date_to, search
 */
const getLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      date,
      date_from,
      date_to,
      search,
      sort = 'desc',
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const where = {};

    if (status) {
      if (status.includes(',')) {
        where.status = { [Op.in]: status.split(',') };
      } else {
        where.status = status;
      }
    }

    if (date) {
      // Use local timezone (+08:00) to create correct UTC range
      const startDate = new Date(`${date}T00:00:00+08:00`);
      const endDate = new Date(`${date}T23:59:59+08:00`);
      where.scanned_at = { [Op.between]: [startDate, endDate] };
    } else if (date_from || date_to) {
      where.scanned_at = {};
      if (date_from) {
        const start = new Date(date_from);
        start.setHours(0, 0, 0, 0);
        where.scanned_at[Op.gte] = start;
      }
      if (date_to) {
        const end = new Date(date_to);
        end.setHours(23, 59, 59, 999);
        where.scanned_at[Op.lte] = end;
      }
    }

    if (search) {
      where.guest_name = { [Op.like]: `%${search}%` };
    }

    const { count, rows } = await GatePass.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset,
      order: [['scanned_at', sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
      include: [
        {
          model: Property,
          attributes: ['block', 'lot', 'street'],
          include: [{ model: Resident, attributes: ['full_name', 'contact_number'] }],
        },
        {
          model: User,
          as: 'ScannedBy',
          attributes: ['username'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
      data: rows,
    });
  } catch (error) {
    console.error('[LOGS] Get logs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getFeedLogs = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const rows = await ActivityLog.findAll({
      limit: parseInt(limit, 10),
      order: [['scanned_at', 'DESC']],
      include: [
        {
          model: GatePass,
          include: [
            {
              model: Property,
              include: [Resident]
            }
          ]
        },
        {
          model: User,
          as: 'ScannedBy',
          attributes: ['username'],
        },
      ],
    });

    const data = rows.map(row => ({
      id: row.id,
      guest_name: row.GatePass?.guest_name,
      status: row.action === 'entry' ? 'checked_in' : 'used',
      scanned_at: row.scanned_at,
      ScannedBy: row.ScannedBy,
    }));

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('[LOGS] Get feed logs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};


/**
 * POST /api/logs/manual
 * Auth: Guard only
 * Body: { property_id, visitor_name, visitor_id, purpose, vehicle_plate, notes }
 * Creates a manual GatePass log entry (not QR-based).
 * Each input maps directly to its dedicated database column.
 */
const createManualEntry = async (req, res) => {
  try {
    const { property_id, visitor_name, visitor_id, purpose, vehicle_plate, notes } = req.body;

    if (!property_id || !visitor_name) {
      return res.status(400).json({ success: false, message: 'property_id and visitor_name are required.' });
    }

    const property = await Property.findByPk(property_id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    // Ensure we use local date, avoiding UTC timezone bugs
    const now = new Date();
    const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const { v4: uuidv4 } = require('uuid');

    const gatePass = await GatePass.create({
      PropertyId: property_id,
      guest_name: visitor_name,
      expected_date: today,
      pass_id: uuidv4(),
      status: 'checked_in',
      scanned_at: new Date(),
      scanned_by: req.user.id,
      // Direct column binding — no encoding
      proof_of_id:  visitor_id     || null,
      purpose:      purpose        || null,
      plate_number: vehicle_plate  || null,
      guard_notes:  notes          || null,
    });

    // Record in activity logs
    await ActivityLog.create({
      GatePassId: gatePass.id,
      action: 'entry',
      scanned_at: gatePass.scanned_at,
      scanned_by: req.user.id,
      notes: notes || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Manual entry logged.',
      data: gatePass,
    });
  } catch (error) {
    console.error('[LOGS] Manual entry error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/logs/inside
 * Auth: Guard + Admin
 * Returns all visitors currently checked_in
 */
const getInsideLogs = async (req, res) => {
  try {
    const rows = await GatePass.findAll({
      where: { status: 'checked_in' },
      order: [['scanned_at', 'DESC']],
      include: [
        {
          model: Property,
          attributes: ['block', 'lot', 'street'],
          include: [{ model: Resident, attributes: ['full_name', 'contact_number'] }],
        },
        {
          model: User,
          as: 'ScannedBy',
          attributes: ['username'],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('[LOGS] Get inside logs error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getLogs, createManualEntry, getInsideLogs, getFeedLogs };

