'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Resident = sequelize.define('Resident', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'users', key: 'id' },
    onDelete: 'SET NULL',
  },
  full_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { notEmpty: true },
  },
  contact_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  profile_photo: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'residents',
});

module.exports = Resident;
