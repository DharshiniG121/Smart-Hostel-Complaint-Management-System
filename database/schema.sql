-- ============================================================
-- Smart Hostel Complaint Management System - Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS hostel_complaint_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hostel_complaint_db;

-- ============================================================
-- TABLE: admins
-- ============================================================
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role ENUM('super_admin', 'admin') DEFAULT 'admin',
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: students
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    register_number VARCHAR(20) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    year_of_study ENUM('1', '2', '3', '4') NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    hostel_block VARCHAR(10) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    phone VARCHAR(10) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: complaints
-- ============================================================
CREATE TABLE IF NOT EXISTS complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id VARCHAR(20) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category ENUM(
        'Electrical', 'Plumbing', 'Internet/WiFi', 'Furniture',
        'Cleaning', 'Water Supply', 'Mess/Food', 'Security', 'Others'
    ) NOT NULL,
    description TEXT NOT NULL,
    hostel_block VARCHAR(10) NOT NULL,
    room_number VARCHAR(10) NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    status ENUM('Pending', 'In Progress', 'Resolved', 'Rejected') DEFAULT 'Pending',
    admin_remarks TEXT NULL,
    assigned_to INT NULL,
    resolved_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: complaint_status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    complaint_id INT NOT NULL,
    old_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NOT NULL,
    changed_by_type ENUM('admin', 'student') NOT NULL,
    changed_by_id INT NOT NULL,
    remarks TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE: notifications (for future push notification support)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('student', 'admin') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    complaint_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_created ON complaints(created_at);
CREATE INDEX idx_history_complaint ON complaint_status_history(complaint_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);
CREATE INDEX idx_students_register ON students(register_number);
CREATE INDEX idx_students_email ON students(email);
