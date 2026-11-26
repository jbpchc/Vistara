'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/** Incident reports from guards, including SOS alerts (type = 'sos'). */
const Incident = sequelize.define('Incident', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  code: { type: DataTypes.STRING(30), allowNull: true },
  type: { type: DataTypes.ENUM('sos', 'security', 'facility', 'visitor', 'other'), allowNull: false, defaultValue: 'other' },
  severity: { type: DataTypes.ENUM('critical', 'high', 'normal'), allowNull: false, defaultValue: 'normal' },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  location: { type: DataTypes.STRING(120), allowNull: true, defaultValue: 'Main Gate' },
  status: { type: DataTypes.ENUM('open', 'resolved'), allowNull: false, defaultValue: 'open' },
  reported_by: { type: DataTypes.INTEGER, allowNull: true },
  resolved_by: { type: DataTypes.INTEGER, allowNull: true },
  resolved_at: { type: DataTypes.DATE, allowNull: true },
  resolution: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'incidents',
  indexes: [{ fields: ['status'] }, { fields: ['severity'] }],
});

module.exports = Incident;
