'use strict';

const { User, Property, GatePass } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/guard/stats
 * Returns real-time gate stats for the Guard Dashboard.
 */
const getGuardStats = async (req, res) => {
  try {
    // Use local timezone (+08:00) to calculate start of today
    const now = new Date();
    const localDateStr = new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0];
    const todayStart = new Date(`${localDateStr}T00:00:00+08:00`);

    const [entriesToday, currentlyInside, activeGuards, totalProperties] = await Promise.all([
      // Gate entries scanned today (either still inside or already left)
      GatePass.count({
        where: {
          status: { [Op.in]: ['checked_in', 'used'] },
          scanned_at: { [Op.gte]: todayStart },
        },
      }),
      // Visitors currently inside (checked_in status, regardless of scan date)
      GatePass.count({
        where: {
          status: 'checked_in',
        },
      }),
      // Active guards
      User.count({ where: { role: 'guard', is_active: true } }),
      // Total properties
      Property.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        entries_today:     entriesToday,
        currently_inside:  currentlyInside,
        active_guards:     activeGuards,
        total_properties:  totalProperties,
        generated_at:      new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[GUARD] Stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getGuardStats };
