/**
 * Student Controller
 * Dashboard, Profile, Complaints for students
 */

const Student = require('../models/Student');
const Complaint = require('../models/Complaint');

/**
 * GET /student/dashboard
 */
exports.getDashboard = async (req, res) => {
    try {
        const studentId = req.session.student.id;
        const stats = await Complaint.getStudentStats(studentId);
        const latestComplaint = await Complaint.getLatestByStudent(studentId);

        res.render('student/dashboard', {
            title: 'Student Dashboard',
            stats,
            latestComplaint
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load dashboard.' };
        res.redirect('/auth/student/login');
    }
};

/**
 * GET /student/profile
 */
exports.getProfile = async (req, res) => {
    try {
        const student = await Student.findById(req.session.student.id);
        res.render('student/profile', {
            title: 'My Profile',
            student,
            formData: req.session.formData || null
        });
        delete req.session.formData;
    } catch (error) {
        console.error('Profile error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load profile.' };
        res.redirect('/student/dashboard');
    }
};

/**
 * POST /student/profile/update
 */
exports.updateProfile = async (req, res) => {
    try {
        const studentId = req.session.student.id;
        const { full_name, department, year_of_study, gender, hostel_block, room_number, phone, email } = req.body;

        // Check email uniqueness (excluding self)
        const emailExists = await Student.emailExists(email, studentId);
        if (emailExists) {
            req.session.flash = { type: 'error', message: 'This email is already in use by another account.' };
            req.session.formData = req.body;
            return res.redirect('/student/profile');
        }

        await Student.updateProfile(studentId, {
            full_name, department, year_of_study, gender,
            hostel_block, room_number, phone, email
        });

        // Update session data
        req.session.student = {
            ...req.session.student,
            full_name, department, year_of_study, gender,
            hostel_block, room_number, phone, email
        };

        req.session.flash = { type: 'success', message: 'Profile updated successfully.' };
        return res.redirect('/student/profile');

    } catch (error) {
        console.error('Profile update error:', error);
        req.session.flash = { type: 'error', message: 'Failed to update profile.' };
        return res.redirect('/student/profile');
    }
};

/**
 * POST /student/profile/change-password
 */
exports.changePassword = async (req, res) => {
    try {
        const studentId = req.session.student.id;
        const { current_password, new_password } = req.body;

        const student = await Student.findById(studentId);
        const isValid = await Student.verifyPassword(current_password, student.password);
        if (!isValid) {
            req.session.flash = { type: 'error', message: 'Current password is incorrect.' };
            return res.redirect('/student/profile');
        }

        await Student.changePassword(studentId, new_password);
        req.session.flash = { type: 'success', message: 'Password changed successfully.' };
        return res.redirect('/student/profile');

    } catch (error) {
        console.error('Change password error:', error);
        req.session.flash = { type: 'error', message: 'Failed to change password.' };
        return res.redirect('/student/profile');
    }
};

/**
 * GET /student/complaints
 */
exports.getComplaints = async (req, res) => {
    try {
        const studentId = req.session.student.id;
        const { search = '', status = '', page = 1 } = req.query;
        const limit = 10;

        const { rows: complaints, total } = await Complaint.findByStudent(studentId, {
            search, status, page: parseInt(page), limit
        });

        const totalPages = Math.ceil(total / limit);

        res.render('student/complaints', {
            title: 'My Complaints',
            complaints,
            search,
            status,
            currentPage: parseInt(page),
            totalPages,
            total
        });
    } catch (error) {
        console.error('Complaints list error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load complaints.' };
        res.redirect('/student/dashboard');
    }
};

/**
 * GET /student/complaints/new
 */
exports.getNewComplaint = (req, res) => {
    const student = req.session.student;
    res.render('student/new-complaint', {
        title: 'Submit Complaint',
        formData: req.session.formData || {
            hostel_block: student.hostel_block,
            room_number: student.room_number
        }
    });
    delete req.session.formData;
};

/**
 * POST /student/complaints/new
 */
exports.postNewComplaint = async (req, res) => {
    try {
        const studentId = req.session.student.id;
        const { title, category, description, hostel_block, room_number, priority } = req.body;

        const { insertId, complaintId } = await Complaint.create({
            student_id: studentId,
            title, category, description,
            hostel_block, room_number, priority
        });

        req.session.flash = {
            type: 'success',
            message: `Complaint submitted successfully! Your complaint ID is ${complaintId}.`
        };
        return res.redirect('/student/complaints');

    } catch (error) {
        console.error('Create complaint error:', error);
        req.session.flash = { type: 'error', message: 'Failed to submit complaint. Please try again.' };
        req.session.formData = req.body;
        return res.redirect('/student/complaints/new');
    }
};

/**
 * GET /student/complaints/:id
 */
exports.getComplaintDetail = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint || complaint.student_id !== req.session.student.id) {
            req.session.flash = { type: 'error', message: 'Complaint not found.' };
            return res.redirect('/student/complaints');
        }

        const history = await Complaint.getStatusHistory(req.params.id);

        res.render('student/complaint-detail', {
            title: 'Complaint Details',
            complaint,
            history
        });
    } catch (error) {
        console.error('Complaint detail error:', error);
        req.session.flash = { type: 'error', message: 'Failed to load complaint.' };
        res.redirect('/student/complaints');
    }
};

/**
 * POST /student/complaints/:id/delete
 */
exports.deleteComplaint = async (req, res) => {
    try {
        const deleted = await Complaint.delete(req.params.id, req.session.student.id);
        if (!deleted) {
            req.session.flash = { type: 'error', message: 'Cannot delete this complaint. Only pending complaints can be deleted.' };
        } else {
            req.session.flash = { type: 'success', message: 'Complaint deleted successfully.' };
        }
        return res.redirect('/student/complaints');
    } catch (error) {
        console.error('Delete complaint error:', error);
        req.session.flash = { type: 'error', message: 'Failed to delete complaint.' };
        return res.redirect('/student/complaints');
    }
};
