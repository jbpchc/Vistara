'use strict';

const express = require('express');
const router = express.Router();
const { 
  getStats, getChartData,
  getUsers, createUser, updateUser, deleteUser,
  getResidents, createResident, updateResident, deleteResident,
  getProperties, createProperty, updateProperty, deleteProperty
} = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// All routes here are protected by admin role
router.use(verifyToken, roleGuard('admin'));

// Stats & Charts
router.get('/stats', getStats);
router.get('/chart-data', getChartData);

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Residents
router.get('/residents', getResidents);
router.post('/residents', createResident);
router.put('/residents/:id', updateResident);
router.delete('/residents/:id', deleteResident);

// Properties
router.get('/properties', getProperties);
router.post('/properties', createProperty);
router.put('/properties/:id', updateProperty);
router.delete('/properties/:id', deleteProperty);

module.exports = router;
