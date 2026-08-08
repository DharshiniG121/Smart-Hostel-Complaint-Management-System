/**
 * Admin Model
 * Handles all database operations related to admin users
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = {
    /**
     * Find admin by ID
     */
    async findById(id) {
        const [rows] = await db.query(
            'SELECT * FROM admins WHERE id = ? AND is_active = 1', [id]
        );
        return rows[0] || null;
    },

    /**
     * Find admin by username
     */
    async findByUsername(username) {
        const [rows] = await db.query(
            'SELECT * FROM admins WHERE username = ? AND is_active = 1', [username]
        );
        return rows[0] || null;
    },

    /**
     * Find admin by email
     */
    async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM admins WHERE email = ? AND is_active = 1', [email]
        );
        return rows[0] || null;
    },

    /**
     * Find admin by username or email (flexible login)
     */
    async findByCredential(credential) {
        const [rows] = await db.query(
            `SELECT * FROM admins 
             WHERE (username = ? OR email = ?) AND is_active = 1`,
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
     * Update last login
     */
    async updateLastLogin(id) {
        await db.query(
            'UPDATE admins SET last_login = NOW() WHERE id = ?', [id]
        );
    },

    /**
     * Change password
     */
    async changePassword(id, newPassword) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(newPassword, rounds);
        const [result] = await db.query(
            'UPDATE admins SET password = ? WHERE id = ?',
            [hashedPassword, id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Get all admins
     */
    async findAll() {
        const [rows] = await db.query(
            'SELECT id, full_name, email, username, role, last_login, created_at FROM admins WHERE is_active = 1'
        );
        return rows;
    }
};

module.exports = Admin;
