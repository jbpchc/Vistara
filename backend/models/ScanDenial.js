'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/** A refused scan at the gate (expired, used, wrong date, not found). Shown to the HOA as "denied scans". */
const ScanDenial = sequelize.define('ScanDenial', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reason: { type: DataTypes.STRING(40), allowNull: false },
  guest_name: { type: DataTypes.STRING(200), allowNull: true },
  GatePassId: { type: DataTypes.INTEGER, allowNull: true },
  scanned_by: { type: DataTypes.INTEGER, allowNull: true },
  scanned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'scan_denials',
  indexes: [{ fields: ['scanned_at'] }],
});

module.exports = ScanDenial;
