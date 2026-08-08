/**
 * Admin Routes
 * All routes require admin authentication
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdminAuthenticated } = require('../middleware/auth');
const {
    validateComplaintUpdate,
    validateChangePassword
} = require('../middleware/validate');

// Apply auth middleware to all admin routes
router.use(isAdminAuthenticated);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Complaints
router.get('/complaints', adminController.getComplaints);
router.get('/complaints/:id', adminController.getComplaintDetail);
router.post('/complaints/:id/update', validateComplaintUpdate, adminController.updateComplaint);
router.post('/complaints/:id/delete', adminController.deleteComplaint);

// Students
router.get('/students', adminController.getStudents);
router.get('/students/:id', adminController.getStudentDetail);
router.post('/students/:id/delete', adminController.deleteStudent);

// Reports
router.get('/reports', adminController.getReports);

// Profile
router.get('/profile', adminController.getProfile);
router.post('/profile/change-password', validateChangePassword, adminController.changePassword);

// API endpoints
router.get('/api/stats', adminController.getApiStats);
router.get('/api/chart-data', adminController.getChartData);

module.exports = router;
