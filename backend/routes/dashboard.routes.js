'use strict';

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const dashboard = require('../controllers/dashboard.controller');
const walkin = require('../controllers/walkin.controller');
const incident = require('../controllers/incident.controller');

// Dashboards (one composite feed per screen)
router.get('/dashboard/admin', verifyToken, roleGuard('admin'), dashboard.admin);
router.get('/dashboard/resident', verifyToken, roleGuard('resident'), dashboard.resident);
router.get('/dashboard/guard', verifyToken, roleGuard('guard', 'admin'), dashboard.guard);

// Walk-in approvals
router.post('/walkins', verifyToken, roleGuard('guard', 'admin'), walkin.createWalkin);
router.get('/walkins/mine', verifyToken, roleGuard('resident'), walkin.myPending);
router.get('/walkins/:id', verifyToken, roleGuard('guard', 'admin', 'resident'), walkin.getWalkin);
router.post('/walkins/:id/decision', verifyToken, roleGuard('resident'), walkin.decide);
router.post('/walkins/:id/admit', verifyToken, roleGuard('guard', 'admin'), walkin.admit);

// Incidents & SOS
router.post('/incidents/sos', verifyToken, roleGuard('guard', 'admin'), incident.sos);
router.post('/incidents', verifyToken, roleGuard('guard', 'admin'), incident.report);
router.get('/incidents', verifyToken, roleGuard('guard', 'admin'), incident.list);
router.patch('/incidents/:id/resolve', verifyToken, roleGuard('admin'), incident.resolve);

module.exports = router;
