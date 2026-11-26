'use strict';

const express = require('express');
const router = express.Router();
const { getLogs, createManualEntry, getInsideLogs, getFeedLogs } = require('../controllers/logs.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// GET /api/logs/inside — get all visitors currently inside
router.get('/inside', verifyToken, roleGuard('guard', 'admin'), getInsideLogs);

// GET /api/logs/feed — get activity logs for feed
router.get('/feed', verifyToken, roleGuard('guard', 'admin'), getFeedLogs);

// GET /api/logs  — guards and admins can view
router.get('/', verifyToken, roleGuard('guard', 'admin'), getLogs);

// POST /api/logs/manual  — guard manually logs a visitor
router.post('/manual', verifyToken, roleGuard('guard', 'admin'), createManualEntry);

module.exports = router;
