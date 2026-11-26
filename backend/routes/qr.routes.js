'use strict';

const express = require('express');
const router = express.Router();
const { generatePass, validatePass, exitPass } = require('../controllers/qr.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// POST /api/qr/generate  — residents generate passes
router.post('/generate', verifyToken, roleGuard('resident', 'admin'), generatePass);

// POST /api/qr/validate  — guards validate passes
router.post('/validate', verifyToken, roleGuard('guard', 'admin'), validatePass);

// POST /api/qr/exit — guards log visitor exits
router.post('/exit', verifyToken, roleGuard('guard', 'admin'), exitPass);

module.exports = router;
