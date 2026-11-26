'use strict';

const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/me  — requires valid token
router.get('/me', verifyToken, getMe);

module.exports = router;
