/**
 * Authentication Middleware
 * Protects routes from unauthorized access
 */

/**
 * Ensure user is authenticated as a student
 */
function isStudentAuthenticated(req, res, next) {
    if (req.session && req.session.student) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    req.session.flash = { type: 'error', message: 'Please login to access this page.' };
    return res.redirect('/auth/student/login');
}

/**
 * Ensure user is authenticated as an admin
 */
function isAdminAuthenticated(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    req.session.returnTo = req.originalUrl;
    req.session.flash = { type: 'error', message: 'Please login as admin to access this page.' };
    return res.redirect('/auth/admin/login');
}

/**
 * Redirect already-logged-in students away from auth pages
 */
function isStudentGuest(req, res, next) {
    if (req.session && req.session.student) {
        return res.redirect('/student/dashboard');
    }
    next();
}

/**
 * Redirect already-logged-in admins away from auth pages
 */
function isAdminGuest(req, res, next) {
    if (req.session && req.session.admin) {
        return res.redirect('/admin/dashboard');
    }
    next();
}

/**
 * Attach flash messages and user data to all responses
 */
function attachLocals(req, res, next) {
    // Attach session flash message
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    // Attach current user
    res.locals.student = req.session.student || null;
    res.locals.admin = req.session.admin || null;

    // Attach current path for active nav highlighting
    res.locals.currentPath = req.path;

    next();
}

module.exports = {
    isStudentAuthenticated,
    isAdminAuthenticated,
    isStudentGuest,
    isAdminGuest,
    attachLocals
};
