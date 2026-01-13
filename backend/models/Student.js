const { query, db } = require('../config/database');
const User = require('./User');

class Student {
  /**
   * Create a new student (including user record)
   * @param {Object} studentData - Student data
   * @returns {Promise<Object>} Created student with user info
   */
  static async create(studentData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      student_id,
      class_id,
      parent_id = null,
    } = studentData;

    // Hash password before transaction (async operation)
    const passwordHash = await require('../utils/helpers').hashPassword(password);

    // Use better-sqlite3's transaction properly with a synchronous function
    const createStudentTransaction = db.transaction((data) => {
      // Create user record
      const userStmt = db.prepare(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, phone_number, is_verified)
         VALUES (?, ?, ?, ?, 'student', ?, 1)`
      );
      const userResult = userStmt.run(data.email, data.passwordHash, data.first_name, data.last_name, data.phone_number);
      const userId = userResult.lastInsertRowid;

      // Create student record
      const studentStmt = db.prepare(
        `INSERT INTO students (user_id, student_id, class_id, parent_id, allow_parent_access)
         VALUES (?, ?, ?, ?, 0)`
      );
      studentStmt.run(userId, data.student_id, data.class_id, data.parent_id);

      // Get the created records
      const userSelectStmt = db.prepare(
        `SELECT id, email, first_name, last_name, role, phone_number, created_at FROM users WHERE id = ?`
      );
      const user = userSelectStmt.get(userId);

      const studentSelectStmt = db.prepare(
        `SELECT id, student_id, class_id, parent_id, allow_parent_access, created_at FROM students WHERE user_id = ?`
      );
      const student = studentSelectStmt.get(userId);

      return {
        ...user,
        student,
      };
    });

    // Execute the transaction with the data
    return createStudentTransaction({
      email,
      passwordHash,
      first_name,
      last_name,
      phone_number,
      student_id,
      class_id,
      parent_id,
    });
  }

  /**
   * Find student by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Student object or null
   */
  static async findByUserId(userId) {
    const result = await query(
      `SELECT s.id, s.student_id, s.class_id, s.parent_id, s.allow_parent_access, s.created_at,
              u.id as user_id, u.email, u.first_name, u.last_name, u.phone_number, u.is_verified,
              c.class_name, c.subject, c.academic_year,
              t.id as teacher_id,
              tu.first_name as teacher_first_name, tu.last_name as teacher_last_name
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       INNER JOIN classes c ON c.id = s.class_id
       INNER JOIN teachers t ON t.id = c.teacher_id
       INNER JOIN users tu ON tu.id = t.user_id
       WHERE s.user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find student by ID
   * @param {number} id - Student ID
   * @returns {Promise<Object|null>} Student object or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT s.id, s.user_id, s.student_id, s.class_id, s.parent_id, s.allow_parent_access, s.created_at,
              u.email, u.first_name, u.last_name, u.phone_number, u.is_verified,
              c.class_name, c.subject, c.academic_year
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       INNER JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find student by student ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Object|null>} Student object or null
   */
  static async findByStudentId(studentId) {
    const result = await query(
      `SELECT s.id, s.user_id, s.student_id, s.class_id, s.parent_id, s.allow_parent_access,
              u.email, u.first_name, u.last_name, u.phone_number
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       WHERE s.student_id = $1`,
      [studentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get students by class ID
   * @param {number} classId - Class ID
   * @param {Object} pagination - Pagination params
   * @returns {Promise<Object>} Students and total count
   */
  static async findByClassId(classId, pagination = {}) {
    const { limit = 50, offset = 0 } = pagination;

    const result = await query(
      `SELECT s.id, s.user_id, s.student_id, s.allow_parent_access, s.created_at,
              u.email, u.first_name, u.last_name, u.phone_number,
              calc.current_total, calc.percentage, calc.grade_letter
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       LEFT JOIN calculations calc ON calc.student_id = s.id AND calc.class_id = s.class_id
       WHERE s.class_id = $1
       ORDER BY u.last_name, u.first_name
       LIMIT $2 OFFSET $3`,
      [classId, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM students WHERE class_id = $1`,
      [classId]
    );

    return {
      students: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Update parent access permission
   * @param {number} studentId - Student ID
   * @param {boolean} allowAccess - Allow parent access
   * @returns {Promise<Object>} Updated student
   */
  static async updateParentAccess(studentId, allowAccess) {
    return await transaction(async (client) => {
      const result = await client.query(
        `UPDATE students
         SET allow_parent_access = $1
         WHERE id = $2
         RETURNING id, student_id, parent_id, allow_parent_access`,
        [allowAccess, studentId]
      );

      const student = result.rows[0];

      // Log the access change
      if (student.parent_id) {
        if (allowAccess) {
          // Grant access
          await client.query(
            `INSERT INTO parent_access_log (parent_id, student_id, permission_status)
             VALUES ($1, $2, 'active')
             ON CONFLICT DO NOTHING`,
            [student.parent_id, studentId]
          );
        } else {
          // Revoke access
          await client.query(
            `UPDATE parent_access_log
             SET permission_status = 'revoked', access_revoked_at = CURRENT_TIMESTAMP
             WHERE parent_id = $1 AND student_id = $2 AND permission_status = 'active'`,
            [student.parent_id, studentId]
          );
        }
      }

      return student;
    });
  }

  /**
   * Link parent to student
   * @param {number} studentId - Student ID
   * @param {number} parentId - Parent ID
   * @returns {Promise<Object>} Updated student
   */
  static async linkParent(studentId, parentId) {
    const result = await query(
      `UPDATE students
       SET parent_id = $1
       WHERE id = $2
       RETURNING id, student_id, parent_id, allow_parent_access`,
      [parentId, studentId]
    );

    return result.rows[0];
  }

  /**
   * Get student's marks with details
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Student's marks
   */
  static async getMarks(studentId) {
    const result = await query(
      `SELECT m.id, m.assessment_date, m.score, m.max_score, m.teacher_comment, m.status, m.entered_at,
              a.type_name, a.weight, a.max_score as assessment_max_score,
              c.class_name, c.subject,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM marks m
       INNER JOIN assessment_types a ON a.id = m.assessment_id
       INNER JOIN students s ON s.id = m.student_id
       INNER JOIN classes c ON c.id = s.class_id
       INNER JOIN teachers t ON t.id = m.entered_by_teacher_id
       INNER JOIN users u ON u.id = t.user_id
       WHERE m.student_id = $1 AND m.status = 'published'
       ORDER BY m.assessment_date DESC`,
      [studentId]
    );

    return result.rows;
  }

  /**
   * Get student's current calculation
   * @param {number} studentId - Student ID
   * @returns {Promise<Object|null>} Current calculation or null
   */
  static async getCalculation(studentId) {
    const result = await query(
      `SELECT c.id, c.current_total, c.percentage, c.grade_letter, c.breakdown, c.last_calculated
       FROM calculations c
       INNER JOIN students s ON s.id = c.student_id
       WHERE c.student_id = $1 AND c.class_id = s.class_id`,
      [studentId]
    );

    return result.rows[0] || null;
  }

  /**
   * Get student's active alerts
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Active alerts
   */
  static async getAlerts(studentId) {
    const result = await query(
      `SELECT a.id, a.alert_type, a.severity, a.message, a.created_at
       FROM alerts a
       WHERE a.student_id = $1 AND a.is_dismissed = 0
       ORDER BY a.severity DESC, a.created_at DESC`,
      [studentId]
    );

    return result.rows;
  }

  /**
   * Get student statistics
   * @param {number} studentId - Student ID
   * @returns {Promise<Object>} Student statistics
   */
  static async getStatistics(studentId) {
    const markCountResult = await query(
      `SELECT COUNT(*) as total_marks FROM marks WHERE student_id = $1 AND status = 'published'`,
      [studentId]
    );

    const avgScoreResult = await query(
      `SELECT AVG(score) as average_score FROM marks WHERE student_id = $1 AND status = 'published'`,
      [studentId]
    );

    const alertCountResult = await query(
      `SELECT COUNT(*) as active_alerts FROM alerts WHERE student_id = $1 AND is_dismissed = 0`,
      [studentId]
    );

    const calculation = await this.getCalculation(studentId);

    return {
      total_marks: parseInt(markCountResult.rows[0].total_marks),
      average_score: parseFloat(avgScoreResult.rows[0].average_score || 0).toFixed(2),
      active_alerts: parseInt(alertCountResult.rows[0].active_alerts),
      current_grade: calculation ? {
        total: calculation.current_total,
        percentage: calculation.percentage,
        letter: calculation.grade_letter,
      } : null,
    };
  }

  /**
   * Update student info
   * @param {number} studentId - Student ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated student
   */
  static async update(studentId, updates) {
    const { class_id } = updates;

    const result = await query(
      `UPDATE students
       SET class_id = COALESCE($1, class_id)
       WHERE id = $2
       RETURNING id, student_id, class_id, parent_id, allow_parent_access`,
      [class_id, studentId]
    );

    return result.rows[0];
  }

  /**
   * Delete student
   * @param {number} studentId - Student ID
   * @returns {Promise<void>}
   */
  static async delete(studentId) {
    await transaction(async (client) => {
      // Get user ID
      const userResult = await client.query(
        `SELECT user_id FROM students WHERE id = $1`,
        [studentId]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;

        // Delete student record (will cascade to marks, calculations, alerts)
        await client.query(`DELETE FROM students WHERE id = $1`, [studentId]);

        // Delete user record
        await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
      }
    });
  }
}

module.exports = Student;
