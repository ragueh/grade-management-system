-- Grade Management System Database Schema
-- PostgreSQL 12+
-- All marks on 0-20 scale

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS parent_access_log CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS calculations CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS assessment_weight_history CASCADE;
DROP TABLE IF EXISTS assessment_types CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS parents CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE mark_status AS ENUM ('draft', 'published');
CREATE TYPE alert_type AS ENUM ('low_score', 'declining_trend', 'attendance', 'custom');
CREATE TYPE severity_level AS ENUM ('info', 'warning', 'critical');
CREATE TYPE permission_status AS ENUM ('active', 'revoked');

-- Users Table (Base table for all user types)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Teachers Table (Extended user info)
CREATE TABLE teachers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  is_approved_by_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);

-- Parents Table (Extended user info)
CREATE TABLE parents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parents_user_id ON parents(user_id);

-- Classes Table
CREATE TABLE classes (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_name VARCHAR(100) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_classes_active ON classes(is_active);

-- Students Table (Extended user info)
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(50) UNIQUE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES parents(id) ON DELETE SET NULL,
  allow_parent_access BOOLEAN DEFAULT FALSE,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_parent ON students(parent_id);

-- Assessment Types Table (Customizable weights per class)
CREATE TABLE assessment_types (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  type_name VARCHAR(100) NOT NULL,
  weight DECIMAL(5, 2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  max_score DECIMAL(4, 2) DEFAULT 20.00 CHECK (max_score = 20.00),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(class_id, type_name)
);

CREATE INDEX idx_assessment_class ON assessment_types(class_id);
CREATE INDEX idx_assessment_active ON assessment_types(is_active);

-- Assessment Weight History Table
CREATE TABLE assessment_weight_history (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  assessment_id INTEGER NOT NULL REFERENCES assessment_types(id) ON DELETE CASCADE,
  old_weight DECIMAL(5, 2),
  new_weight DECIMAL(5, 2) NOT NULL,
  changed_by_teacher_id INTEGER NOT NULL REFERENCES teachers(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weight_history_class ON assessment_weight_history(class_id);

-- Marks Table (Core data with teacher comments)
CREATE TABLE marks (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_id INTEGER NOT NULL REFERENCES assessment_types(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  score DECIMAL(4, 2) NOT NULL CHECK (score >= 0 AND score <= 20),
  max_score DECIMAL(4, 2) DEFAULT 20.00 CHECK (max_score = 20.00),
  teacher_comment TEXT,
  entered_by_teacher_id INTEGER NOT NULL REFERENCES teachers(id),
  entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP,
  change_log JSONB DEFAULT '[]'::jsonb,
  status mark_status DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, assessment_id, assessment_date)
);

CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_assessment ON marks(assessment_id);
CREATE INDEX idx_marks_date ON marks(assessment_date);
CREATE INDEX idx_marks_status ON marks(status);

-- Calculations Table (Cached computations)
CREATE TABLE calculations (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  current_total DECIMAL(4, 2) CHECK (current_total >= 0 AND current_total <= 20),
  percentage DECIMAL(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  grade_letter VARCHAR(2),
  breakdown JSONB DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, class_id)
);

CREATE INDEX idx_calculations_student ON calculations(student_id);
CREATE INDEX idx_calculations_class ON calculations(class_id);

-- Audit Log Table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  affected_table VARCHAR(100),
  affected_record_id INTEGER,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_table ON audit_log(affected_table);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);

-- Alerts Table
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  severity severity_level DEFAULT 'warning',
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_alerts_student ON alerts(student_id);
CREATE INDEX idx_alerts_class ON alerts(class_id);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);

-- Parent Access Log Table
CREATE TABLE parent_access_log (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  access_granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  access_revoked_at TIMESTAMP,
  permission_status permission_status DEFAULT 'active'
);

CREATE INDEX idx_parent_access_parent ON parent_access_log(parent_id);
CREATE INDEX idx_parent_access_student ON parent_access_log(student_id);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_types_updated_at BEFORE UPDATE ON assessment_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate assessment weights sum to 100%
CREATE OR REPLACE FUNCTION validate_assessment_weights()
RETURNS TRIGGER AS $$
DECLARE
  total_weight DECIMAL(5, 2);
BEGIN
  SELECT COALESCE(SUM(weight), 0) INTO total_weight
  FROM assessment_types
  WHERE class_id = NEW.class_id AND is_active = TRUE AND id != COALESCE(NEW.id, 0);

  total_weight := total_weight + NEW.weight;

  IF total_weight > 100.01 THEN
    RAISE EXCEPTION 'Total weight for class assessments cannot exceed 100%%. Current total would be: %%', total_weight;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_assessment_weights BEFORE INSERT OR UPDATE ON assessment_types
  FOR EACH ROW EXECUTE FUNCTION validate_assessment_weights();

-- Function to log mark changes
CREATE OR REPLACE FUNCTION log_mark_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.change_log = COALESCE(OLD.change_log, '[]'::jsonb) || jsonb_build_object(
      'timestamp', CURRENT_TIMESTAMP,
      'old_score', OLD.score,
      'new_score', NEW.score,
      'old_comment', OLD.teacher_comment,
      'new_comment', NEW.teacher_comment,
      'changed_by', NEW.entered_by_teacher_id
    );
    NEW.modified_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_mark_changes BEFORE UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION log_mark_changes();

-- Function to check for alerts after mark entry
CREATE OR REPLACE FUNCTION check_student_alerts()
RETURNS TRIGGER AS $$
DECLARE
  student_avg DECIMAL(4, 2);
  recent_scores DECIMAL(4, 2)[];
  class_avg DECIMAL(4, 2);
BEGIN
  -- Get student's current average
  SELECT current_total INTO student_avg
  FROM calculations
  WHERE student_id = NEW.student_id AND class_id = (
    SELECT class_id FROM students WHERE id = NEW.student_id
  );

  -- Check for low score (below 60% = 12/20)
  IF NEW.score < 12.00 THEN
    INSERT INTO alerts (student_id, class_id, alert_type, severity, message)
    SELECT NEW.student_id, s.class_id, 'low_score', 'warning',
           format('Low score alert: %s/20 (%s%%) on %s',
                  NEW.score, ROUND((NEW.score/20)*100, 1),
                  (SELECT type_name FROM assessment_types WHERE id = NEW.assessment_id))
    FROM students s WHERE s.id = NEW.student_id;
  END IF;

  -- Check for critical score (below 50% = 10/20)
  IF NEW.score < 10.00 THEN
    INSERT INTO alerts (student_id, class_id, alert_type, severity, message)
    SELECT NEW.student_id, s.class_id, 'low_score', 'critical',
           format('Critical score alert: %s/20 (%s%%) on %s - Immediate attention needed',
                  NEW.score, ROUND((NEW.score/20)*100, 1),
                  (SELECT type_name FROM assessment_types WHERE id = NEW.assessment_id))
    FROM students s WHERE s.id = NEW.student_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_check_after_mark AFTER INSERT OR UPDATE ON marks
  FOR EACH ROW EXECUTE FUNCTION check_student_alerts();

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO grade_management_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO grade_management_user;

-- Comments for documentation
COMMENT ON TABLE users IS 'Base table for all system users (admin, teacher, student, parent)';
COMMENT ON TABLE marks IS 'Student assessment marks on 0-20 scale with teacher comments';
COMMENT ON TABLE assessment_types IS 'Assessment types with customizable weights per class';
COMMENT ON TABLE calculations IS 'Cached grade calculations for performance';
COMMENT ON TABLE alerts IS 'Student performance alerts and warnings';
COMMENT ON COLUMN marks.score IS 'Score on 0-20 scale';
COMMENT ON COLUMN marks.teacher_comment IS 'Optional feedback from teacher';
COMMENT ON COLUMN assessment_types.weight IS 'Percentage weight (must sum to 100 per class)';
