'use strict';

const { Sequelize } = require('sequelize');
require('dotenv').config();

// DB_DIALECT=sqlite runs the API against a local file (handy for tests without MySQL).
const sequelize = process.env.DB_DIALECT === 'sqlite'
  ? new Sequelize({ dialect: 'sqlite', storage: process.env.DB_STORAGE || ':memory:', logging: false, retry: { max: 20 }, transactionType: 'IMMEDIATE' })
  : new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    // Cloud MySQL (e.g. TiDB Cloud Starter) requires TLS. Set DB_SSL=true in production.
    dialectOptions:
      process.env.DB_SSL === 'true'
        ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } }
        : {},
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
    },
  }
  );

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connected via Sequelize.');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
