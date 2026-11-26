'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * A visitor without a pass, waiting at the gate for the resident to approve.
 * Lifecycle: pending → approved | denied | expired → (approved) admitted
 */
const WalkinRequest = sequelize.define('WalkinRequest', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  PropertyId: { type: DataTypes.INTEGER, allowNull: false },
  guest_name: { type: DataTypes.STRING(200), allowNull: false },
  purpose: { type: DataTypes.STRING(200), allowNull: true },
  vehicle_plate: { type: DataTypes.STRING(50), allowNull: true },
  visitor_id_type: { type: DataTypes.STRING(100), allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'approved', 'denied', 'expired', 'admitted'), allowNull: false, defaultValue: 'pending' },
  window_sec: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 180 },
  requested_by: { type: DataTypes.INTEGER, allowNull: true },
  decided_by: { type: DataTypes.INTEGER, allowNull: true },
  decided_at: { type: DataTypes.DATE, allowNull: true },
  decision_note: { type: DataTypes.STRING(255), allowNull: true },
  GatePassId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'walkin_requests',
  indexes: [{ fields: ['status'] }, { fields: ['PropertyId'] }],
});

module.exports = WalkinRequest;
