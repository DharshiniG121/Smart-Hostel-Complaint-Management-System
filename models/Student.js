/**
 * Student Model
 * Handles all database operations related to students
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Student = {
    /**
     * Create a new student
     */
    async create(data) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(data.password, rounds);

        const [result] = await db.query(
            `INSERT INTO students 
             (full_name, register_number, department, year_of_study, gender, 
              hostel_block, room_number, phone, email, password)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.full_name, data.register_number, data.department,
                data.year_of_study, data.gender, data.hostel_block,
                data.room_number, data.phone, data.email, hashedPassword
            ]
        );
        return result.insertId;
    },

    /**
     * Find student by ID
     */
    async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM students WHERE id = ? AND is_active = 1', [id]
        );
        return rows[0] || null;
    },

    /**
     * Find student by register number
     */
    async findByRegisterNumber(registerNumber) {
        const [rows] = await db.query(
            'SELECT * FROM students WHERE register_number = ? AND is_active = 1',
            [registerNumber]
        );
        return rows[0] || null;
    },

    /**
     * Find student by email
     */
    async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM students WHERE email = ? AND is_active = 1', [email]
        );
        return rows[0] || null;
    },

    /**
     * Find student by register number OR email (for flexible login)
     */
    async findByCredential(credential) {
        const [rows] = await db.query(
            `SELECT * FROM students 
             WHERE (register_number = ? OR email = ?) AND is_active = 1`,
            [credential, credential]
        );
        return rows[0] || null;
    },

    /**
     * Verify password
     */
    async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    },

    /**
     * Update last login timestamp
     */
    async updateLastLogin(id) {
        await db.query(
            'UPDATE students SET last_login = NOW() WHERE id = ?', [id]
        );
    },

    /**
     * Update student profile
     */
    async updateProfile(id, data) {
        const [result] = await db.query(
            `UPDATE students 
             SET full_name=?, department=?, year_of_study=?, gender=?,
                 hostel_block=?, room_number=?, phone=?, email=?
             WHERE id = ?`,
            [
                data.full_name, data.department, data.year_of_study, data.gender,
                data.hostel_block, data.room_number, data.phone, data.email, id
            ]
        );
        return result.affectedRows > 0;
    },

    /**
     * Change password
     */
    async changePassword(id, newPassword) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, rounds);
        const [result] = await db.query(
            'UPDATE students SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Get all students with complaint counts (for admin)
     */
    async findAll({ search = '', page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        const searchParam = `%${search}%`;

        const [rows] = await db.query(
            `SELECT s.id, s.full_name, s.register_number, s.department, s.year_of_study,
                    s.gender, s.hostel_block, s.room_number, s.phone, s.email,
                    s.is_active, s.last_login, s.created_at, s.updated_at,
                    COUNT(c.id) as total_complaints,
                    SUM(CASE WHEN c.status = 'Pending' THEN 1 ELSE 0 END) as pending_complaints,
                    SUM(CASE WHEN c.status = 'Resolved' THEN 1 ELSE 0 END) as resolved_complaints
             FROM students s
             LEFT JOIN complaints c ON s.id = c.student_id
             WHERE s.is_active = 1 AND (
                 s.full_name LIKE ? OR 
                 s.register_number LIKE ? OR 
                 s.email LIKE ? OR 
                 s.department LIKE ?
             )
             GROUP BY s.id, s.full_name, s.register_number, s.department, s.year_of_study,
                      s.gender, s.hostel_block, s.room_number, s.phone, s.email,
                      s.is_active, s.last_login, s.created_at, s.updated_at
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [searchParam, searchParam, searchParam, searchParam, limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) as total FROM students 
             WHERE is_active = 1 AND (
                 full_name LIKE ? OR register_number LIKE ? OR 
                 email LIKE ? OR department LIKE ?
             )`,
            [searchParam, searchParam, searchParam, searchParam]
        );

        return { rows, total };
    },

    /**
     * Soft delete student
     */
    async delete(id) {
        const [result] = await db.query(
            'UPDATE students SET is_active = 0 WHERE id = ?', [id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Check if register number exists
     */
    async registerNumberExists(registerNumber, excludeId = null) {
        let query = 'SELECT id FROM students WHERE register_number = ?';
        const params = [registerNumber];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await db.query(query, params);
        return rows.length > 0;
    },

    /**
     * Check if email exists
     */
    async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM students WHERE email = ?';
        const params = [email];
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        const [rows] = await db.query(query, params);
        return rows.length > 0;
    },

    /**
     * Get student count
     */
    async getCount() {
        const [[{ count }]] = await db.query(
            'SELECT COUNT(*) as count FROM students WHERE is_active = 1'
        );
        return count;
    }
};

module.exports = Student;
