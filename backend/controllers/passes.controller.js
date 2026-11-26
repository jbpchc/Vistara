'use strict';

const { GatePass, Property, Resident } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

/**
 * GET /api/passes/my
 * Auth: Resident only
 * Returns all gate passes for the resident's properties.
 */
const getMyPasses = async (req, res) => {
  try {
    // Find all properties belonging to this resident's user
    const resident = await Resident.findOne({
      where: { UserId: req.user.id },
      include: [{ model: Property, attributes: ['id'] }],
    });

    if (!resident) {
      return res.status(200).json({ success: true, data: [] });
    }

    const propertyIds = resident.Properties.map((p) => p.id);
    if (propertyIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const passes = await GatePass.findAll({
      where: { PropertyId: propertyIds },
      include: [{ model: Property, attributes: ['block', 'lot', 'street'] }],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });

    return res.status(200).json({ success: true, data: passes });
  } catch (error) {
    console.error('[PASSES] Get my passes error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * PUT /api/passes/:id
 * Body: { guest_name, expected_date, purpose }
 * Auth: Resident only
 * Updates a pass if it is still active.
 */
const updatePass = async (req, res) => {
  try {
    const { id } = req.params;
    const { guest_name, expected_date, purpose } = req.body;

    if (!guest_name || !expected_date) {
      return res.status(400).json({ success: false, message: 'Guest name and expected date are required.' });
    }

    // Verify the pass belongs to a property of this resident
    const resident = await Resident.findOne({
      where: { UserId: req.user.id },
      include: [{ model: Property, attributes: ['id'] }],
    });

    if (!resident) {
      return res.status(403).json({ success: false, message: 'Resident account not found.' });
    }

    const propertyIds = resident.Properties.map(p => p.id);

    // Find the pass using the primary key or pass_id
    const pass = await GatePass.findOne({
      where: {
        [Op.or]: [{ id }, { pass_id: id }],
        PropertyId: propertyIds
      },
      include: [{ model: Property, attributes: ['block', 'lot', 'street'] }]
    });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Gate pass not found.' });
    }

    if (pass.status !== 'active') {
      return res.status(400).json({ success: false, message: `Cannot edit a ${pass.status} pass.` });
    }

    const qr_token = jwt.sign(
      {
        pass_id: pass.pass_id,
        property_id: pass.PropertyId,
        guest_name,
        expected_date,
        issued_by: req.user.id,
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await pass.update({
      guest_name,
      expected_date,
      purpose: purpose || null,
      qr_token
    });

    return res.status(200).json({
      success: true,
      message: 'Gate pass updated successfully.',
      data: pass
    });
  } catch (error) {
    console.error('[PASSES] Update pass error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * DELETE /api/passes/:id
 * Auth: Resident only
 * Cancels/expires an active pass.
 */
const cancelPass = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const resident = await Resident.findOne({
      where: { UserId: req.user.id },
      include: [{ model: Property, attributes: ['id'] }],
    });

    if (!resident) {
      return res.status(403).json({ success: false, message: 'Resident account not found.' });
    }

    const propertyIds = resident.Properties.map(p => p.id);

    const pass = await GatePass.findOne({
      where: {
        [Op.or]: [{ id }, { pass_id: id }],
        PropertyId: propertyIds
      }
    });

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Gate pass not found.' });
    }

    if (pass.status !== 'active') {
      return res.status(400).json({ success: false, message: `Gate pass is already ${pass.status}.` });
    }

    await pass.update({ status: 'expired' });

    return res.status(200).json({
      success: true,
      message: 'Gate pass cancelled successfully.',
      data: pass
    });
  } catch (error) {
    console.error('[PASSES] Cancel pass error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getMyPasses, updatePass, cancelPass };
