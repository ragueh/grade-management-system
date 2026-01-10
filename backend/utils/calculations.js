const { query, transaction } = require('../config/database');
const { getLetterGrade, scoreToPercentage, MARKING_SYSTEM } = require('../config/constants');

/**
 * Calculate weighted grade for a student in a class
 * @param {number} studentId - Student ID
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} Calculation result
 */
const calculateStudentGrade = async (studentId, classId) => {
  try {
    // Get all assessment types for the class with student's marks
    const result = await query(
      `SELECT
         a.id as assessment_id,
         a.type_name,
         a.weight,
         m.score,
         m.max_score
       FROM assessment_types a
       LEFT JOIN marks m ON m.assessment_id = a.id AND m.student_id = $1 AND m.status = 'published'
       WHERE a.class_id = $2 AND a.is_active = TRUE
       ORDER BY a.display_order`,
      [studentId, classId]
    );

    const assessments = result.rows;

    if (assessments.length === 0) {
      return {
        current_total: null,
        percentage: null,
        grade_letter: null,
        breakdown: {},
        has_all_marks: false,
      };
    }

    // Calculate weighted score
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const breakdown = {};
    let hasAllMarks = true;

    for (const assessment of assessments) {
      if (assessment.score !== null) {
        // Calculate normalized score (in case max_score != 20, though it should always be 20)
        const normalizedScore = (assessment.score / assessment.max_score) * MARKING_SYSTEM.MAX_SCORE;

        // Add weighted contribution
        totalWeightedScore += normalizedScore * (assessment.weight / 100);
        totalWeight += parseFloat(assessment.weight);

        breakdown[assessment.type_name] = {
          score: parseFloat(assessment.score),
          weight: parseFloat(assessment.weight),
          contribution: parseFloat((normalizedScore * (assessment.weight / 100)).toFixed(2)),
        };
      } else {
        hasAllMarks = false;
        breakdown[assessment.type_name] = {
          score: null,
          weight: parseFloat(assessment.weight),
          contribution: null,
        };
      }
    }

    // If no marks yet, return null
    if (totalWeight === 0) {
      return {
        current_total: null,
        percentage: null,
        grade_letter: null,
        breakdown,
        has_all_marks: false,
      };
    }

    // Calculate current total (out of 20)
    // If not all assessments completed, calculate based on completed ones
    const currentTotal = hasAllMarks
      ? totalWeightedScore
      : (totalWeightedScore / (totalWeight / 100)); // Adjust for incomplete assessments

    const percentage = (currentTotal / MARKING_SYSTEM.MAX_SCORE) * 100;
    const gradeInfo = getLetterGrade(currentTotal);

    return {
      current_total: parseFloat(currentTotal.toFixed(2)),
      percentage: parseFloat(percentage.toFixed(2)),
      grade_letter: gradeInfo.letter,
      grade_description: gradeInfo.description,
      breakdown,
      has_all_marks: hasAllMarks,
      total_weight_completed: totalWeight,
    };
  } catch (error) {
    console.error('Calculate student grade error:', error);
    throw error;
  }
};

/**
 * Update or create calculation record for a student
 * @param {number} studentId - Student ID
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} Updated calculation
 */
const updateStudentCalculation = async (studentId, classId) => {
  try {
    const calculation = await calculateStudentGrade(studentId, classId);

    if (calculation.current_total === null) {
      // No marks yet, delete calculation if exists
      await query(
        `DELETE FROM calculations WHERE student_id = $1 AND class_id = $2`,
        [studentId, classId]
      );
      return null;
    }

    // Upsert calculation
    const result = await query(
      `INSERT INTO calculations (student_id, class_id, current_total, percentage, grade_letter, breakdown, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT (student_id, class_id)
       DO UPDATE SET
         current_total = EXCLUDED.current_total,
         percentage = EXCLUDED.percentage,
         grade_letter = EXCLUDED.grade_letter,
         breakdown = EXCLUDED.breakdown,
         last_updated = CURRENT_TIMESTAMP
       RETURNING id, student_id, class_id, current_total, percentage, grade_letter, breakdown, last_updated`,
      [studentId, classId, calculation.current_total, calculation.percentage, calculation.grade_letter, JSON.stringify(calculation.breakdown)]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Update student calculation error:', error);
    throw error;
  }
};

/**
 * Recalculate all students in a class
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} Result summary
 */
const recalculateClassGrades = async (classId) => {
  try {
    // Get all students in the class
    const studentsResult = await query(
      `SELECT id FROM students WHERE class_id = $1`,
      [classId]
    );

    const students = studentsResult.rows;
    const results = {
      total: students.length,
      updated: 0,
      errors: [],
    };

    for (const student of students) {
      try {
        await updateStudentCalculation(student.id, classId);
        results.updated++;
      } catch (error) {
        results.errors.push({
          student_id: student.id,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Recalculate class grades error:', error);
    throw error;
  }
};

/**
 * Get class average
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} Class average
 */
const getClassAverage = async (classId) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) as student_count,
         AVG(current_total) as average_total,
         AVG(percentage) as average_percentage,
         MIN(current_total) as lowest_total,
         MAX(current_total) as highest_total
       FROM calculations
       WHERE class_id = $1`,
      [classId]
    );

    const data = result.rows[0];

    return {
      student_count: parseInt(data.student_count),
      average_total: data.average_total ? parseFloat(data.average_total).toFixed(2) : null,
      average_percentage: data.average_percentage ? parseFloat(data.average_percentage).toFixed(2) : null,
      lowest_total: data.lowest_total ? parseFloat(data.lowest_total).toFixed(2) : null,
      highest_total: data.highest_total ? parseFloat(data.highest_total).toFixed(2) : null,
    };
  } catch (error) {
    console.error('Get class average error:', error);
    throw error;
  }
};

/**
 * Detect declining trend in student's marks
 * @param {number} studentId - Student ID
 * @param {number} lookback - Number of recent marks to analyze
 * @returns {Promise<Object>} Trend analysis
 */
const detectDecliningTrend = async (studentId, lookback = 3) => {
  try {
    const result = await query(
      `SELECT score, assessment_date, entered_at
       FROM marks
       WHERE student_id = $1 AND status = 'published'
       ORDER BY assessment_date DESC, entered_at DESC
       LIMIT $2`,
      [studentId, lookback]
    );

    const marks = result.rows;

    if (marks.length < 2) {
      return {
        is_declining: false,
        trend: 'insufficient_data',
        marks: marks.map(m => parseFloat(m.score)),
      };
    }

    // Check if each mark is lower than the previous
    let isConsistentDecline = true;
    for (let i = 0; i < marks.length - 1; i++) {
      if (parseFloat(marks[i].score) >= parseFloat(marks[i + 1].score)) {
        isConsistentDecline = false;
        break;
      }
    }

    // Calculate average change
    const scores = marks.map(m => parseFloat(m.score));
    let totalChange = 0;
    for (let i = 0; i < scores.length - 1; i++) {
      totalChange += scores[i] - scores[i + 1];
    }
    const averageChange = totalChange / (scores.length - 1);

    return {
      is_declining: isConsistentDecline || averageChange < -1, // Declining if consistent or avg drop > 1 point
      trend: isConsistentDecline ? 'consistent_decline' : (averageChange < -1 ? 'declining' : 'stable'),
      average_change: parseFloat(averageChange.toFixed(2)),
      marks: scores,
      recent_count: marks.length,
    };
  } catch (error) {
    console.error('Detect declining trend error:', error);
    throw error;
  }
};

/**
 * Get grade distribution for a class
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} Grade distribution
 */
const getGradeDistribution = async (classId) => {
  try {
    const result = await query(
      `SELECT
         grade_letter,
         COUNT(*) as count,
         ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
       FROM calculations
       WHERE class_id = $1
       GROUP BY grade_letter
       ORDER BY grade_letter`,
      [classId]
    );

    const distribution = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      F: 0,
    };

    result.rows.forEach(row => {
      distribution[row.grade_letter] = {
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      };
    });

    return distribution;
  } catch (error) {
    console.error('Get grade distribution error:', error);
    throw error;
  }
};

/**
 * Predict final grade based on current performance
 * @param {number} studentId - Student ID
 * @param {number} classId - Class ID
 * @returns {Promise<Object>} Prediction
 */
const predictFinalGrade = async (studentId, classId) => {
  try {
    const calculation = await calculateStudentGrade(studentId, classId);

    if (!calculation.current_total) {
      return {
        predicted_grade: null,
        confidence: 'low',
        message: 'Insufficient data for prediction',
      };
    }

    // Simple prediction: assume student continues at current average
    const currentAverage = calculation.current_total;

    // Adjust based on completion percentage
    const completionPercentage = calculation.total_weight_completed;
    const confidence = completionPercentage >= 75 ? 'high' : completionPercentage >= 50 ? 'medium' : 'low';

    const predictedGrade = getLetterGrade(currentAverage);

    return {
      predicted_total: currentAverage,
      predicted_letter: predictedGrade.letter,
      predicted_description: predictedGrade.description,
      current_completion: completionPercentage,
      confidence,
      message: `Based on ${completionPercentage}% completion, predicted final grade: ${predictedGrade.letter} (${currentAverage}/20)`,
    };
  } catch (error) {
    console.error('Predict final grade error:', error);
    throw error;
  }
};

module.exports = {
  calculateStudentGrade,
  updateStudentCalculation,
  recalculateClassGrades,
  getClassAverage,
  detectDecliningTrend,
  getGradeDistribution,
  predictFinalGrade,
};
