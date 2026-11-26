'use strict';

const { User, Resident, Property, GatePass, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// ─── Stats & Charts ─────────────────────────────────────────────────────────

const getStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalResidents, activeGuards, entriesToday, totalProperties] = await Promise.all([
      User.count({ where: { role: 'resident', is_active: true } }),
      User.count({ where: { role: 'guard',    is_active: true } }),
      GatePass.count({ where: { scanned_at: { [Op.gte]: todayStart } } }),
      Property.count(),
    ]);

    return res.status(200).json({
      success: true,
      data: { total_residents: totalResidents, active_guards: activeGuards, entries_today: entriesToday, total_properties: totalProperties },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getChartData = async (req, res) => {
  try {
    // Generate last 7 days visitor trends
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end   = new Date(d.setHours(23, 59, 59, 999));
      
      const count = await GatePass.count({
        where: {
          scanned_at: { [Op.between]: [start, end] },
          status: { [Op.in]: ['used', 'checked_in'] }
        }
      });
      data.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        visitors: count
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[ADMIN] Chart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch chart data' });
  }
};

// ─── Users CRUD ─────────────────────────────────────────────────────────────

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'is_active', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
    if (existing) return res.status(400).json({ success: false, message: 'Username or Email already exists.' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password_hash, role });
    
    return res.status(201).json({ success: true, message: 'User created', data: { id: user.id } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active, password } = req.body;
    const updates = { role, is_active };
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }
    await User.update(updates, { where: { id } });
    return res.status(200).json({ success: true, message: 'User updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    return res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

// ─── Residents CRUD ─────────────────────────────────────────────────────────

const getResidents = async (req, res) => {
  try {
    const residents = await Resident.findAll({
      include: [
        { model: User, attributes: ['id', 'username', 'email', 'is_active'] },
        { model: Property, attributes: ['id', 'block', 'lot', 'street'] }
      ],
      order: [['full_name', 'ASC']]
    });
    return res.status(200).json({ success: true, data: residents });
  } catch (error) {
    console.error('[ADMIN] getResidents Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch residents' });
  }
};

const createResident = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { username, email, password, full_name, contact_number } = req.body;

    let userId = null;

    // Only create a User account if username and email are provided (app access enabled)
    if (username && email) {
      const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
      if (existing) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Username or Email already exists.' });
      }

      if (!password) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Password is required to enable app portal access.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password_hash, role: 'resident' }, { transaction });
      userId = user.id;
    }

    const resident = await Resident.create({ UserId: userId, full_name, contact_number }, { transaction });

    await transaction.commit();
    return res.status(201).json({ success: true, message: 'Resident created successfully', data: resident });
  } catch (error) {
    await transaction.rollback();
    console.error('[ADMIN] createResident Error:', error);
    const msg = error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError'
      ? error.errors[0].message
      : 'Failed to create resident';
    return res.status(500).json({ success: false, message: msg });
  }
};

const updateResident = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { full_name, contact_number, username, email, password, is_active } = req.body;

    const resident = await Resident.findByPk(id, { include: [User] });
    if (!resident) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Resident not found' });
    }

    await resident.update({ full_name, contact_number }, { transaction });
    
    if (resident.User) {
      // Check if username changed and is taken
      if (username && username !== resident.User.username) {
        const existing = await User.findOne({ where: { username } });
        if (existing) {
          await transaction.rollback();
          return res.status(400).json({ success: false, message: 'Username is already taken.' });
        }
      }

      const userUpdates = { username, email, is_active };
      if (password) {
        userUpdates.password_hash = await bcrypt.hash(password, 10);
      }
      await resident.User.update(userUpdates, { transaction });
    } else if (username && email) {
      // If they had no User account before, but we provide credentials now, create one!
      const existing = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
      if (existing) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Username or Email already exists.' });
      }

      if (!password) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'Password is required to create a login account.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password_hash, role: 'resident' }, { transaction });
      await resident.update({ UserId: user.id }, { transaction });
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: 'Resident updated successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('[ADMIN] updateResident Error:', error);
    const msg = error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError'
      ? error.errors[0].message
      : 'Failed to update resident';
    return res.status(500).json({ success: false, message: msg });
  }
};

const deleteResident = async (req, res) => {
  try {
    const { id } = req.params;
    const resident = await Resident.findByPk(id);
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });

    // Since Resident belongsTo User with ON DELETE CASCADE, destroying the User deletes the Resident too
    // OR we just destroy the user directly
    await User.destroy({ where: { id: resident.UserId } });
    return res.status(200).json({ success: true, message: 'Resident deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete resident' });
  }
};

// ─── Properties CRUD ────────────────────────────────────────────────────────

const getProperties = async (req, res) => {
  try {
    const properties = await Property.findAll({
      include: [{ model: Resident, include: [{ model: User, attributes: ['username', 'email'] }] }],
      order: [['block', 'ASC'], ['lot', 'ASC']]
    });
    return res.status(200).json({ success: true, data: properties });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
};

const createProperty = async (req, res) => {
  try {
    const { ResidentId, block, lot, street } = req.body;
    const prop = await Property.create({ ResidentId, block, lot, street });
    return res.status(201).json({ success: true, message: 'Property created', data: prop });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create property' });
  }
};

const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { block, lot, street } = req.body;
    await Property.update({ block, lot, street }, { where: { id } });
    return res.status(200).json({ success: true, message: 'Property updated' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update property' });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    await Property.destroy({ where: { id } });
    return res.status(200).json({ success: true, message: 'Property deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete property' });
  }
};

module.exports = {
  getStats, getChartData,
  getUsers, createUser, updateUser, deleteUser,
  getResidents, createResident, updateResident, deleteResident,
  getProperties, createProperty, updateProperty, deleteProperty
};
