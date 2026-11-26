'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Property = sequelize.define('Property', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ResidentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'residents', key: 'id' },
    onDelete: 'CASCADE',
  },
  block: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true },
  },
  lot: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true },
  },
  street: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  phase: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'properties',
  indexes: [
    { fields: ['block', 'lot'] },
  ],
});

module.exports = Property;
