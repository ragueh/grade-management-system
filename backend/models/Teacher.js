const { query, db } = require('../config/database');
const User = require('./User');

class Teacher {
  /**
   * Create a new teacher (including user record)
   * @param {Object} teacherData - Teacher data
   * @returns {Promise<Object>} Created teacher with user info
   */
  static async create(teacherData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      employee_id,
      department,
    } = teacherData;

    // Hash password before transaction (async operation)
    const passwordHash = await require('../utils/helpers').hashPassword(password);

    // Use better-sqlite3's transaction properly with a synchronous function
    const createTeacherTransaction = db.transaction((data) => {
      // Create user record
      const userStmt = db.prepare(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, phone_number, is_verified)
         VALUES (?, ?, ?, ?, 'teacher', ?, 0)`
      );
      const userResult = userStmt.run(data.email, data.passwordHash, data.first_name, data.last_name, data.phone_number);
      const userId = userResult.lastInsertRowid;

      // Create teacher record
      const teacherStmt = db.prepare(
        `INSERT INTO teachers (user_id, employee_id, department, is_approved_by_admin)
         VALUES (?, ?, ?, 0)`
      );
      teacherStmt.run(userId, data.employee_id, data.department);

      // Get the created records
      const userSelectStmt = db.prepare(
        `SELECT id, email, first_name, last_name, role, phone_number, created_at FROM users WHERE id = ?`
      );
      const user = userSelectStmt.get(userId);

      const teacherSelectStmt = db.prepare(
        `SELECT id, employee_id, department, is_approved_by_admin, created_at FROM teachers WHERE user_id = ?`
      );
      const teacher = teacherSelectStmt.get(userId);

      return {
        ...user,
        teacher,
      };
    });

    // Execute the transaction with the data
    return createTeacherTransaction({
      email,
      passwordHash,
      first_name,
      last_name,
      phone_number,
      employee_id,
      department,
    });
  }

  /**
   * Find teacher by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Teacher object or null
   */
  static async findByUserId(userId) {
    const result = await query(
      `SELECT t.id, t.employee_id, t.department, t.is_approved_by_admin, t.created_at,
              u.id as user_id, u.email, u.first_name, u.last_name, u.phone_number, u.is_verified
       FROM teachers t
       INNER JOIN users u ON u.id = t.user_id
       WHERE t.user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find teacher by ID
   * @param {number} id - Teacher ID
   * @returns {Promise<Object|null>} Teacher object or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT t.id, t.user_id, t.employee_id, t.department, t.is_approved_by_admin, t.created_at,
              u.email, u.first_name, u.last_name, u.phone_number, u.is_verified
       FROM teachers t
       INNER JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all teachers (for admin)
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination params
   * @returns {Promise<Object>} Teachers and total count
   */
  static async findAll(filters = {}, pagination = {}) {
    const { approved, verified } = filters;
    const { limit = 20, offset = 0 } = pagination;

    let whereClause = [];
    let params = [];
    let paramCount = 1;

    if (approved !== undefined) {
      whereClause.push(`t.is_approved_by_admin = $${paramCount}`);
      params.push(approved);
      paramCount++;
    }

    if (verified !== undefined) {
      whereClause.push(`u.is_verified = $${paramCount}`);
      params.push(verified);
      paramCount++;
    }

    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await query(
      `SELECT t.id, t.user_id, t.employee_id, t.department, t.is_approved_by_admin, t.created_at,
              u.email, u.first_name, u.last_name, u.phone_number, u.is_verified
       FROM teachers t
       INNER JOIN users u ON u.id = t.user_id
       ${whereSQL}
       ORDER BY t.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...params, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM teachers t
       INNER JOIN users u ON u.id = t.user_id
       ${whereSQL}`,
      params
    );

    return {
      teachers: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Approve teacher by admin
   * @param {number} teacherId - Teacher ID
   * @returns {Promise<Object>} Updated teacher
   */
  static async approve(teacherId) {
    const result = await query(
      `UPDATE teachers
       SET is_approved_by_admin = TRUE
       WHERE id = $1
       RETURNING id, employee_id, department, is_approved_by_admin`,
      [teacherId]
    );

    return result.rows[0];
  }

  /**
   * Revoke teacher approval
   * @param {number} teacherId - Teacher ID
   * @returns {Promise<Object>} Updated teacher
   */
  static async revokeApproval(teacherId) {
    const result = await query(
      `UPDATE teachers
       SET is_approved_by_admin = FALSE
       WHERE id = $1
       RETURNING id, employee_id, department, is_approved_by_admin`,
      [teacherId]
    );

    return result.rows[0];
  }

  /**
   * Get teacher's classes
   * @param {number} teacherId - Teacher ID
   * @returns {Promise<Array>} Teacher's classes
   */
  static async getClasses(teacherId) {
    const result = await query(
      `SELECT c.id, c.class_name, c.subject, c.academic_year, c.is_active, c.created_at,
              COUNT(DISTINCT s.id) as student_count
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id
       WHERE c.teacher_id = $1 AND c.is_active = TRUE
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [teacherId]
    );

    return result.rows;
  }

  /**
   * Get teacher statistics
   * @param {number} teacherId - Teacher ID
   * @returns {Promise<Object>} Teacher statistics
   */
  static async getStatistics(teacherId) {
    const classCountResult = await query(
      `SELECT COUNT(*) as total_classes FROM classes WHERE teacher_id = $1 AND is_active = TRUE`,
      [teacherId]
    );

    const studentCountResult = await query(
      `SELECT COUNT(DISTINCT s.id) as total_students
       FROM students s
       INNER JOIN classes c ON c.id = s.class_id
       WHERE c.teacher_id = $1 AND c.is_active = TRUE`,
      [teacherId]
    );

    const markCountResult = await query(
      `SELECT COUNT(*) as total_marks
       FROM marks
       WHERE entered_by_teacher_id = $1`,
      [teacherId]
    );

    const alertCountResult = await query(
      `SELECT COUNT(*) as active_alerts
       FROM alerts a
       INNER JOIN students s ON s.id = a.student_id
       INNER JOIN classes c ON c.id = s.class_id
       WHERE c.teacher_id = $1 AND a.is_dismissed = 0`,
      [teacherId]
    );

    return {
      total_classes: parseInt(classCountResult.rows[0].total_classes),
      total_students: parseInt(studentCountResult.rows[0].total_students),
      total_marks: parseInt(markCountResult.rows[0].total_marks),
      active_alerts: parseInt(alertCountResult.rows[0].active_alerts),
    };
  }

  /**
   * Update teacher info
   * @param {number} teacherId - Teacher ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated teacher
   */
  static async update(teacherId, updates) {
    const { department, employee_id } = updates;

    const result = await query(
      `UPDATE teachers
       SET department = COALESCE($1, department),
           employee_id = COALESCE($2, employee_id)
       WHERE id = $3
       RETURNING id, employee_id, department, is_approved_by_admin`,
      [department, employee_id, teacherId]
    );

    return result.rows[0];
  }

  /**
   * Delete teacher (soft delete - archive classes)
   * @param {number} teacherId - Teacher ID
   * @returns {Promise<void>}
   */
  static async delete(teacherId) {
    transaction((client) => {
      // Archive all classes
      client.query(
        `UPDATE classes SET is_active = 0 WHERE teacher_id = $1`,
        [teacherId]
      );

      // Get user ID
      const userResult = client.query(
        `SELECT user_id FROM teachers WHERE id = $1`,
        [teacherId]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;

        // Delete teacher record (will cascade)
        client.query(`DELETE FROM teachers WHERE id = $1`, [teacherId]);

        // Delete user record
        client.query(`DELETE FROM users WHERE id = $1`, [userId]);
      }
    });
  }
}

module.exports = Teacher;
