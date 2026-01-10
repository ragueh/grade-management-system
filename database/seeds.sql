-- Seed Data for Grade Management System
-- For development and testing purposes

-- Insert Admin User
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES ('admin@grademanagement.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'System', 'Admin', 'admin', TRUE);
-- Password: Admin123! (hashed with bcrypt)

-- Insert Sample Teachers
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES
  ('teacher1@school.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Ahmed', 'Hassan', 'teacher', TRUE),
  ('teacher2@school.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Fatima', 'Ali', 'teacher', TRUE),
  ('teacher3@school.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Mohamed', 'Ibrahim', 'teacher', TRUE);
-- Password: Teacher123! (same for all in development)

-- Insert Teacher records
INSERT INTO teachers (user_id, employee_id, department, is_approved_by_admin)
VALUES
  (2, 'TCH001', 'Mathematics', TRUE),
  (3, 'TCH002', 'Science', TRUE),
  (4, 'TCH003', 'English', TRUE);

-- Insert Sample Classes
INSERT INTO classes (teacher_id, class_name, subject, academic_year, is_active)
VALUES
  (1, 'Class A3', 'Mathematics', '2024-2025', TRUE),
  (1, 'Class B2', 'Mathematics', '2024-2025', TRUE),
  (2, 'Class A3', 'Science', '2024-2025', TRUE),
  (3, 'Class B2', 'English', '2024-2025', TRUE);

-- Insert Sample Assessment Types for Mathematics Class A3
INSERT INTO assessment_types (class_id, type_name, weight, max_score, display_order, is_active)
VALUES
  (1, 'Quiz 1', 15.00, 20.00, 1, TRUE),
  (1, 'Quiz 2', 15.00, 20.00, 2, TRUE),
  (1, 'Test 1', 30.00, 20.00, 3, TRUE),
  (1, 'Exam Final', 40.00, 20.00, 4, TRUE);

-- Insert Sample Assessment Types for Mathematics Class B2
INSERT INTO assessment_types (class_id, type_name, weight, max_score, display_order, is_active)
VALUES
  (2, 'Quiz 1', 20.00, 20.00, 1, TRUE),
  (2, 'Test 1', 30.00, 20.00, 2, TRUE),
  (2, 'Exam Midterm', 20.00, 20.00, 3, TRUE),
  (2, 'Exam Final', 30.00, 20.00, 4, TRUE);

-- Insert Sample Parents
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES
  ('parent1@email.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Amina', 'Hassan', 'parent', TRUE),
  ('parent2@email.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Omar', 'Ali', 'parent', TRUE);
-- Password: Parent123! (same for all in development)

-- Insert Parent records
INSERT INTO parents (user_id)
VALUES (5), (6);

-- Insert Sample Students
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified)
VALUES
  ('student1@school.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Yusuf', 'Hassan', 'student', TRUE),
  ('student2@school.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Maryam', 'Ali', 'student', TRUE),
  ('student3@school.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Ibrahim', 'Mohamed', 'student', TRUE),
  ('student4@school.com', '$2a$10$rGxY8M.KLYvKbJJ4Aq8dv.X9MKu0qF5BxH0vP9W3q5F5Zy5Kz5Kz5', 'Aisha', 'Ahmed', 'student', TRUE);
-- Password: Student123! (same for all in development)

-- Insert Student records
INSERT INTO students (user_id, student_id, class_id, parent_id, allow_parent_access)
VALUES
  (7, 'STU001', 1, 1, TRUE),   -- Yusuf in Math A3, parent access allowed
  (8, 'STU002', 1, 2, FALSE),  -- Maryam in Math A3, parent access not allowed
  (9, 'STU003', 2, NULL, FALSE), -- Ibrahim in Math B2, no parent linked
  (10, 'STU004', 2, NULL, FALSE); -- Aisha in Math B2, no parent linked

-- Insert Sample Marks with Comments for Class A3 Students
INSERT INTO marks (student_id, assessment_id, assessment_date, score, max_score, teacher_comment, entered_by_teacher_id, status)
VALUES
  -- Yusuf's marks (good student)
  (1, 1, '2025-01-15', 18.00, 20.00, 'Excellent work! Clear understanding of concepts.', 1, 'published'),
  (1, 2, '2025-01-22', 17.50, 20.00, 'Very good effort. Watch minor calculation errors.', 1, 'published'),
  (1, 3, '2025-02-01', 16.00, 20.00, 'Good performance overall.', 1, 'published'),

  -- Maryam's marks (declining trend - should trigger alert)
  (2, 1, '2025-01-15', 16.00, 20.00, 'Good start!', 1, 'published'),
  (2, 2, '2025-01-22', 14.00, 20.00, 'Some concepts need review. Please see me after class.', 1, 'published'),
  (2, 3, '2025-02-01', 11.50, 20.00, 'Struggling with recent topics. Recommend extra study sessions.', 1, 'published');

-- Insert Sample Marks for Class B2 Students
INSERT INTO marks (student_id, assessment_id, assessment_date, score, max_score, teacher_comment, entered_by_teacher_id, status)
VALUES
  -- Ibrahim's marks (average student)
  (3, 5, '2025-01-18', 14.50, 20.00, 'Satisfactory performance.', 1, 'published'),
  (3, 6, '2025-02-05', 15.00, 20.00, 'Showing improvement!', 1, 'published'),

  -- Aisha's marks (excellent student)
  (4, 5, '2025-01-18', 19.00, 20.00, 'Outstanding! Keep up the excellent work.', 1, 'published'),
  (4, 6, '2025-02-05', 18.50, 20.00, 'Exceptional understanding of the material.', 1, 'published');

-- Insert Parent Access Logs
INSERT INTO parent_access_log (parent_id, student_id, access_granted_at, permission_status)
VALUES
  (1, 1, '2025-01-10 10:00:00', 'active'); -- Amina has access to Yusuf's grades

-- Note: Calculations will be generated by the backend calculation engine
-- Alerts will be automatically triggered by database triggers when marks are entered

COMMENT ON TABLE users IS 'Development credentials: Admin123!, Teacher123!, Parent123!, Student123!';
