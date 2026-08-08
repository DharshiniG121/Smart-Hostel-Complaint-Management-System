/**
 * Authentication Controller
 * Handles login, registration, logout for both students and admins
 */

const Student = require('../models/Student');
const Admin = require('../models/Admin');

// ─────────────────────────────────────────────────────────────
// STUDENT AUTH
// ─────────────────────────────────────────────────────────────

/**
 * GET /auth/student/login
 */
exports.getStudentLogin = (req, res) => {
    res.render('auth/student-login', {
        title: 'Student Login',
        formData: req.session.formData || {}
    });
    delete req.session.formData;
};

/**
 * GET /auth/student/register
 */
exports.getStudentRegister = (req, res) => {
    res.render('auth/student-register', {
        title: 'Student Registration',
        formData: req.session.formData || {}
    });
    delete req.session.formData;
};

/**
 * POST /auth/student/register
 */
exports.postStudentRegister = async (req, res) => {
    try {
        const {
            full_name, register_number, department, year_of_study,
            gender, hostel_block, room_number, phone, email, password
        } = req.body;

        // Check for duplicate register number
        const regExists = await Student.registerNumberExists(register_number);
        if (regExists) {
            req.session.flash = { type: 'error', message: 'Register number already exists.' };
            req.session.formData = req.body;
            return res.redirect('/auth/student/register');
        }

        // Check for duplicate email
        const emailExists = await Student.emailExists(email);
        if (emailExists) {
            req.session.flash = { type: 'error', message: 'Email address already registered.' };
            req.session.formData = req.body;
            return res.redirect('/auth/student/register');
        }

        // Create student
        await Student.create({
            full_name, register_number, department, year_of_study,
            gender, hostel_block, room_number, phone, email, password
        });

        req.session.flash = {
            type: 'success',
            message: 'Registration successful! You can now login.'
        };
        return res.redirect('/auth/student/login');

    } catch (error) {
        console.error('Registration error:', error);
        req.session.flash = { type: 'error', message: 'Registration failed. Please try again.' };
        req.session.formData = req.body;
        return res.redirect('/auth/student/register');
    }
};

/**
 * POST /auth/student/login
 */
exports.postStudentLogin = async (req, res) => {
    try {
        const { credential, password } = req.body;

        const student = await Student.findByCredential(credential);
        if (!student) {
            req.session.flash = { type: 'error', message: 'Invalid register number/email or password.' };
            req.session.formData = { credential };
            return res.redirect('/auth/student/login');
        }

        const isValid = await Student.verifyPassword(password, student.password);
        if (!isValid) {
            req.session.flash = { type: 'error', message: 'Invalid register number/email or password.' };
            req.session.formData = { credential };
            return res.redirect('/auth/student/login');
        }

        // Create session (never store password in session)
        req.session.student = {
            id: student.id,
            full_name: student.full_name,
            register_number: student.register_number,
            email: student.email,
            department: student.department,
            year_of_study: student.year_of_study,
            gender: student.gender,
            hostel_block: student.hostel_block,
            room_number: student.room_number,
            phone: student.phone
        };

        await Student.updateLastLogin(student.id);

        req.session.flash = { type: 'success', message: `Welcome back, ${student.full_name}!` };

        const returnTo = req.session.returnTo || '/student/dashboard';
        delete req.session.returnTo;
        return res.redirect(returnTo);

    } catch (error) {
        console.error('Student login error:', error);
        req.session.flash = { type: 'error', message: 'Login failed. Please try again.' };
        return res.redirect('/auth/student/login');
    }
};

/**
 * POST /auth/student/logout
 */
exports.studentLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Session destroy error:', err);
        res.clearCookie('hostel.sid');
        res.redirect('/auth/student/login');
    });
};

// ─────────────────────────────────────────────────────────────
// ADMIN AUTH
// ─────────────────────────────────────────────────────────────

/**
 * GET /auth/admin/login
 */
exports.getAdminLogin = (req, res) => {
    res.render('auth/admin-login', {
        title: 'Admin Login',
        formData: req.session.formData || {}
    });
    delete req.session.formData;
};

/**
 * POST /auth/admin/login
 */
exports.postAdminLogin = async (req, res) => {
    try {
        const { credential, password } = req.body;

        const admin = await Admin.findByCredential(credential);
        if (!admin) {
            req.session.flash = { type: 'error', message: 'Invalid credentials.' };
            req.session.formData = { credential };
            return res.redirect('/auth/admin/login');
        }

        const isValid = await Admin.verifyPassword(password, admin.password);
        if (!isValid) {
            req.session.flash = { type: 'error', message: 'Invalid credentials.' };
            req.session.formData = { credential };
            return res.redirect('/auth/admin/login');
        }

        // Create admin session
        req.session.admin = {
            id: admin.id,
            full_name: admin.full_name,
            email: admin.email,
            username: admin.username,
            role: admin.role
        };

        await Admin.updateLastLogin(admin.id);

        req.session.flash = { type: 'success', message: `Welcome, ${admin.full_name}!` };

        const returnTo = req.session.returnTo || '/admin/dashboard';
        delete req.session.returnTo;
        return res.redirect(returnTo);

    } catch (error) {
        console.error('Admin login error:', error);
        req.session.flash = { type: 'error', message: 'Login failed. Please try again.' };
        return res.redirect('/auth/admin/login');
    }
};

/**
 * POST /auth/admin/logout
 */
exports.adminLogout = (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Session destroy error:', err);
        res.clearCookie('hostel.sid');
        res.redirect('/auth/admin/login');
    });
};
