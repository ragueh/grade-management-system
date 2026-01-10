-- Grade Management System - SQLite Schema
-- Compatible with better-sqlite3

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student', 'parent')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_verified INTEGER DEFAULT 1,
  phone_number TEXT,
  is_active INTEGER DEFAULT 1,
  last_login DATETIME,
  login_attempts INTEGER DEFAULT 0,
  locked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- TEACHERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  employee_id TEXT NOT NULL UNIQUE,
  department TEXT NOT NULL,
  is_approved_by_admin INTEGER DEFAULT 0,
  approved_at DATETIME,
  approved_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  student_id TEXT NOT NULL UNIQUE,
  class_id INTEGER,
  parent_id INTEGER,
  allow_parent_access INTEGER DEFAULT 0,
  parent_access_granted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_class_id ON students(class_id);

-- ============================================
-- PARENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_parents_user_id ON parents(user_id);

-- ============================================
-- CLASSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_id INTEGER NOT NULL,
  academic_year TEXT NOT NULL,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE INDEX idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);

-- ============================================
-- ASSESSMENT TYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assessment_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER NOT NULL,
  type_name TEXT NOT NULL,
  weight REAL NOT NULL CHECK(weight >= 0 AND weight <= 100),
  max_score REAL DEFAULT 20.00 CHECK(max_score = 20.00),
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(class_id, type_name)
);

CREATE INDEX idx_assessment_types_class_id ON assessment_types(class_id);

-- ============================================
-- MARKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  assessment_id INTEGER NOT NULL,
  assessment_date DATE NOT NULL,
  score REAL NOT NULL CHECK(score >= 0 AND score <= 20),
  max_score REAL DEFAULT 20.00 CHECK(max_score = 20.00),
  teacher_comment TEXT,
  entered_by_teacher_id INTEGER NOT NULL,
  entered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  modified_at DATETIME,
  change_log TEXT DEFAULT '[]',
  status TEXT DEFAULT 'published' CHECK(status IN ('draft', 'published', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (assessment_id) REFERENCES assessment_types(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by_teacher_id) REFERENCES teachers(id),
  UNIQUE(student_id, assessment_id, assessment_date)
);

CREATE INDEX idx_marks_student_id ON marks(student_id);
CREATE INDEX idx_marks_assessment_id ON marks(assessment_id);
CREATE INDEX idx_marks_status ON marks(status);

-- ============================================
-- CALCULATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL UNIQUE,
  class_id INTEGER NOT NULL,
  current_total REAL,
  percentage REAL,
  grade_letter TEXT,
  breakdown TEXT,
  last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE INDEX idx_calculations_student_id ON calculations(student_id);
CREATE INDEX idx_calculations_class_id ON calculations(class_id);

-- ============================================
-- ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  alert_type TEXT NOT NULL CHECK(alert_type IN ('low_score', 'declining_trend', 'missing_assessment', 'improvement_needed')),
  severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  is_dismissed INTEGER DEFAULT 0,
  dismissed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX idx_alerts_student_id ON alerts(student_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_is_dismissed ON alerts(is_dismissed);

-- ============================================
-- PARENT ACCESS LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parent_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  parent_id INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('granted', 'revoked', 'accessed')),
  permission_status TEXT NOT NULL CHECK(permission_status IN ('active', 'revoked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

CREATE INDEX idx_parent_access_log_student_id ON parent_access_log(student_id);
CREATE INDEX idx_parent_access_log_parent_id ON parent_access_log(parent_id);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  user_id INTEGER,
  affected_table TEXT,
  affected_record_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger for users
CREATE TRIGGER update_users_timestamp
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update timestamp trigger for classes
CREATE TRIGGER update_classes_timestamp
AFTER UPDATE ON classes
FOR EACH ROW
BEGIN
  UPDATE classes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Log mark changes trigger
CREATE TRIGGER log_mark_changes
AFTER UPDATE ON marks
FOR EACH ROW
BEGIN
  UPDATE marks
  SET modified_at = CURRENT_TIMESTAMP,
      change_log = json_insert(
        CASE WHEN change_log = '[]' THEN '[]' ELSE change_log END,
        '$[#]',
        json_object(
          'timestamp', datetime('now'),
          'old_score', OLD.score,
          'new_score', NEW.score,
          'old_comment', OLD.teacher_comment,
          'new_comment', NEW.teacher_comment
        )
      )
  WHERE id = NEW.id;
END;

-- Create alert for low scores
CREATE TRIGGER check_low_score
AFTER INSERT ON marks
FOR EACH ROW
WHEN NEW.score < 12 AND NEW.status = 'published'
BEGIN
  INSERT INTO alerts (student_id, alert_type, severity, message)
  VALUES (
    NEW.student_id,
    'low_score',
    CASE WHEN NEW.score < 10 THEN 'critical' ELSE 'warning' END,
    'Score of ' || NEW.score || '/20 is below passing threshold'
  );
END;

-- ==================================================
-- Initial Admin Account (optional - uncomment if needed)
-- ==================================================
-- INSERT INTO users (email, password_hash, role, first_name, last_name)
-- VALUES ('admin@school.com', '$2a$10$...hash...', 'admin', 'Admin', 'User');
