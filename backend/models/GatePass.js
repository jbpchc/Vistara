'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GatePass = sequelize.define('GatePass', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  PropertyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'properties', key: 'id' },
    onDelete: 'CASCADE',
  },
  guest_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  expected_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  pass_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    unique: true,
  },
  qr_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Encoded payload embedded in QR code',
  },
  status: {
    type: DataTypes.ENUM('active', 'checked_in', 'used', 'expired'),
    defaultValue: 'active',
    allowNull: false,
  },
  scanned_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  scanned_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'Guard user ID who scanned in',
  },
  exited_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when visitor exited the subdivision',
  },
  exited_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    comment: 'Guard user ID who logged the exit',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Free-form guard notes (true notes, not encoded data)',
  },
  purpose: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Purpose of visit (e.g. Social Visit, Delivery)',
  },
  proof_of_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Type of ID presented by visitor (e.g. Drivers License)',
  },
  plate_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Vehicle plate number',
  },
  guard_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional observations by the guard at time of scan',
  },
}, {
  tableName: 'gate_passes',
  indexes: [
    { fields: ['pass_id'] },
    { fields: ['status'] },
    { fields: ['expected_date'] },
  ],
});

module.exports = GatePass;
