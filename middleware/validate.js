/**
 * Validation Middleware
 * Input validation rules for all forms
 */

const { body, validationResult } = require('express-validator');

/**
 * Extract validation errors into a clean format
 */
function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(e => e.msg);
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(400).json({ success: false, errors: errorMessages });
        }
        req.session.flash = { type: 'error', message: errorMessages[0] };
        req.session.formData = req.body;
        return res.redirect('back');
    }
    next();
}

// ─── Student Registration Validation ────────────────────────────────────────
const validateStudentRegistration = [
    body('full_name')
        .trim()
        .notEmpty().withMessage('Full name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters.'),

    body('register_number')
        .trim()
        .notEmpty().withMessage('Register number is required.')
        .isLength({ min: 3, max: 20 }).withMessage('Register number must be 3–20 characters.')
        .matches(/^[A-Za-z0-9]+$/).withMessage('Register number must be alphanumeric only.'),

    body('department')
        .trim()
        .notEmpty().withMessage('Department is required.'),

    body('year_of_study')
        .notEmpty().withMessage('Year of study is required.')
        .isIn(['1', '2', '3', '4']).withMessage('Invalid year of study.'),

    body('gender')
        .notEmpty().withMessage('Gender is required.')
        .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender.'),

    body('hostel_block')
        .trim()
        .notEmpty().withMessage('Hostel block is required.'),

    body('room_number')
        .trim()
        .notEmpty().withMessage('Room number is required.'),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required.')
        .matches(/^[0-9]{10}$/).withMessage('Phone number must contain exactly 10 digits.'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required.')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must include uppercase, lowercase, number, and special character (@$!%*?&).'),

    body('confirm_password')
        .notEmpty().withMessage('Please confirm your password.')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match.');
            }
            return true;
        }),

    handleValidation
];

// ─── Student Login Validation ────────────────────────────────────────────────
const validateStudentLogin = [
    body('credential')
        .trim()
        .notEmpty().withMessage('Register number or email is required.'),

    body('password')
        .notEmpty().withMessage('Password is required.'),

    handleValidation
];

// ─── Admin Login Validation ──────────────────────────────────────────────────
const validateAdminLogin = [
    body('credential')
        .trim()
        .notEmpty().withMessage('Username or email is required.'),

    body('password')
        .notEmpty().withMessage('Password is required.'),

    handleValidation
];

// ─── Complaint Submission Validation ────────────────────────────────────────
const validateComplaint = [
    body('title')
        .trim()
        .notEmpty().withMessage('Complaint title is required.')
        .isLength({ min: 5, max: 200 }).withMessage('Title must be 5–200 characters.'),

    body('category')
        .notEmpty().withMessage('Category is required.')
        .isIn(['Electrical', 'Plumbing', 'Internet/WiFi', 'Furniture',
               'Cleaning', 'Water Supply', 'Mess/Food', 'Security', 'Others'])
        .withMessage('Invalid category.'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required.')
        .isLength({ min: 20 }).withMessage('Description must be at least 20 characters.'),

    body('hostel_block')
        .trim()
        .notEmpty().withMessage('Hostel block is required.'),

    body('room_number')
        .trim()
        .notEmpty().withMessage('Room number is required.'),

    body('priority')
        .notEmpty().withMessage('Priority is required.')
        .isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority.'),

    handleValidation
];

// ─── Profile Update Validation ───────────────────────────────────────────────
const validateProfileUpdate = [
    body('full_name')
        .trim()
        .notEmpty().withMessage('Full name is required.')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters.'),

    body('phone')
        .trim()
        .notEmpty().withMessage('Phone number is required.')
        .matches(/^[0-9]{10}$/).withMessage('Phone number must contain exactly 10 digits.'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required.')
        .isEmail().withMessage('Please enter a valid email address.')
        .normalizeEmail(),

    handleValidation
];

// ─── Change Password Validation ──────────────────────────────────────────────
const validateChangePassword = [
    body('current_password')
        .notEmpty().withMessage('Current password is required.'),

    body('new_password')
        .notEmpty().withMessage('New password is required.')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must include uppercase, lowercase, number, and special character.'),

    body('confirm_new_password')
        .notEmpty().withMessage('Please confirm your new password.')
        .custom((value, { req }) => {
            if (value !== req.body.new_password) {
                throw new Error('New passwords do not match.');
            }
            return true;
        }),

    handleValidation
];

// ─── Admin Complaint Update Validation ──────────────────────────────────────
const validateComplaintUpdate = [
    body('status')
        .notEmpty().withMessage('Status is required.')
        .isIn(['Pending', 'In Progress', 'Resolved', 'Rejected'])
        .withMessage('Invalid status.'),

    body('priority')
        .notEmpty().withMessage('Priority is required.')
        .isIn(['Low', 'Medium', 'High', 'Critical'])
        .withMessage('Invalid priority.'),

    handleValidation
];

module.exports = {
    validateStudentRegistration,
    validateStudentLogin,
    validateAdminLogin,
    validateComplaint,
    validateProfileUpdate,
    validateChangePassword,
    validateComplaintUpdate,
    handleValidation
};
