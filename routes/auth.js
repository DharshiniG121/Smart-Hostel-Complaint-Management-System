/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isStudentGuest, isAdminGuest } = require('../middleware/auth');
const {
    validateStudentRegistration,
    validateStudentLogin,
    validateAdminLogin
} = require('../middleware/validate');

// ─── Student Auth ────────────────────────────────────────────
router.get('/student/login', isStudentGuest, authController.getStudentLogin);
router.get('/student/register', isStudentGuest, authController.getStudentRegister);
router.post('/student/register', isStudentGuest, validateStudentRegistration, authController.postStudentRegister);
router.post('/student/login', isStudentGuest, validateStudentLogin, authController.postStudentLogin);
router.post('/student/logout', authController.studentLogout);

// ─── Admin Auth ──────────────────────────────────────────────
router.get('/admin/login', isAdminGuest, authController.getAdminLogin);
router.post('/admin/login', isAdminGuest, validateAdminLogin, authController.postAdminLogin);
router.post('/admin/logout', authController.adminLogout);

module.exports = router;
