/**
 * Complaint Model
 * Handles all database operations related to complaints
 */

const db = require('../config/database');

const Complaint = {
    /**
     * Generate unique complaint ID
     * Format: COMP-YYYYMM-XXXXX
     */
    async generateComplaintId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `COMP-${year}${month}-`;

        // Get count of complaints this month
        const [[{ count }]] = await db.query(
            `SELECT COUNT(*) as count FROM complaints 
             WHERE complaint_id LIKE ?`,
            [`${prefix}%`]
        );

        const sequence = String(parseInt(count) + 1).padStart(5, '0');
        return `${prefix}${sequence}`;
    },

    /**
     * Create a new complaint
     */
    async create(data) {
        const complaintId = await this.generateComplaintId();

        const [result] = await db.query(
            `INSERT INTO complaints 
             (complaint_id, student_id, title, category, description, 
              hostel_block, room_number, priority, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
            [
                complaintId, data.student_id, data.title, data.category,
                data.description, data.hostel_block, data.room_number,
                data.priority || 'Medium'
            ]
        );

        // Record initial status in history
        await db.query(
            `INSERT INTO complaint_status_history 
             (complaint_id, old_status, new_status, changed_by_type, changed_by_id, remarks)
             VALUES (?, NULL, 'Pending', 'student', ?, 'Complaint submitted')`,
            [result.insertId, data.student_id]
        );

        return { insertId: result.insertId, complaintId };
    },

    /**
     * Find complaint by ID (with student info)
     */
    async findById(id) {
        const [rows] = await db.query(
            `SELECT c.*, s.full_name as student_name, s.register_number,
                    s.department, s.email as student_email, s.phone as student_phone,
                    a.full_name as assigned_admin_name
             FROM complaints c
             JOIN students s ON c.student_id = s.id
             LEFT JOIN admins a ON c.assigned_to = a.id
             WHERE c.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Find complaint by complaint_id string
     */
    async findByComplaintId(complaintId) {
        const [rows] = await db.query(
            `SELECT c.*, s.full_name as student_name, s.register_number
             FROM complaints c
             JOIN students s ON c.student_id = s.id
             WHERE c.complaint_id = ?`,
            [complaintId]
        );
        return rows[0] || null;
    },

    /**
     * Get all complaints for a student
     */
    async findByStudent(studentId, { search = '', status = '', page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        const searchParam = `%${search}%`;

        let whereClause = 'WHERE c.student_id = ?';
        const params = [studentId];

        if (status) {
            whereClause += ' AND c.status = ?';
            params.push(status);
        }
        if (search) {
            whereClause += ' AND (c.title LIKE ? OR c.complaint_id LIKE ? OR c.category LIKE ?)';
            params.push(searchParam, searchParam, searchParam);
        }

        const [rows] = await db.query(
            `SELECT c.* FROM complaints c
             ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM complaints c ${whereClause}`,
            params
        );

        return { rows, total };
    },

    /**
     * Get all complaints (admin view) with filters
     */
    async findAll({
        search = '', status = '', category = '',
        priority = '', hostel_block = '',
        page = 1, limit = 10
    } = {}) {
        const offset = (page - 1) * limit;
        const searchParam = `%${search}%`;

        let conditions = [];
        const params = [];

        if (search) {
            conditions.push(`(c.complaint_id LIKE ? OR c.title LIKE ? OR 
                             s.full_name LIKE ? OR s.register_number LIKE ?)`);
            params.push(searchParam, searchParam, searchParam, searchParam);
        }
        if (status) { conditions.push('c.status = ?'); params.push(status); }
        if (category) { conditions.push('c.category = ?'); params.push(category); }
        if (priority) { conditions.push('c.priority = ?'); params.push(priority); }
        if (hostel_block) { conditions.push('c.hostel_block = ?'); params.push(hostel_block); }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await db.query(
            `SELECT c.*, s.full_name as student_name, s.register_number,
                    s.department, s.email as student_email
             FROM complaints c
             JOIN students s ON c.student_id = s.id
             ${whereClause}
             ORDER BY c.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM complaints c
             JOIN students s ON c.student_id = s.id
             ${whereClause}`,
            params
        );

        return { rows, total };
    },

    /**
     * Update complaint status and remarks (admin action)
     */
    async updateStatus(id, { status, priority, admin_remarks, assigned_to, adminId }) {
        const complaint = await this.findById(id);
        if (!complaint) return false;

        const resolved_at = status === 'Resolved' ? new Date() : null;

        await db.query(
            `UPDATE complaints 
             SET status=?, priority=?, admin_remarks=?, assigned_to=?,
                 resolved_at=COALESCE(?, resolved_at), updated_at=NOW()
             WHERE id=?`,
            [status, priority, admin_remarks, assigned_to || null, resolved_at, id]
        );

        // Record status change in history
        if (complaint.status !== status) {
            await db.query(
                `INSERT INTO complaint_status_history 
                 (complaint_id, old_status, new_status, changed_by_type, changed_by_id, remarks)
                 VALUES (?, ?, ?, 'admin', ?, ?)`,
                [id, complaint.status, status, adminId, admin_remarks || null]
            );
        }

        return true;
    },

    /**
     * Delete a complaint (only pending ones by student, or admin can delete any)
     */
    async delete(id, studentId = null) {
        let query, params;
        if (studentId) {
            // Students can only delete pending complaints
            query = "DELETE FROM complaints WHERE id = ? AND student_id = ? AND status = 'Pending'";
            params = [id, studentId];
        } else {
            query = 'DELETE FROM complaints WHERE id = ?';
            params = [id];
        }
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    },

    /**
     * Get complaint status history
     */
    async getStatusHistory(complaintId) {
        const [rows] = await db.query(
            `SELECT h.*, 
                    CASE WHEN h.changed_by_type = 'admin' 
                         THEN a.full_name 
                         ELSE s.full_name END as changed_by_name
             FROM complaint_status_history h
             LEFT JOIN admins a ON h.changed_by_type = 'admin' AND h.changed_by_id = a.id
             LEFT JOIN students s ON h.changed_by_type = 'student' AND h.changed_by_id = s.id
             WHERE h.complaint_id = ?
             ORDER BY h.created_at ASC`,
            [complaintId]
        );
        return rows;
    },

    /**
     * Get dashboard stats for a student
     */
    async getStudentStats(studentId) {
        const [[stats]] = await db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected
             FROM complaints WHERE student_id = ?`,
            [studentId]
        );
        return stats;
    },

    /**
     * Get dashboard stats for admin
     */
    async getAdminStats() {
        const [[stats]] = await db.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
                SUM(CASE WHEN priority = 'High' OR priority = 'Critical' THEN 1 ELSE 0 END) as high_priority_count,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_count
             FROM complaints`
        );
        return {
            total: stats.total,
            pending: stats.pending,
            in_progress: stats.in_progress,
            resolved: stats.resolved,
            high_priority: stats.high_priority_count,
            today: stats.today_count
        };
    },

    /**
     * Get complaints by category (for chart)
     */
    async getByCategory() {
        const [rows] = await db.query(
            `SELECT category, COUNT(*) as count
             FROM complaints
             GROUP BY category
             ORDER BY count DESC`
        );
        return rows;
    },

    /**
     * Get complaints by status (for chart)
     */
    async getByStatus() {
        const [rows] = await db.query(
            `SELECT status, COUNT(*) as count
             FROM complaints
             GROUP BY status`
        );
        return rows;
    },

    /**
     * Get monthly complaint trends (last 6 months)
     */
    async getMonthlyTrend() {
        const [rows] = await db.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                DATE_FORMAT(MIN(created_at), '%b %Y') as label,
                COUNT(*) as total,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
             FROM complaints
             WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m')
             ORDER BY month ASC`
        );
        return rows;
    },

    /**
     * Get latest complaints (admin recent activity feed)
     */
    async getLatest(limit = 10) {
        const [rows] = await db.query(
            `SELECT c.id, c.complaint_id, c.title, c.status, c.priority, 
                    c.category, c.created_at, s.full_name as student_name
             FROM complaints c
             JOIN students s ON c.student_id = s.id
             ORDER BY c.created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    },

    /**
     * Get latest complaint for a student
     */
    async getLatestByStudent(studentId) {
        const [rows] = await db.query(
            `SELECT * FROM complaints WHERE student_id = ?
             ORDER BY created_at DESC LIMIT 1`,
            [studentId]
        );
        return rows[0] || null;
    },

    /**
     * Get complaints for a student (for admin view of student details)
     */
    async findByStudentId(studentId) {
        const [rows] = await db.query(
            `SELECT * FROM complaints WHERE student_id = ?
             ORDER BY created_at DESC`,
            [studentId]
        );
        return rows;
    },

    /**
     * Get report data
     */
    async getReportData({ type = 'all', month = null, year = null } = {}) {
        let conditions = [];
        const params = [];

        if (type === 'pending') {
            conditions.push("status = 'Pending'");
        } else if (type === 'resolved') {
            conditions.push("status = 'Resolved'");
        } else if (type === 'in_progress') {
            conditions.push("status = 'In Progress'");
        }

        if (month && year) {
            conditions.push('MONTH(c.created_at) = ? AND YEAR(c.created_at) = ?');
            params.push(month, year);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await db.query(
            `SELECT c.*, s.full_name as student_name, s.register_number, s.department
             FROM complaints c
             JOIN students s ON c.student_id = s.id
             ${whereClause}
             ORDER BY c.created_at DESC`,
            params
        );
        return rows;
    }
};

module.exports = Complaint;
