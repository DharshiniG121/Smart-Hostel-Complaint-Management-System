/**
 * Database Configuration
 * MySQL2 Connection Pool - MySQL 8 compatible
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hostel_complaint_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
    charset: 'utf8mb4',
    // Fix MySQL 8 ONLY_FULL_GROUP_BY - set sql_mode on every new connection
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Wrap pool.query to set sql_mode on first use
const originalGetConnection = pool.getConnection.bind(pool);
pool.getConnection = async function() {
    const conn = await originalGetConnection();
    await conn.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
    return conn;
};

// Test the connection on startup
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('   Check your .env file for DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    }
}

testConnection();

module.exports = pool;
