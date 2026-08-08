/**
 * Admin Controller
 * Dashboard, complaint management, student management, reports
 */

const Admin = require('../models/Admin');
const Student = require('../models/Student');
const Complaint = require('../models/Complaint');

/**
 * GET /admin/dashboard
 */
exports.getDashboard = async (req, res) => {
    try {
        const stats = await Complaint.getAdminStats();
        const studentCount = await Student.getCount();
        const recentComplaints = await Complaint.getLatest(8);
        const byCategory = await Complaint.getByCategory();
        const byStatus = await Complaint.getByStatus();
        const monthlyTrend = await Complaint.getMonthlyTrend();

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: { ...stats, students: studentCount },
            recentComplaints,
            byCategory: JSON.stringify(byCategory),
            byStatus: JSON.stringify(byStatus),
            monthlyTrend: JSON.stringify(monthlyTrend)
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load dashboard: ' + error.message };
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: { students: 0, total: 0, pending: 0, in_progress: 0, resolved: 0, high_priority: 0, today: 0 },
            recentComplaints: [],
            byCategory: '[]',
            byStatus: '[]',
            monthlyTrend: '[]'
        });
    }
};

// ─────────────────────────────────────────────────────────────
// COMPLAINT MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * GET /admin/complaints
 */
exports.getComplaints = async (req, res) => {
    try {
        const { search = '', status = '', category = '', priority = '', hostel_block = '', page = 1 } = req.query;
        const limit = 10;

        const { rows: complaints, total } = await Complaint.findAll({
            search, status, category, priority, hostel_block,
            page: parseInt(page), limit
        });

        const totalPages = Math.ceil(total / limit);

        res.render('admin/complaints', {
            title: 'Complaint Management',
            complaints,
            filters: { search, status, category, priority, hostel_block },
            currentPage: parseInt(page),
            totalPages,
            total
        });
    } catch (error) {
        console.error('Admin complaints error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load complaints.' };
        res.redirect('/admin/dashboard');
    }
};

/**
 * GET /admin/complaints/:id
 */
exports.getComplaintDetail = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            req.session.flash = { type: 'error', message: 'Complaint not found.' };
            return res.redirect('/admin/complaints');
        }

        const history = await Complaint.getStatusHistory(req.params.id);
        const admins = await Admin.findAll();

        res.render('admin/complaint-detail', {
            title: 'Complaint Details',
            complaint,
            history,
            admins
        });
    } catch (error) {
        console.error('Admin complaint detail error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load complaint.' };
        res.redirect('/admin/complaints');
    }
};

/**
 * POST /admin/complaints/:id/update
 */
exports.updateComplaint = async (req, res) => {
    try {
        const { status, priority, admin_remarks, assigned_to } = req.body;
        const adminId = req.session.admin.id;

        await Complaint.updateStatus(req.params.id, {
            status, priority, admin_remarks, assigned_to, adminId
        });

        req.session.flash = { type: 'success', message: 'Complaint updated successfully.' };
        return res.redirect(`/admin/complaints/${req.params.id}`);

    } catch (error) {
        console.error('Update complaint error:', error);
        req.session.flash = { type: 'error', message: 'Failed to update complaint.' };
        return res.redirect(`/admin/complaints/${req.params.id}`);
    }
};

/**
 * POST /admin/complaints/:id/delete
 */
exports.deleteComplaint = async (req, res) => {
    try {
        await Complaint.delete(req.params.id);
        req.session.flash = { type: 'success', message: 'Complaint deleted successfully.' };
        return res.redirect('/admin/complaints');
    } catch (error) {
        console.error('Admin delete complaint error:', error);
        req.session.flash = { type: 'error', message: 'Failed to delete complaint.' };
        return res.redirect('/admin/complaints');
    }
};

// ─────────────────────────────────────────────────────────────
// STUDENT MANAGEMENT
// ─────────────────────────────────────────────────────────────

/**
 * GET /admin/students
 */
exports.getStudents = async (req, res) => {
    try {
        const { search = '', page = 1 } = req.query;
        const limit = 10;

        const { rows: students, total } = await Student.findAll({
            search, page: parseInt(page), limit
        });

        const totalPages = Math.ceil(total / limit);

        res.render('admin/students', {
            title: 'Student Management',
            students,
            search,
            currentPage: parseInt(page),
            totalPages,
            total
        });
    } catch (error) {
        console.error('Admin students error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load students.' };
        res.redirect('/admin/dashboard');
    }
};

/**
 * GET /admin/students/:id
 */
exports.getStudentDetail = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            req.session.flash = { type: 'error', message: 'Student not found.' };
            return res.redirect('/admin/students');
        }

        const complaints = await Complaint.findByStudentId(req.params.id);

        res.render('admin/student-detail', {
            title: 'Student Details',
            student,
            complaints
        });
    } catch (error) {
        console.error('Admin student detail error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load student details.' };
        res.redirect('/admin/students');
    }
};

/**
 * POST /admin/students/:id/delete
 */
exports.deleteStudent = async (req, res) => {
    try {
        await Student.delete(req.params.id);
        req.session.flash = { type: 'success', message: 'Student removed successfully.' };
        return res.redirect('/admin/students');
    } catch (error) {
        console.error('Admin delete student error:', error);
        req.session.flash = { type: 'error', message: 'Failed to remove student.' };
        return res.redirect('/admin/students');
    }
};

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

/**
 * GET /admin/reports
 */
exports.getReports = async (req, res) => {
    try {
        const { type = 'all', month = '', year = '' } = req.query;

        const complaints = await Complaint.getReportData({
            type,
            month: month ? parseInt(month) : null,
            year: year ? parseInt(year) : null
        });

        const stats = await Complaint.getAdminStats();
        const byCategory = await Complaint.getByCategory();

        res.render('admin/reports', {
            title: 'Reports',
            complaints,
            stats,
            byCategory,
            filters: { type, month, year }
        });
    } catch (error) {
        console.error('Reports error:', error);
        req.session.flash = { type: 'error', message: 'Failed to generate report.' };
        res.redirect('/admin/dashboard');
    }
};

// ─────────────────────────────────────────────────────────────
// ADMIN PROFILE & PASSWORD
// ─────────────────────────────────────────────────────────────

/**
 * GET /admin/profile
 */
exports.getProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.admin.id);
        res.render('admin/profile', {
            title: 'Admin Profile',
            admin
        });
    } catch (error) {
        console.error('Admin profile error:', error);
        res.redirect('/admin/dashboard');
    }
};

/**
 * POST /admin/profile/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const adminId = req.session.admin.id;
        const { current_password, new_password } = req.body;

        const admin = await Admin.findById(adminId);
        const isValid = await Admin.verifyPassword(current_password, admin.password);
        if (!isValid) {
            req.session.flash = { type: 'error', message: 'Current password is incorrect.' };
            return res.redirect('/admin/profile');
        }

        await Admin.changePassword(adminId, new_password);
        req.session.flash = { type: 'success', message: 'Password changed successfully.' };
        return res.redirect('/admin/profile');

    } catch (error) {
        console.error('Admin change password error:', error);
        req.session.flash = { type: 'error', message: 'Failed to change password.' };
        return res.redirect('/admin/profile');
    }
};

// ─────────────────────────────────────────────────────────────
// API ENDPOINTS (for chart data refresh)
// ─────────────────────────────────────────────────────────────

/**
 * GET /admin/api/stats
 */
exports.getApiStats = async (req, res) => {
    try {
        const stats = await Complaint.getAdminStats();
        const studentCount = await Student.getCount();
        res.json({ success: true, data: { ...stats, students: studentCount } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};

/**
 * GET /admin/api/chart-data
 */
exports.getChartData = async (req, res) => {
    try {
        const byCategory = await Complaint.getByCategory();
        const byStatus = await Complaint.getByStatus();
        const monthlyTrend = await Complaint.getMonthlyTrend();
        res.json({ success: true, data: { byCategory, byStatus, monthlyTrend } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch chart data' });
    }
};
