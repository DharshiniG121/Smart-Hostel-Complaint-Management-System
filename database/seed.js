/**
 * Database Seeder
 * Run: node database/seed.js
 * Creates default admin accounts
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function seedDatabase() {
    const connection = await db.getConnection();
    try {
        console.log('🌱 Starting database seeding...\n');

        // Check if admin already exists
        const [existing] = await connection.query(
            'SELECT id FROM admins WHERE username = ?', ['admin']
        );

        if (existing.length > 0) {
            console.log('⚠️  Admin account already exists. Skipping seed.');
            console.log('\n📋 Admin Login Credentials:');
            console.log('   Username: admin');
            console.log('   Password: Admin@12345');
            console.log('   Email: admin@hostel.com\n');
            return;
        }

        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;

        // Create Super Admin
        const superAdminPassword = await bcrypt.hash('Admin@12345', rounds);
        await connection.query(
            `INSERT INTO admins (full_name, email, username, password, phone, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Super Administrator', 'admin@hostel.com', 'admin', superAdminPassword, '9000000001', 'super_admin']
        );

        // Create a second admin
        const adminPassword = await bcrypt.hash('Manager@123', rounds);
        await connection.query(
            `INSERT INTO admins (full_name, email, username, password, phone, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
            ['Hostel Manager', 'manager@hostel.com', 'manager', adminPassword, '9000000002', 'admin']
        );

        console.log('✅ Admin accounts created successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Super Admin Login Credentials:');
        console.log('   Username : admin');
        console.log('   Password : Admin@12345');
        console.log('   Email    : admin@hostel.com');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 Manager Login Credentials:');
        console.log('   Username : manager');
        console.log('   Password : Manager@123');
        console.log('   Email    : manager@hostel.com');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

seedDatabase();
