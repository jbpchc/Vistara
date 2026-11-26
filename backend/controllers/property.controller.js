'use strict';

const { Op } = require('sequelize');
const { Property, Resident, User, sequelize } = require('../models');

/**
 * GET /api/properties/search?q=<query>
 * Searches by Block, Lot, or Resident full_name.
 * Returns up to 10 matching results with full resident info.
 *
 * Strategy: Search Properties where (block LIKE q OR lot LIKE q),
 * AND also any property belonging to a Resident whose full_name LIKE q.
 * We merge both result sets and deduplicate.
 */
const searchProperties = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    // Clean query: remove standalone 'block' and 'lot' keywords, and commas
    const cleanQuery = q.toLowerCase()
      .replace(/\bblock\b/g, '')
      .replace(/\blot\b/g, '')
      .replace(/,/g, '')
      .trim();

    const terms = cleanQuery.split(/\s+/).filter(Boolean);

    if (terms.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Search by block/lot directly
    const byProperty = await Property.findAll({
      limit: 10,
      where: {
        [Op.and]: terms.map(term => ({
          [Op.or]: [
            { block: term },
            { lot:   term },
          ],
        }))
      },
      include: [
        {
          model: Resident,
          attributes: ['id', 'full_name', 'contact_number'],
          required: true,
          include: [{ model: User, attributes: ['username', 'email'] }],
        },
      ],
      order: [['block', 'ASC'], ['lot', 'ASC']],
    });

    // Also search by resident name
    const byName = await Property.findAll({
      limit: 10,
      include: [
        {
          model: Resident,
          attributes: ['id', 'full_name', 'contact_number'],
          required: true,
          where: {
            [Op.and]: terms.map(term => ({
              full_name: { [Op.like]: `%${term}%` }
            }))
          },
          include: [{ model: User, attributes: ['username', 'email'] }],
        },
      ],
      order: [['block', 'ASC'], ['lot', 'ASC']],
    });

    // Merge and deduplicate by property id
    const merged = [...byProperty, ...byName];
    const seen = new Set();
    const unique = merged.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    const formatted = unique.slice(0, 10).map((prop) => ({
      property_id:    prop.id,
      block:          prop.block,
      lot:            prop.lot,
      street:         prop.street,
      phase:          prop.phase,
      resident_id:    prop.Resident?.id,
      resident_name:  prop.Resident?.full_name,
      contact_number: prop.Resident?.contact_number,
      username:       prop.Resident?.User?.username,
    }));

    return res.status(200).json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('[PROPERTY] Search error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/properties/:id
 * Returns a single property with full resident details.
 */
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await Property.findByPk(id, {
      include: [{ model: Resident, include: [User] }],
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    return res.status(200).json({ success: true, data: property });
  } catch (error) {
    console.error('[PROPERTY] Get by ID error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { searchProperties, getPropertyById };
