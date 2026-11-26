'use strict';

const express = require('express');
const router = express.Router();
const { getMyPasses, updatePass, cancelPass } = require('../controllers/passes.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// GET /api/passes/my  — resident views their own passes
router.get('/my', verifyToken, roleGuard('resident', 'admin'), getMyPasses);

// PUT /api/passes/:id — resident updates their active pass
router.put('/:id', verifyToken, roleGuard('resident', 'admin'), updatePass);

// DELETE /api/passes/:id — resident cancels active pass
router.delete('/:id', verifyToken, roleGuard('resident', 'admin'), cancelPass);

module.exports = router;
