/**
 * Smart Hostel Complaint Management System
 * Main Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const methodOverride = require('method-override');

const sessionMiddleware = require('./config/session');
const { attachLocals } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── View Engine ─────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Static Files ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── Body Parsers ────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ─── Method Override (for PUT/DELETE from forms) ─────────────
app.use(methodOverride('_method'));

// ─── Session ─────────────────────────────────────────────────
app.use(sessionMiddleware);

// ─── Attach locals (flash, user) to all views ────────────────
app.use(attachLocals);

// ─── Routes ──────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

// Root redirect
app.get('/', (req, res) => {
    if (req.session.student) return res.redirect('/student/dashboard');
    if (req.session.admin) return res.redirect('/admin/dashboard');
    res.redirect('/auth/student/login');
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Page Not Found',
        code: 404,
        message: 'The page you are looking for does not exist.'
    });
});

// ─── Global Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).render('error', {
        title: '500 - Server Error',
        code: 500,
        message: 'Something went wrong on our end. Please try again later.'
    });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🏨 Smart Hostel Complaint Management System');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🌐 Server running at: http://localhost:${PORT}`);
    console.log(`  📊 Student Portal:   http://localhost:${PORT}/auth/student/login`);
    console.log(`  🔐 Admin Portal:     http://localhost:${PORT}/auth/admin/login`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

module.exports = app;
