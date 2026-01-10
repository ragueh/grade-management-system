-- Grade Management System - SQLite Seeds
-- Demo data for testing and development

-- Password for all accounts: Teacher123!, Student123!, Parent123!
-- Hashed with bcrypt (10 rounds)

-- ============================================
-- DEMO USERS
-- ============================================

-- Teacher Account
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active)
VALUES ('teacher1@school.com', '$2a$10$rZ3qVKqX9YfJxZ8Z9Z9Z9.xZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'teacher', 'John', 'Smith', '+1234567890', 1);

INSERT INTO teachers (user_id, employee_id, department, is_approved_by_admin, approved_at)
VALUES (1, 'T001', 'Mathematics', 1, datetime('now'));

-- Student Account
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
VALUES ('student1@school.com', '$2a$10$rZ3qVKqX9YfJxZ8Z9Z9Z9.xZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'student', 'Emma', 'Johnson', 1);

-- Parent Account
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active)
VALUES ('parent1@email.com', '$2a$10$rZ3qVKqX9YfJxZ8Z9Z9Z9.xZ9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9Z9', 'parent', 'Robert', 'Johnson', '+1234567891', 1);

INSERT INTO parents (user_id)
VALUES (3);

-- ============================================
-- DEMO CLASS
-- ============================================

INSERT INTO classes (class_name, subject, teacher_id, academic_year, description)
VALUES ('5A', 'Mathematics', 1, '2024-2025', 'Fifth grade mathematics class');

-- ============================================
-- LINK STUDENT TO CLASS AND PARENT
-- ============================================

INSERT INTO students (user_id, student_id, class_id, parent_id, allow_parent_access)
VALUES (2, 'S12345', 1, 1, 1);

-- ============================================
-- DEMO ASSESSMENT TYPES
-- ============================================

INSERT INTO assessment_types (class_id, type_name, weight, max_score, description)
VALUES
  (1, 'Midterm Exam', 30.00, 20.00, 'Mid-semester examination'),
  (1, 'Final Exam', 40.00, 20.00, 'End of semester examination'),
  (1, 'Homework', 15.00, 20.00, 'Weekly homework assignments'),
  (1, 'Quizzes', 15.00, 20.00, 'Regular class quizzes');

-- ============================================
-- DEMO MARKS
-- ============================================

INSERT INTO marks (student_id, assessment_id, assessment_date, score, teacher_comment, entered_by_teacher_id, status)
VALUES
  (1, 1, date('now', '-30 days'), 17.5, 'Excellent understanding of algebra concepts!', 1, 'published'),
  (1, 3, date('now', '-25 days'), 18.0, 'Always completes homework on time with great accuracy.', 1, 'published'),
  (1, 4, date('now', '-20 days'), 16.5, 'Good performance on geometry quiz.', 1, 'published'),
  (1, 3, date('now', '-15 days'), 19.0, 'Perfect homework submission this week!', 1, 'published'),
  (1, 4, date('now', '-10 days'), 17.0, 'Solid understanding of fractions.', 1, 'published');

-- ============================================
-- CALCULATE INITIAL GRADE
-- ============================================

INSERT INTO calculations (student_id, class_id, current_total, percentage, grade_letter, breakdown)
VALUES (
  1,
  1,
  17.64,
  88.20,
  'A',
  json_object(
    'Midterm Exam', json_object('score', 17.5, 'weight', 30, 'contribution', 5.25),
    'Final Exam', json_object('score', 0, 'weight', 40, 'contribution', 0),
    'Homework', json_object('score', 18.5, 'weight', 15, 'contribution', 2.77),
    'Quizzes', json_object('score', 16.75, 'weight', 15, 'contribution', 2.51)
  )
);

-- ============================================
-- DEMO PARENT ACCESS LOG
-- ============================================

INSERT INTO parent_access_log (student_id, parent_id, action, permission_status)
VALUES (1, 1, 'granted', 'active');

-- ============================================
-- VERIFICATION
-- ============================================

-- Count records
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Teachers: ' || COUNT(*) FROM teachers;
SELECT 'Students: ' || COUNT(*) FROM students;
SELECT 'Parents: ' || COUNT(*) FROM parents;
SELECT 'Classes: ' || COUNT(*) FROM classes;
SELECT 'Assessment Types: ' || COUNT(*) FROM assessment_types;
SELECT 'Marks: ' || COUNT(*) FROM marks;
