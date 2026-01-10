const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

// Create or connect to database
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Drop all existing tables if they exist
console.log('🗑️  Dropping existing tables...\n');
const dropTables = [
  'audit_log',
  'parent_access_log',
  'alerts',
  'calculations',
  'marks',
  'assessment_types',
  'classes',
  'students',
  'parents',
  'teachers',
  'users'
];

dropTables.forEach(table => {
  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_student_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_parent_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_user_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_class_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_assessment_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_teacher_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_academic_year`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_email`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_employee_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_student_id`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_role`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_severity`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_status`);
    db.exec(`DROP INDEX IF EXISTS idx_${table}_is_dismissed`);
  } catch (e) {
    // Ignore errors for non-existent tables/indexes
  }
});

// Drop triggers
try {
  db.exec('DROP TRIGGER IF EXISTS update_users_timestamp');
  db.exec('DROP TRIGGER IF EXISTS update_classes_timestamp');
  db.exec('DROP TRIGGER IF EXISTS log_mark_changes');
  db.exec('DROP TRIGGER IF EXISTS check_low_score');
} catch (e) {
  // Ignore errors
}

console.log('✓ Dropped existing tables and indexes');
console.log('✓ Ready to create new schema');

// Read and execute schema
const schemaPath = path.join(__dirname, '..', 'database', 'schema-sqlite.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('\n📋 Executing schema...\n');

try {
  // Execute entire schema as one transaction
  db.exec(schema);
  console.log('✓ Schema created successfully\n');
} catch (error) {
  console.error('❌ Error creating schema:', error.message);
  process.exit(1);
}

// Hash passwords
const adminPass = bcrypt.hashSync('Admin123!', 10);
const teacherPass = bcrypt.hashSync('Teacher123!', 10);
const studentPass = bcrypt.hashSync('Student123!', 10);
const parentPass = bcrypt.hashSync('Parent123!', 10);

console.log('🔐 Hashed passwords for demo accounts\n');

// Insert demo data
console.log('📝 Inserting demo data...\n');

try {
  // Insert users
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number, is_active, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1)
  `);

  // Insert admin user
  const adminUser = insertUser.run(
    'admin@school.com',
    adminPass,
    'admin',
    'System',
    'Administrator',
    '+1234567899'
  );

  console.log('✓ Created admin user');

  const teacherUser = insertUser.run(
    'teacher1@school.com',
    teacherPass,
    'teacher',
    'John',
    'Smith',
    '+1234567890'
  );

  const studentUser = insertUser.run(
    'student1@school.com',
    studentPass,
    'student',
    'Emma',
    'Johnson',
    null
  );

  const parentUser = insertUser.run(
    'parent1@email.com',
    parentPass,
    'parent',
    'Robert',
    'Johnson',
    '+1234567891'
  );

  console.log('✓ Created users');

  // Insert teacher
  db.prepare(`
    INSERT INTO teachers (user_id, employee_id, department, is_approved_by_admin, approved_at)
    VALUES (?, 'T001', 'Mathematics', 1, datetime('now'))
  `).run(teacherUser.lastInsertRowid);

  console.log('✓ Created teacher');

  // Insert parent
  const parentInsert = db.prepare(`
    INSERT INTO parents (user_id) VALUES (?)
  `).run(parentUser.lastInsertRowid);

  console.log('✓ Created parent');

  // Insert class
  const classInsert = db.prepare(`
    INSERT INTO classes (class_name, subject, teacher_id, academic_year, description)
    VALUES ('5A', 'Mathematics', 1, '2024-2025', 'Fifth grade mathematics class')
  `).run();

  console.log('✓ Created class');

  // Insert student
  db.prepare(`
    INSERT INTO students (user_id, student_id, class_id, parent_id, allow_parent_access, parent_access_granted_at)
    VALUES (?, 'S12345', ?, ?, 1, datetime('now'))
  `).run(studentUser.lastInsertRowid, classInsert.lastInsertRowid, parentInsert.lastInsertRowid);

  console.log('✓ Created student');

  // Insert assessment types
  const insertAssessment = db.prepare(`
    INSERT INTO assessment_types (class_id, type_name, weight, max_score, description)
    VALUES (?, ?, ?, 20.00, ?)
  `);

  insertAssessment.run(1, 'Midterm Exam', 30.00, 'Mid-semester examination');
  insertAssessment.run(1, 'Final Exam', 40.00, 'End of semester examination');
  insertAssessment.run(1, 'Homework', 15.00, 'Weekly homework assignments');
  insertAssessment.run(1, 'Quizzes', 15.00, 'Regular class quizzes');

  console.log('✓ Created assessment types');

  // Insert marks
  const insertMark = db.prepare(`
    INSERT INTO marks (student_id, assessment_id, assessment_date, score, teacher_comment, entered_by_teacher_id, status)
    VALUES (1, ?, date('now', ?), ?, ?, 1, 'published')
  `);

  insertMark.run(1, '-30 days', 17.5, 'Excellent understanding of algebra concepts!');
  insertMark.run(3, '-25 days', 18.0, 'Always completes homework on time with great accuracy.');
  insertMark.run(4, '-20 days', 16.5, 'Good performance on geometry quiz.');
  insertMark.run(3, '-15 days', 19.0, 'Perfect homework submission this week!');
  insertMark.run(4, '-10 days', 17.0, 'Solid understanding of fractions.');

  console.log('✓ Created marks');

  // Insert calculation
  db.prepare(`
    INSERT INTO calculations (student_id, class_id, current_total, percentage, grade_letter, breakdown)
    VALUES (1, 1, 17.64, 88.20, 'A', '{}')
  `).run();

  console.log('✓ Created calculation');

  // Insert parent access log
  db.prepare(`
    INSERT INTO parent_access_log (student_id, parent_id, action, permission_status)
    VALUES (1, 1, 'granted', 'active')
  `).run();

  console.log('✓ Created parent access log');

  // Verify
  console.log('\n📊 Database Statistics:\n');
  const stats = {
    'Users': db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    'Teachers': db.prepare('SELECT COUNT(*) as count FROM teachers').get().count,
    'Students': db.prepare('SELECT COUNT(*) as count FROM students').get().count,
    'Parents': db.prepare('SELECT COUNT(*) as count FROM parents').get().count,
    'Classes': db.prepare('SELECT COUNT(*) as count FROM classes').get().count,
    'Assessments': db.prepare('SELECT COUNT(*) as count FROM assessment_types').get().count,
    'Marks': db.prepare('SELECT COUNT(*) as count FROM marks').get().count,
  };

  Object.entries(stats).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });

  console.log('\n✅ Database initialized successfully!\n');
  console.log('📝 Demo Accounts:');
  console.log('   Admin:   admin@school.com / Admin123!');
  console.log('   Teacher: teacher1@school.com / Teacher123!');
  console.log('   Student: student1@school.com / Student123!');
  console.log('   Parent:  parent1@email.com / Parent123!\n');
  console.log('📁 Database file: ' + dbPath + '\n');

} catch (error) {
  console.error('\n❌ Error inserting demo data:', error);
  process.exit(1);
}

db.close();
