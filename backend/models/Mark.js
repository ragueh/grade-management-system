const { query, transaction } = require('../config/database');
const { MARKING_SYSTEM, MARK_STATUS } = require('../config/constants');

class Mark {
  /**
   * Create a new mark
   * @param {Object} markData - Mark data
   * @returns {Promise<Object>} Created mark
   */
  static async create(markData) {
    const {
      student_id,
      assessment_id,
      assessment_date,
      score,
      max_score = MARKING_SYSTEM.MAX_SCORE,
      teacher_comment = null,
      entered_by_teacher_id,
      status = MARK_STATUS.PUBLISHED,
    } = markData;

    // Validate score
    if (score < MARKING_SYSTEM.MIN_SCORE || score > MARKING_SYSTEM.MAX_SCORE) {
      throw new Error(`Score must be between ${MARKING_SYSTEM.MIN_SCORE} and ${MARKING_SYSTEM.MAX_SCORE}`);
    }

    const result = await query(
      `INSERT INTO marks (student_id, assessment_id, assessment_date, score, max_score, teacher_comment, entered_by_teacher_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, student_id, assessment_id, assessment_date, score, max_score, teacher_comment, entered_by_teacher_id, status, entered_at`,
      [student_id, assessment_id, assessment_date, score, max_score, teacher_comment, entered_by_teacher_id, status]
    );

    return result.rows[0];
  }

  /**
   * Find mark by ID
   * @param {number} id - Mark ID
   * @returns {Promise<Object|null>} Mark object or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT m.id, m.student_id, m.assessment_id, m.assessment_date, m.score, m.max_score,
              m.teacher_comment, m.status, m.entered_at, m.modified_at, m.change_log,
              s.student_id as student_code,
              su.first_name as student_first_name, su.last_name as student_last_name,
              a.type_name, a.weight, a.class_id,
              c.class_name, c.subject,
              tu.first_name as teacher_first_name, tu.last_name as teacher_last_name
       FROM marks m
       INNER JOIN students s ON s.id = m.student_id
       INNER JOIN users su ON su.id = s.user_id
       INNER JOIN assessment_types a ON a.id = m.assessment_id
       INNER JOIN classes c ON c.id = a.class_id
       INNER JOIN teachers t ON t.id = m.entered_by_teacher_id
       INNER JOIN users tu ON tu.id = t.user_id
       WHERE m.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find marks by student ID
   * @param {number} studentId - Student ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Marks
   */
  static async findByStudentId(studentId, filters = {}) {
    const { status = MARK_STATUS.PUBLISHED, class_id = null } = filters;

    let whereClause = 'WHERE m.student_id = $1';
    const params = [studentId];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND m.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (class_id) {
      whereClause += ` AND a.class_id = $${paramCount}`;
      params.push(class_id);
      paramCount++;
    }

    const result = await query(
      `SELECT m.id, m.assessment_date, m.score, m.max_score, m.teacher_comment, m.status, m.entered_at,
              a.type_name, a.weight, a.class_id,
              c.class_name, c.subject,
              tu.first_name as teacher_first_name, tu.last_name as teacher_last_name
       FROM marks m
       INNER JOIN assessment_types a ON a.id = m.assessment_id
       INNER JOIN classes c ON c.id = a.class_id
       INNER JOIN teachers t ON t.id = m.entered_by_teacher_id
       INNER JOIN users tu ON tu.id = t.user_id
       ${whereClause}
       ORDER BY m.assessment_date DESC, a.display_order`,
      params
    );

    return result.rows;
  }

  /**
   * Find marks by assessment ID
   * @param {number} assessmentId - Assessment ID
   * @returns {Promise<Array>} Marks
   */
  static async findByAssessmentId(assessmentId) {
    const result = await query(
      `SELECT m.id, m.student_id, m.assessment_date, m.score, m.max_score, m.teacher_comment, m.status, m.entered_at,
              s.student_id as student_code,
              u.first_name as student_first_name, u.last_name as student_last_name, u.email as student_email
       FROM marks m
       INNER JOIN students s ON s.id = m.student_id
       INNER JOIN users u ON u.id = s.user_id
       WHERE m.assessment_id = $1 AND m.status = 'published'
       ORDER BY u.last_name, u.first_name`,
      [assessmentId]
    );

    return result.rows;
  }

  /**
   * Find marks by class ID
   * @param {number} classId - Class ID
   * @returns {Promise<Array>} Marks
   */
  static async findByClassId(classId) {
    const result = await query(
      `SELECT m.id, m.student_id, m.assessment_id, m.assessment_date, m.score, m.max_score, m.teacher_comment, m.status,
              s.student_id as student_code,
              su.first_name as student_first_name, su.last_name as student_last_name,
              a.type_name, a.weight
       FROM marks m
       INNER JOIN students s ON s.id = m.student_id
       INNER JOIN users su ON su.id = s.user_id
       INNER JOIN assessment_types a ON a.id = m.assessment_id
       WHERE s.class_id = $1 AND m.status = 'published'
       ORDER BY m.assessment_date DESC, su.last_name, su.first_name`,
      [classId]
    );

    return result.rows;
  }

  /**
   * Update mark
   * @param {number} id - Mark ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated mark
   */
  static async update(id, updates) {
    const { score, teacher_comment, status, assessment_date } = updates;

    // Validate score if provided
    if (score !== undefined && (score < MARKING_SYSTEM.MIN_SCORE || score > MARKING_SYSTEM.MAX_SCORE)) {
      throw new Error(`Score must be between ${MARKING_SYSTEM.MIN_SCORE} and ${MARKING_SYSTEM.MAX_SCORE}`);
    }

    const result = await query(
      `UPDATE marks
       SET score = COALESCE($1, score),
           teacher_comment = COALESCE($2, teacher_comment),
           status = COALESCE($3, status),
           assessment_date = COALESCE($4, assessment_date),
           modified_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, student_id, assessment_id, assessment_date, score, max_score, teacher_comment, status, modified_at`,
      [score, teacher_comment, status, assessment_date, id]
    );

    return result.rows[0];
  }

  /**
   * Delete mark
   * @param {number} id - Mark ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    await query('DELETE FROM marks WHERE id = $1', [id]);
  }

  /**
   * Get mark change history
   * @param {number} id - Mark ID
   * @returns {Promise<Array>} Change history
   */
  static async getChangeHistory(id) {
    const result = await query(
      `SELECT change_log FROM marks WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return [];
    }

    return result.rows[0].change_log || [];
  }

  /**
   * Check if mark exists for student and assessment
   * @param {number} studentId - Student ID
   * @param {number} assessmentId - Assessment ID
   * @param {string} assessmentDate - Assessment date
   * @returns {Promise<Object|null>} Existing mark or null
   */
  static async findDuplicate(studentId, assessmentId, assessmentDate) {
    const result = await query(
      `SELECT id FROM marks
       WHERE student_id = $1 AND assessment_id = $2 AND assessment_date = $3`,
      [studentId, assessmentId, assessmentDate]
    );

    return result.rows[0] || null;
  }

  /**
   * Bulk create marks
   * @param {Array} marksArray - Array of mark objects
   * @returns {Promise<Object>} Result with success and error counts
   */
  static async bulkCreate(marksArray) {
    return await transaction(async (client) => {
      const results = {
        success: [],
        errors: [],
      };

      for (const markData of marksArray) {
        try {
          // Check for duplicates
          const duplicateCheck = await client.query(
            `SELECT id FROM marks
             WHERE student_id = $1 AND assessment_id = $2 AND assessment_date = $3`,
            [markData.student_id, markData.assessment_id, markData.assessment_date]
          );

          if (duplicateCheck.rows.length > 0) {
            results.errors.push({
              data: markData,
              error: 'Duplicate entry - mark already exists for this student and assessment',
            });
            continue;
          }

          // Validate score
          if (markData.score < MARKING_SYSTEM.MIN_SCORE || markData.score > MARKING_SYSTEM.MAX_SCORE) {
            results.errors.push({
              data: markData,
              error: `Score must be between ${MARKING_SYSTEM.MIN_SCORE} and ${MARKING_SYSTEM.MAX_SCORE}`,
            });
            continue;
          }

          // Insert mark
          const result = await client.query(
            `INSERT INTO marks (student_id, assessment_id, assessment_date, score, max_score, teacher_comment, entered_by_teacher_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
              markData.student_id,
              markData.assessment_id,
              markData.assessment_date,
              markData.score,
              markData.max_score || MARKING_SYSTEM.MAX_SCORE,
              markData.teacher_comment || null,
              markData.entered_by_teacher_id,
              markData.status || MARK_STATUS.PUBLISHED,
            ]
          );

          results.success.push({
            id: result.rows[0].id,
            data: markData,
          });
        } catch (error) {
          results.errors.push({
            data: markData,
            error: error.message,
          });
        }
      }

      return results;
    });
  }

  /**
   * Get student's marks for a specific class grouped by assessment
   * @param {number} studentId - Student ID
   * @param {number} classId - Class ID
   * @returns {Promise<Array>} Marks grouped by assessment
   */
  static async getStudentMarksGrouped(studentId, classId) {
    const result = await query(
      `SELECT
         a.id as assessment_id,
         a.type_name,
         a.weight,
         a.display_order,
         m.id as mark_id,
         m.score,
         m.max_score,
         m.assessment_date,
         m.teacher_comment,
         m.entered_at
       FROM assessment_types a
       LEFT JOIN marks m ON m.assessment_id = a.id AND m.student_id = $1 AND m.status = 'published'
       WHERE a.class_id = $2 AND a.is_active = TRUE
       ORDER BY a.display_order, m.assessment_date DESC`,
      [studentId, classId]
    );

    return result.rows;
  }

  /**
   * Get recent marks for a student
   * @param {number} studentId - Student ID
   * @param {number} limit - Number of marks to return
   * @returns {Promise<Array>} Recent marks
   */
  static async getRecentMarks(studentId, limit = 10) {
    const result = await query(
      `SELECT m.id, m.assessment_date, m.score, m.max_score, m.teacher_comment, m.entered_at,
              a.type_name, a.weight,
              c.class_name, c.subject
       FROM marks m
       INNER JOIN assessment_types a ON a.id = m.assessment_id
       INNER JOIN students s ON s.id = m.student_id
       INNER JOIN classes c ON c.id = s.class_id
       WHERE m.student_id = $1 AND m.status = 'published'
       ORDER BY m.entered_at DESC
       LIMIT $2`,
      [studentId, limit]
    );

    return result.rows;
  }
}

module.exports = Mark;
