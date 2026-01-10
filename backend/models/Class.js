const { query, transaction } = require('../config/database');

class Class {
  /**
   * Create a new class
   * @param {Object} classData - Class data
   * @returns {Promise<Object>} Created class
   */
  static async create(classData) {
    const { teacher_id, class_name, subject, academic_year } = classData;

    const result = await query(
      `INSERT INTO classes (teacher_id, class_name, subject, academic_year, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, teacher_id, class_name, subject, academic_year, is_active, created_at`,
      [teacher_id, class_name, subject, academic_year]
    );

    return result.rows[0];
  }

  /**
   * Find class by ID
   * @param {number} id - Class ID
   * @returns {Promise<Object|null>} Class object or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT c.id, c.teacher_id, c.class_name, c.subject, c.academic_year, c.is_active, c.created_at,
              t.employee_id, u.first_name as teacher_first_name, u.last_name as teacher_last_name,
              COUNT(DISTINCT s.id) as student_count,
              COUNT(DISTINCT a.id) as assessment_count
       FROM classes c
       INNER JOIN teachers t ON t.id = c.teacher_id
       INNER JOIN users u ON u.id = t.user_id
       LEFT JOIN students s ON s.class_id = c.id
       LEFT JOIN assessment_types a ON a.class_id = c.id AND a.is_active = 1
       WHERE c.id = $1
       GROUP BY c.id, t.id, t.employee_id, u.first_name, u.last_name`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find classes by teacher ID
   * @param {number} teacherId - Teacher ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Classes
   */
  static async findByTeacherId(teacherId, filters = {}) {
    const { is_active = true } = filters;

    const result = await query(
      `SELECT c.id, c.class_name, c.subject, c.academic_year, c.is_active, c.created_at,
              COUNT(DISTINCT s.id) as student_count,
              COUNT(DISTINCT a.id) as assessment_count,
              COUNT(DISTINCT m.id) as total_marks
       FROM classes c
       LEFT JOIN students s ON s.class_id = c.id
       LEFT JOIN assessment_types a ON a.class_id = c.id AND a.is_active = 1
       LEFT JOIN marks m ON m.student_id = s.id
       WHERE c.teacher_id = $1 AND c.is_active = $2
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [teacherId, is_active ? 1 : 0]
    );

    return result.rows;
  }

  /**
   * Get class students with their current grades
   * @param {number} classId - Class ID
   * @returns {Promise<Array>} Students with grades
   */
  static async getStudentsWithGrades(classId) {
    const result = await query(
      `SELECT s.id, s.student_id,
              u.first_name, u.last_name, u.email,
              calc.current_total, calc.percentage, calc.grade_letter,
              COUNT(m.id) as total_marks,
              COUNT(CASE WHEN a.is_dismissed = 0 THEN 1 END) as active_alerts
       FROM students s
       INNER JOIN users u ON u.id = s.user_id
       LEFT JOIN calculations calc ON calc.student_id = s.id AND calc.class_id = s.class_id
       LEFT JOIN marks m ON m.student_id = s.id
       LEFT JOIN alerts a ON a.student_id = s.id
       WHERE s.class_id = $1
       GROUP BY s.id, u.id, calc.id
       ORDER BY u.last_name, u.first_name`,
      [classId]
    );

    return result.rows;
  }

  /**
   * Get class statistics
   * @param {number} classId - Class ID
   * @returns {Promise<Object>} Class statistics
   */
  static async getStatistics(classId) {
    // Student count
    const studentCountResult = await query(
      `SELECT COUNT(*) as total_students FROM students WHERE class_id = $1`,
      [classId]
    );

    // Average class grade
    const avgGradeResult = await query(
      `SELECT AVG(current_total) as class_average
       FROM calculations
       WHERE class_id = $1`,
      [classId]
    );

    // Grade distribution
    const gradeDistResult = await query(
      `SELECT grade_letter, COUNT(*) as count
       FROM calculations
       WHERE class_id = $1
       GROUP BY grade_letter
       ORDER BY grade_letter`,
      [classId]
    );

    // Active alerts count
    const alertCountResult = await query(
      `SELECT COUNT(*) as active_alerts
       FROM alerts
       WHERE student_id IN (SELECT id FROM students WHERE class_id = $1) AND is_dismissed = 0`,
      [classId]
    );

    // Assessment completion rate
    const completionResult = await query(
      `SELECT
         COUNT(DISTINCT a.id) as total_assessments,
         COUNT(DISTINCT m.assessment_id) as completed_assessments,
         COUNT(DISTINCT s.id) as total_students,
         COUNT(m.id) as total_marks
       FROM assessment_types a
       CROSS JOIN students s
       LEFT JOIN marks m ON m.assessment_id = a.id AND m.student_id = s.id
       WHERE a.class_id = $1 AND s.class_id = $1 AND a.is_active = 1`,
      [classId]
    );

    const completion = completionResult.rows[0];
    const expectedMarks = parseInt(completion.total_assessments) * parseInt(completion.total_students);
    const completionRate = expectedMarks > 0
      ? ((parseInt(completion.total_marks) / expectedMarks) * 100).toFixed(2)
      : 0;

    return {
      total_students: parseInt(studentCountResult.rows[0].total_students),
      class_average: parseFloat(avgGradeResult.rows[0].class_average || 0).toFixed(2),
      grade_distribution: gradeDistResult.rows.reduce((acc, row) => {
        acc[row.grade_letter] = parseInt(row.count);
        return acc;
      }, {}),
      active_alerts: parseInt(alertCountResult.rows[0].active_alerts),
      completion_rate: completionRate,
    };
  }

  /**
   * Update class
   * @param {number} id - Class ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated class
   */
  static async update(id, updates) {
    const { class_name, subject, academic_year, is_active } = updates;

    const result = await query(
      `UPDATE classes
       SET class_name = COALESCE($1, class_name),
           subject = COALESCE($2, subject),
           academic_year = COALESCE($3, academic_year),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, teacher_id, class_name, subject, academic_year, is_active, updated_at`,
      [class_name, subject, academic_year, is_active, id]
    );

    return result.rows[0];
  }

  /**
   * Archive class (soft delete)
   * @param {number} id - Class ID
   * @returns {Promise<void>}
   */
  static async archive(id) {
    await query(
      `UPDATE classes
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Delete class (hard delete - use with caution)
   * @param {number} id - Class ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    await query('DELETE FROM classes WHERE id = $1', [id]);
  }

  /**
   * Get class performance summary
   * @param {number} classId - Class ID
   * @returns {Promise<Object>} Performance summary
   */
  static async getPerformanceSummary(classId) {
    const result = await query(
      `SELECT
         COUNT(DISTINCT s.id) as total_students,
         AVG(calc.current_total) as average_grade,
         MIN(calc.current_total) as lowest_grade,
         MAX(calc.current_total) as highest_grade,
         COUNT(CASE WHEN calc.current_total >= 18 THEN 1 END) as grade_a_count,
         COUNT(CASE WHEN calc.current_total >= 16 AND calc.current_total < 18 THEN 1 END) as grade_b_count,
         COUNT(CASE WHEN calc.current_total >= 14 AND calc.current_total < 16 THEN 1 END) as grade_c_count,
         COUNT(CASE WHEN calc.current_total >= 12 AND calc.current_total < 14 THEN 1 END) as grade_d_count,
         COUNT(CASE WHEN calc.current_total < 12 THEN 1 END) as grade_f_count,
         COUNT(CASE WHEN calc.current_total < 12 THEN 1 END) as at_risk_students
       FROM students s
       LEFT JOIN calculations calc ON calc.student_id = s.id AND calc.class_id = s.class_id
       WHERE s.class_id = $1`,
      [classId]
    );

    return result.rows[0];
  }

  /**
   * Check if teacher owns the class
   * @param {number} classId - Class ID
   * @param {number} teacherId - Teacher ID
   * @returns {Promise<boolean>} Owns class
   */
  static async isOwnedByTeacher(classId, teacherId) {
    const result = await query(
      `SELECT id FROM classes WHERE id = $1 AND teacher_id = $2`,
      [classId, teacherId]
    );

    return result.rows.length > 0;
  }
}

module.exports = Class;
