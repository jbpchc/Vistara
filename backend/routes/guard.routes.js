'use strict';

const express = require('express');
const router  = express.Router();
const { getGuardStats } = require('../controllers/guard.controller');
const { verifyToken }  = require('../middleware/auth');
const { roleGuard }    = require('../middleware/roleGuard');

router.get('/stats', verifyToken, roleGuard('guard', 'admin'), getGuardStats);

module.exports = router;
