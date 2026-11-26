'use strict';

const { sequelize } = require('../config/database');
const User = require('./User');
const Resident = require('./Resident');
const Property = require('./Property');
const GatePass = require('./GatePass');
const ActivityLog = require('./ActivityLog');
const WalkinRequest = require('./WalkinRequest');
const Incident = require('./Incident');
const ScanDenial = require('./ScanDenial');

// ─── Associations ─────────────────────────────────────────────────────────────
// User → Resident (one-to-one)
User.hasOne(Resident, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Resident.belongsTo(User, { foreignKey: 'UserId' });

// Resident → Property (one-to-many: one resident can own multiple lots)
Resident.hasMany(Property, { foreignKey: 'ResidentId', onDelete: 'CASCADE' });
Property.belongsTo(Resident, { foreignKey: 'ResidentId' });

// Property → GatePass (one-to-many)
Property.hasMany(GatePass, { foreignKey: 'PropertyId', onDelete: 'CASCADE' });
GatePass.belongsTo(Property, { foreignKey: 'PropertyId' });

// Guard (User) who scanned a pass
User.hasMany(GatePass, { foreignKey: 'scanned_by', as: 'ScannedPasses' });
GatePass.belongsTo(User, { foreignKey: 'scanned_by', as: 'ScannedBy' });

// Activity Logs
GatePass.hasMany(ActivityLog, { foreignKey: 'GatePassId', onDelete: 'CASCADE' });
ActivityLog.belongsTo(GatePass, { foreignKey: 'GatePassId' });
User.hasMany(ActivityLog, { foreignKey: 'scanned_by', as: 'ScannedLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'scanned_by', as: 'ScannedBy' });

// Walk-in approvals
Property.hasMany(WalkinRequest, { foreignKey: 'PropertyId', onDelete: 'CASCADE' });
WalkinRequest.belongsTo(Property, { foreignKey: 'PropertyId' });
WalkinRequest.belongsTo(User, { foreignKey: 'requested_by', as: 'RequestedBy' });
WalkinRequest.belongsTo(GatePass, { foreignKey: 'GatePassId' });

// Incidents
Incident.belongsTo(User, { foreignKey: 'reported_by', as: 'ReportedBy' });
Incident.belongsTo(User, { foreignKey: 'resolved_by', as: 'ResolvedBy' });

// Denied scans
ScanDenial.belongsTo(User, { foreignKey: 'scanned_by', as: 'ScannedBy' });
ScanDenial.belongsTo(GatePass, { foreignKey: 'GatePassId' });

module.exports = { sequelize, User, Resident, Property, GatePass, ActivityLog, WalkinRequest, Incident, ScanDenial };
