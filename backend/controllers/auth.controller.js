'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Resident, Property } = require('../models');

/**
 * POST /api/auth/login
 * Body: { username, password }
 * Returns: { token, user: { id, username, role, full_name } }
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    // Find user with their Resident profile
    const user = await User.findOne({
      where: { username, is_active: true },
      include: [
        {
          model: Resident,
          attributes: ['id', 'full_name', 'contact_number'],
          include: [
            {
              model: Property,
              attributes: ['id', 'block', 'lot', 'street', 'phase'],
              separate: true,  // Required for limit to work with hasMany
              limit: 1,
              order: [['id', 'ASC']],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // Build the primary_property object the frontend CreatePassForm depends on
    const primaryProperty = user.Resident?.Properties?.[0] ?? null;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.Resident?.full_name || null,
        primary_property: primaryProperty
          ? {
              id:     primaryProperty.id,
              block:  primaryProperty.block,
              lot:    primaryProperty.lot,
              street: primaryProperty.street,
              phase:  primaryProperty.phase,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/auth/me
 * Returns the current user's profile from JWT payload.
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Resident, include: [Property] }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('[AUTH] Get me error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { login, getMe };
