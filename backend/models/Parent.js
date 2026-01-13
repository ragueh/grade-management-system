const { query, db } = require('../config/database');
const User = require('./User');

class Parent {
  /**
   * Create a new parent (including user record)
   * @param {Object} parentData - Parent data
   * @returns {Promise<Object>} Created parent with user info
   */
  static async create(parentData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
    } = parentData;

    // Hash password before transaction (async operation)
    const passwordHash = await require('../utils/helpers').hashPassword(password);

    // Use better-sqlite3's transaction properly with a synchronous function
    const createParentTransaction = db.transaction((data) => {
      // Create user record
      const userStmt = db.prepare(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, phone_number, is_verified)
         VALUES (?, ?, ?, ?, 'parent', ?, 1)`
      );
      const userResult = userStmt.run(data.email, data.passwordHash, data.first_name, data.last_name, data.phone_number);
      const userId = userResult.lastInsertRowid;

      // Create parent record
      const parentStmt = db.prepare(
        `INSERT INTO parents (user_id) VALUES (?)`
      );
      const parentResult = parentStmt.run(userId);

      // Get the created records
      const userSelectStmt = db.prepare(
        `SELECT id, email, first_name, last_name, role, phone_number, created_at FROM users WHERE id = ?`
      );
      const user = userSelectStmt.get(userId);

      const parentSelectStmt = db.prepare(
        `SELECT id, created_at FROM parents WHERE user_id = ?`
      );
      const parent = parentSelectStmt.get(userId);

      return {
        ...user,
        parent,
      };
    });

    // Execute the transaction with the data
    return createParentTransaction({
      email,
      passwordHash,
      first_name,
      last_name,
      phone_number,
    });
  }

  /**
   * Find parent by user ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Parent object or null
   */
  static async findByUserId(userId) {
    const result = await query(
      `SELECT p.id, p.created_at,
              u.id as user_id, u.email, u.first_name, u.last_name, u.phone_number, u.is_verified
       FROM parents p
       INNER JOIN users u ON u.id = p.user_id
       WHERE p.user_id = $1`,
      [userId]
    );

    return result.rows[0] || null;
  }

  /**
   * Find parent by ID
   * @param {number} id - Parent ID
   * @returns {Promise<Object|null>} Parent object or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT p.id, p.user_id, p.created_at,
              u.email, u.first_name, u.last_name, u.phone_number, u.is_verified
       FROM parents p
       INNER JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get parent's children (students with granted access)
   * @param {number} parentId - Parent ID
   * @returns {Promise<Array>} Children with access
   */
  static async getChildren(parentId) {
    const result = await query(
      `SELECT s.id, s.student_id, s.allow_parent_access, s.created_at,
              u.first_name, u.last_name, u.email, u.phone_number,
              c.id as class_id, c.class_name, c.subject, c.academic_year,
              calc.current_total, calc.percentage, calc.grade_letter,
              pal.created_at as access_granted_at, pal.permission_status
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       INNER JOIN classes c ON c.id = s.class_id
       LEFT JOIN calculations calc ON calc.student_id = s.id AND calc.class_id = s.class_id
       LEFT JOIN parent_access_log pal ON pal.student_id = s.id AND pal.parent_id = $1
       WHERE s.parent_id = $2
       ORDER BY u.last_name, u.first_name`,
      [parentId, parentId]
    );

    return result.rows;
  }

  /**
   * Get accessible children (only those with granted access)
   * @param {number} parentId - Parent ID
   * @returns {Promise<Array>} Accessible children
   */
  static async getAccessibleChildren(parentId) {
    const result = await query(
      `SELECT s.id, s.student_id, s.created_at,
              u.first_name, u.last_name, u.email,
              c.id as class_id, c.class_name, c.subject, c.academic_year,
              calc.current_total, calc.percentage, calc.grade_letter
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       INNER JOIN classes c ON c.id = s.class_id
       LEFT JOIN calculations calc ON calc.student_id = s.id AND calc.class_id = s.class_id
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.parent_id = $1
       AND s.allow_parent_access = 1
       AND pal.permission_status = 'active'
       AND pal.parent_id = $2
       ORDER BY u.last_name, u.first_name`,
      [parentId, parentId]
    );

    return result.rows;
  }

  /**
   * Get child's marks (only if access granted)
   * @param {number} parentId - Parent ID
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Child's marks
   */
  static async getChildMarks(parentId, studentId) {
    // First verify access
    const accessCheck = await query(
      `SELECT s.id FROM students s
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.id = $1 AND s.parent_id = $2
       AND s.allow_parent_access = 1
       AND pal.permission_status = 'active'`,
      [studentId, parentId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied - Student has not granted permission');
    }

    // Get marks
    const result = await query(
      `SELECT m.id, m.assessment_date, m.score, m.max_score, m.teacher_comment, m.entered_at,
              a.type_name, a.weight,
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
   * Get child's calculation (only if access granted)
   * @param {number} parentId - Parent ID
   * @param {number} studentId - Student ID
   * @returns {Promise<Object|null>} Child's calculation
   */
  static async getChildCalculation(parentId, studentId) {
    // First verify access
    const accessCheck = await query(
      `SELECT s.id FROM students s
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.id = $1 AND s.parent_id = $2
       AND s.allow_parent_access = 1
       AND pal.permission_status = 'active'`,
      [studentId, parentId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied - Student has not granted permission');
    }

    // Get calculation
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
   * Get child's alerts (only if access granted)
   * @param {number} parentId - Parent ID
   * @param {number} studentId - Student ID
   * @returns {Promise<Array>} Child's active alerts
   */
  static async getChildAlerts(parentId, studentId) {
    // First verify access
    const accessCheck = await query(
      `SELECT s.id FROM students s
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.id = $1 AND s.parent_id = $2
       AND s.allow_parent_access = 1
       AND pal.permission_status = 'active'`,
      [studentId, parentId]
    );

    if (accessCheck.rows.length === 0) {
      throw new Error('Access denied - Student has not granted permission');
    }

    // Get alerts
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
   * Get parent statistics (summary of all children)
   * @param {number} parentId - Parent ID
   * @returns {Promise<Object>} Parent statistics
   */
  static async getStatistics(parentId) {
    const childrenCountResult = await query(
      `SELECT COUNT(*) as total_children FROM students WHERE parent_id = $1`,
      [parentId]
    );

    const accessibleCountResult = await query(
      `SELECT COUNT(*) as accessible_children
       FROM students s
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.parent_id = $1
       AND s.allow_parent_access = 1
       AND pal.permission_status = 'active'`,
      [parentId]
    );

    const alertsCountResult = await query(
      `SELECT COUNT(*) as total_alerts
       FROM alerts a
       INNER JOIN students s ON s.id = a.student_id
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.parent_id = $1
       AND s.allow_parent_access = 1
       AND pal.permission_status = 'active'
       AND a.is_dismissed = 0`,
      [parentId]
    );

    return {
      total_children: parseInt(childrenCountResult.rows[0].total_children),
      accessible_children: parseInt(accessibleCountResult.rows[0].accessible_children),
      total_alerts: parseInt(alertsCountResult.rows[0].total_alerts),
    };
  }

  /**
   * Check if parent has access to student
   * @param {number} parentId - Parent ID
   * @param {number} studentId - Student ID
   * @returns {Promise<boolean>} Has access
   */
  static async hasAccessToStudent(parentId, studentId) {
    const result = await query(
      `SELECT s.id FROM students s
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.id = $1 AND s.parent_id = $2
       AND s.allow_parent_access = 1
       AND pal.permission_status = 'active'`,
      [studentId, parentId]
    );

    return result.rows.length > 0;
  }

  /**
   * Delete parent
   * @param {number} parentId - Parent ID
   * @returns {Promise<void>}
   */
  static async delete(parentId) {
    await transaction(async (client) => {
      // Get user ID
      const userResult = await client.query(
        `SELECT user_id FROM parents WHERE id = $1`,
        [parentId]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].user_id;

        // Unlink students
        await client.query(
          `UPDATE students SET parent_id = NULL WHERE parent_id = $1`,
          [parentId]
        );

        // Delete parent record (will cascade to access logs)
        await client.query(`DELETE FROM parents WHERE id = $1`, [parentId]);

        // Delete user record
        await client.query(`DELETE FROM users WHERE id = $1`, [userId]);
      }
    });
  }
}

module.exports = Parent;
