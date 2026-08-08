# 🏨 Smart Hostel Complaint Management System

A professional full-stack hostel complaint management system built with Node.js, Express, MySQL, and Vanilla JS.

---

## 🚀 Quick Start (3 Steps)

### Step 1 — Database Setup

1. Open MySQL Workbench or your MySQL client
2. Run the schema file:
   ```sql
   SOURCE path/to/database/schema.sql;
   ```
3. Seed admin accounts:
   ```bash
   node database/seed.js
   ```

### Step 2 — Configure Environment

Edit the `.env` file and update your MySQL password:
```env
DB_PASSWORD=your_mysql_password_here
```

### Step 3 — Run the App

```bash
npm install
npm start
```

Visit: **http://localhost:3000**

---

## 🔐 Default Login Credentials

| Role        | Username  | Password      | Email                  |
|-------------|-----------|---------------|------------------------|
| Super Admin | `admin`   | `Admin@12345` | admin@hostel.com       |
| Admin       | `manager` | `Manager@123` | manager@hostel.com     |

Students register themselves via the **Register** page.

---

## 📁 Project Structure

```
hostelsystem/
├── config/
│   ├── database.js       # MySQL connection pool
│   └── session.js        # Express session config
├── controllers/
│   ├── authController.js
│   ├── studentController.js
│   └── adminController.js
├── database/
│   ├── schema.sql        # Full MySQL schema
│   └── seed.js           # Admin seeder script
├── middleware/
│   ├── auth.js           # Route protection
│   └── validate.js       # Input validation rules
├── models/
│   ├── Admin.js
│   ├── Student.js
│   └── Complaint.js
├── public/
│   ├── css/main.css      # All styles
│   └── js/main.js        # Frontend JS
├── routes/
│   ├── auth.js
│   ├── student.js
│   └── admin.js
├── views/
│   ├── auth/             # Login & register pages
│   ├── student/          # Student portal pages
│   ├── admin/            # Admin panel pages
│   └── partials/         # Shared EJS components
├── .env                  # Environment config
├── server.js             # App entry point
└── package.json
```

---

## ✅ Features

- **Student Portal** — Register, Login, Submit complaints, Track status, Edit profile, Change password
- **Admin Portal** — Dashboard with charts, Manage all complaints, Update status/priority/remarks, Student management, Reports
- **Security** — bcrypt password hashing, Express sessions, SQL injection prevention via parameterized queries, Route guards
- **UX** — Toast notifications, Pagination, Search & filters, Responsive design, Empty states, Loading indicators

---

## 🛠️ Tech Stack

| Layer      | Technology           |
|------------|----------------------|
| Frontend   | HTML5, CSS3, Vanilla JS, EJS |
| Backend    | Node.js, Express.js  |
| Database   | MySQL (mysql2)       |
| Auth       | Express Session + bcryptjs |
| Charts     | Chart.js (CDN)       |
