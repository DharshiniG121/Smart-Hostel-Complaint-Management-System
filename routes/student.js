/**
 * Student Routes
 * All routes require student authentication
 */

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { isStudentAuthenticated } = require('../middleware/auth');
const {
    validateComplaint,
    validateProfileUpdate,
    validateChangePassword
} = require('../middleware/validate');

// Apply auth middleware to all student routes
router.use(isStudentAuthenticated);

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Profile
router.get('/profile', studentController.getProfile);
router.post('/profile/update', validateProfileUpdate, studentController.updateProfile);
router.post('/profile/change-password', validateChangePassword, studentController.changePassword);

// Complaints
router.get('/complaints', studentController.getComplaints);
router.get('/complaints/new', studentController.getNewComplaint);
router.post('/complaints/new', validateComplaint, studentController.postNewComplaint);
router.get('/complaints/:id', studentController.getComplaintDetail);
router.post('/complaints/:id/delete', studentController.deleteComplaint);

module.exports = router;
