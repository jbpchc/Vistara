'use strict';

const express = require('express');
const router = express.Router();
const { searchProperties, getPropertyById } = require('../controllers/property.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// GET /api/properties/search?q=<query>  — guard, admin, and resident can search
router.get('/search', verifyToken, roleGuard('admin', 'guard', 'resident'), searchProperties);

// GET /api/properties/:id
router.get('/:id', verifyToken, roleGuard('admin', 'guard', 'resident'), getPropertyById);

module.exports = router;
