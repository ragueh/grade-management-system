const { query, transaction } = require('../config/database');
const { MARKING_SYSTEM } = require('../config/constants');

class Assessment {
  /**
   * Create a new assessment type
   * @param {Object} assessmentData - Assessment data
   * @returns {Promise<Object>} Created assessment
   */
  static async create(assessmentData) {
    const { class_id, type_name, weight, max_score = MARKING_SYSTEM.MAX_SCORE, display_order = 0 } = assessmentData;

    return await transaction(async (client) => {
      // Check if total weight will exceed 100%
      const weightCheckResult = await client.query(
        `SELECT COALESCE(SUM(weight), 0) as total_weight
         FROM assessment_types
         WHERE class_id = $1 AND is_active = TRUE`,
        [class_id]
      );

      const currentTotal = parseFloat(weightCheckResult.rows[0].total_weight);
      const newTotal = currentTotal + parseFloat(weight);

      if (newTotal > 100.01) { // Allow small floating point error
        throw new Error(`Total weight would exceed 100%. Current: ${currentTotal}%, Adding: ${weight}%, Total: ${newTotal}%`);
      }

      // Create assessment
      const result = await client.query(
        `INSERT INTO assessment_types (class_id, type_name, weight, max_score, display_order, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)
         RETURNING id, class_id, type_name, weight, max_score, display_order, is_active, created_at`,
        [class_id, type_name, weight, max_score, display_order]
      );

      return result.rows[0];
    });
  }

  /**
   * Find assessment by ID
   * @param {number} id - Assessment ID
   * @returns {Promise<Object|null>} Assessment object or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT a.id, a.class_id, a.type_name, a.weight, a.max_score, a.display_order, a.is_active, a.created_at,
              c.class_name, c.subject,
              COUNT(DISTINCT m.id) as total_marks
       FROM assessment_types a
       INNER JOIN classes c ON c.id = a.class_id
       LEFT JOIN marks m ON m.assessment_id = a.id
       WHERE a.id = $1
       GROUP BY a.id, c.id`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Find assessments by class ID
   * @param {number} classId - Class ID
   * @param {boolean} activeOnly - Return only active assessments
   * @returns {Promise<Array>} Assessments
   */
  static async findByClassId(classId, activeOnly = true) {
    const whereClause = activeOnly ? 'AND a.is_active = TRUE' : '';

    const result = await query(
      `SELECT a.id, a.class_id, a.type_name, a.weight, a.max_score, a.display_order, a.is_active, a.created_at,
              COUNT(DISTINCT m.id) as total_marks
       FROM assessment_types a
       LEFT JOIN marks m ON m.assessment_id = a.id
       WHERE a.class_id = $1 ${whereClause}
       GROUP BY a.id
       ORDER BY a.display_order, a.created_at`,
      [classId]
    );

    return result.rows;
  }

  /**
   * Update assessment type
   * @param {number} id - Assessment ID
   * @param {Object} updates - Fields to update
   * @param {number} teacherId - Teacher ID (for logging weight changes)
   * @returns {Promise<Object>} Updated assessment
   */
  static async update(id, updates, teacherId) {
    const { type_name, weight, display_order, is_active } = updates;

    return await transaction(async (client) => {
      // Get current assessment
      const currentResult = await client.query(
        `SELECT * FROM assessment_types WHERE id = $1`,
        [id]
      );

      if (currentResult.rows.length === 0) {
        throw new Error('Assessment not found');
      }

      const current = currentResult.rows[0];

      // If weight is being updated, check if total will exceed 100%
      if (weight !== undefined && parseFloat(weight) !== parseFloat(current.weight)) {
        const weightCheckResult = await client.query(
          `SELECT COALESCE(SUM(weight), 0) as total_weight
           FROM assessment_types
           WHERE class_id = $1 AND is_active = TRUE AND id != $2`,
          [current.class_id, id]
        );

        const otherWeights = parseFloat(weightCheckResult.rows[0].total_weight);
        const newTotal = otherWeights + parseFloat(weight);

        if (newTotal > 100.01) {
          throw new Error(`Total weight would exceed 100%. Current (excluding this): ${otherWeights}%, New: ${weight}%, Total: ${newTotal}%`);
        }

        // Log weight change
        await client.query(
          `INSERT INTO assessment_weight_history (class_id, assessment_id, old_weight, new_weight, changed_by_teacher_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [current.class_id, id, current.weight, weight, teacherId]
        );
      }

      // Update assessment
      const result = await client.query(
        `UPDATE assessment_types
         SET type_name = COALESCE($1, type_name),
             weight = COALESCE($2, weight),
             display_order = COALESCE($3, display_order),
             is_active = COALESCE($4, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING id, class_id, type_name, weight, max_score, display_order, is_active, updated_at`,
        [type_name, weight, display_order, is_active, id]
      );

      return result.rows[0];
    });
  }

  /**
   * Delete assessment type
   * @param {number} id - Assessment ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    await query('DELETE FROM assessment_types WHERE id = $1', [id]);
  }

  /**
   * Deactivate assessment (soft delete)
   * @param {number} id - Assessment ID
   * @returns {Promise<void>}
   */
  static async deactivate(id) {
    await query(
      `UPDATE assessment_types
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Get total weight for a class
   * @param {number} classId - Class ID
   * @returns {Promise<number>} Total weight
   */
  static async getTotalWeight(classId) {
    const result = await query(
      `SELECT COALESCE(SUM(weight), 0) as total_weight
       FROM assessment_types
       WHERE class_id = $1 AND is_active = TRUE`,
      [classId]
    );

    return parseFloat(result.rows[0].total_weight);
  }

  /**
   * Validate that weights sum to 100%
   * @param {number} classId - Class ID
   * @returns {Promise<Object>} Validation result
   */
  static async validateWeights(classId) {
    const totalWeight = await this.getTotalWeight(classId);

    return {
      is_valid: Math.abs(totalWeight - 100) < 0.01, // Allow small floating point error
      total_weight: totalWeight,
      remaining: parseFloat((100 - totalWeight).toFixed(2)),
    };
  }

  /**
   * Get weight change history for a class
   * @param {number} classId - Class ID
   * @returns {Promise<Array>} Weight change history
   */
  static async getWeightHistory(classId) {
    const result = await query(
      `SELECT h.id, h.old_weight, h.new_weight, h.changed_at,
              a.type_name,
              u.first_name as teacher_first_name, u.last_name as teacher_last_name
       FROM assessment_weight_history h
       INNER JOIN assessment_types a ON a.id = h.assessment_id
       INNER JOIN teachers t ON t.id = h.changed_by_teacher_id
       INNER JOIN users u ON u.id = t.user_id
       WHERE h.class_id = $1
       ORDER BY h.changed_at DESC`,
      [classId]
    );

    return result.rows;
  }

  /**
   * Reorder assessments
   * @param {Array} orderArray - Array of {id, display_order} objects
   * @returns {Promise<void>}
   */
  static async reorder(orderArray) {
    return await transaction(async (client) => {
      for (const item of orderArray) {
        await client.query(
          `UPDATE assessment_types
           SET display_order = $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.display_order, item.id]
        );
      }
    });
  }

  /**
   * Get assessment statistics
   * @param {number} assessmentId - Assessment ID
   * @returns {Promise<Object>} Assessment statistics
   */
  static async getStatistics(assessmentId) {
    const result = await query(
      `SELECT
         COUNT(m.id) as total_submissions,
         AVG(m.score) as average_score,
         MIN(m.score) as lowest_score,
         MAX(m.score) as highest_score,
         COUNT(CASE WHEN m.score >= 18 THEN 1 END) as excellent_count,
         COUNT(CASE WHEN m.score < 12 THEN 1 END) as needs_improvement_count
       FROM marks m
       WHERE m.assessment_id = $1 AND m.status = 'published'`,
      [assessmentId]
    );

    return result.rows[0];
  }

  /**
   * Check if assessment belongs to class
   * @param {number} assessmentId - Assessment ID
   * @param {number} classId - Class ID
   * @returns {Promise<boolean>} Belongs to class
   */
  static async belongsToClass(assessmentId, classId) {
    const result = await query(
      `SELECT id FROM assessment_types WHERE id = $1 AND class_id = $2`,
      [assessmentId, classId]
    );

    return result.rows.length > 0;
  }
}

module.exports = Assessment;
