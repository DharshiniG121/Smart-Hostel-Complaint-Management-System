/**
 * Session Configuration
 * Express Session with MySQL store
 */

const session = require('express-session');
require('dotenv').config();

const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'hostel_secret_key_fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'hostel.sid'
};

module.exports = session(sessionConfig);
