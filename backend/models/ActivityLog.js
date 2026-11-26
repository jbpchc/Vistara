'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  GatePassId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'gate_passes', key: 'id' },
    onDelete: 'CASCADE',
  },
  action: {
    type: DataTypes.ENUM('entry', 'exit'),
    allowNull: false,
  },
  scanned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  scanned_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  indexes: [
    { fields: ['GatePassId'] },
    { fields: ['action'] },
    { fields: ['scanned_at'] },
  ],
});

module.exports = ActivityLog;
