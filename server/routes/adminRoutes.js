const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Public route for Admin Login
router.post('/login', adminController.login);

// Protected routes (Requires Admin JWT Token)
router.get('/stats', adminController.verifyAdmin, adminController.getStats);
router.get('/registrations', adminController.verifyAdmin, adminController.getRegistrations);
router.put('/registrations/:id/status', adminController.verifyAdmin, adminController.updateStatus);
router.delete('/registrations/:id', adminController.verifyAdmin, adminController.deleteRegistration);

module.exports = router;
