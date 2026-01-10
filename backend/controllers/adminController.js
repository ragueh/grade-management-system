const Teacher = require('../models/Teacher');
const { query } = require('../config/database');
const { formatSuccessResponse, formatErrorResponse, logAudit } = require('../utils/helpers');
const { MESSAGES } = require('../config/constants');

/**
 * Get admin dashboard data
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    // Get user statistics
    const userStats = await query(`
      SELECT
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as total_teachers,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as total_students,
        SUM(CASE WHEN role = 'parent' THEN 1 ELSE 0 END) as total_parents
      FROM users
    `);

    // Get pending teachers count
    const pendingTeachersResult = await query(`
      SELECT COUNT(*) as pending_teachers
      FROM teachers
      WHERE is_approved_by_admin = FALSE
    `);

    // Get class statistics
    const classStats = await query(`
      SELECT COUNT(*) as total_classes
      FROM classes
      WHERE is_active = TRUE
    `);

    // Get assessment statistics
    const assessmentStats = await query(`
      SELECT COUNT(*) as total_assessments
      FROM assessment_types
    `);

    // Get marks statistics
    const markStats = await query(`
      SELECT COUNT(*) as total_marks
      FROM marks
    `);

    // Get alert statistics
    const alertStats = await query(`
      SELECT COUNT(*) as total_alerts
      FROM alerts
      WHERE is_dismissed = 0
    `);

    // Get pending teachers list (first 5)
    const pendingTeachersList = await query(`
      SELECT t.id, t.employee_id, t.department, t.created_at,
             u.email, u.first_name, u.last_name
      FROM teachers t
      INNER JOIN users u ON u.id = t.user_id
      WHERE t.is_approved_by_admin = FALSE
      ORDER BY t.created_at DESC
      LIMIT 5
    `);

    // Get recent activity from audit log
    const recentActivity = await query(`
      SELECT id, action, affected_table, created_at,
             CASE
               WHEN action = 'CREATE' THEN 'New ' || affected_table || ' created'
               WHEN action = 'UPDATE' THEN affected_table || ' updated'
               WHEN action = 'DELETE' THEN affected_table || ' deleted'
               ELSE action || ' on ' || affected_table
             END as description
      FROM audit_log
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const statistics = {
      total_users: parseInt(userStats.rows[0].total_users) || 0,
      total_teachers: parseInt(userStats.rows[0].total_teachers) || 0,
      total_students: parseInt(userStats.rows[0].total_students) || 0,
      total_parents: parseInt(userStats.rows[0].total_parents) || 0,
      pending_teachers: parseInt(pendingTeachersResult.rows[0].pending_teachers) || 0,
      total_classes: parseInt(classStats.rows[0].total_classes) || 0,
      total_assessments: parseInt(assessmentStats.rows[0].total_assessments) || 0,
      total_marks: parseInt(markStats.rows[0].total_marks) || 0,
      total_alerts: parseInt(alertStats.rows[0].total_alerts) || 0,
    };

    res.status(200).json(formatSuccessResponse('Dashboard data retrieved', {
      statistics,
      pending_teachers: pendingTeachersList.rows,
      recent_activity: recentActivity.rows,
    }));
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get all teachers
 * GET /api/admin/teachers
 */
const getTeachers = async (req, res) => {
  try {
    const { approved } = req.query;

    let filters = {};
    if (approved !== undefined) {
      filters.approved = approved === 'true';
    }

    // Get all teachers with class counts
    const result = await query(`
      SELECT t.id, t.user_id, t.employee_id, t.department, t.is_approved_by_admin, t.created_at,
             u.email, u.first_name, u.last_name, u.phone_number, u.is_verified,
             COUNT(c.id) as class_count
      FROM teachers t
      INNER JOIN users u ON u.id = t.user_id
      LEFT JOIN classes c ON c.teacher_id = t.id AND c.is_active = TRUE
      ${approved !== undefined ? `WHERE t.is_approved_by_admin = ${approved === 'true'}` : ''}
      GROUP BY t.id, t.user_id, t.employee_id, t.department, t.is_approved_by_admin, t.created_at,
               u.email, u.first_name, u.last_name, u.phone_number, u.is_verified
      ORDER BY t.created_at DESC
    `);

    res.status(200).json(formatSuccessResponse('Teachers retrieved', result.rows));
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Approve a teacher
 * POST /api/admin/teachers/:teacherId/approve
 */
const approveTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json(formatErrorResponse('Teacher not found'));
    }

    if (teacher.is_approved_by_admin) {
      return res.status(400).json(formatErrorResponse('Teacher is already approved'));
    }

    // Approve the teacher
    const updatedTeacher = await Teacher.approve(teacherId);

    // Log audit
    await logAudit({
      action: 'APPROVE',
      userId: req.user.id,
      affectedTable: 'teachers',
      affectedRecordId: teacherId,
      oldValue: { is_approved_by_admin: false },
      newValue: { is_approved_by_admin: true },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json(formatSuccessResponse('Teacher approved successfully', updatedTeacher));
  } catch (error) {
    console.error('Approve teacher error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Revoke teacher approval
 * POST /api/admin/teachers/:teacherId/revoke
 */
const revokeApproval = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json(formatErrorResponse('Teacher not found'));
    }

    if (!teacher.is_approved_by_admin) {
      return res.status(400).json(formatErrorResponse('Teacher is not currently approved'));
    }

    // Revoke approval
    const updatedTeacher = await Teacher.revokeApproval(teacherId);

    // Log audit
    await logAudit({
      action: 'REVOKE',
      userId: req.user.id,
      affectedTable: 'teachers',
      affectedRecordId: teacherId,
      oldValue: { is_approved_by_admin: true },
      newValue: { is_approved_by_admin: false },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json(formatSuccessResponse('Teacher approval revoked', updatedTeacher));
  } catch (error) {
    console.error('Revoke approval error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Delete/Reject teacher application
 * DELETE /api/admin/teachers/:teacherId
 */
const deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    // Check if teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json(formatErrorResponse('Teacher not found'));
    }

    // Delete the teacher
    await Teacher.delete(teacherId);

    // Log audit
    await logAudit({
      action: 'DELETE',
      userId: req.user.id,
      affectedTable: 'teachers',
      affectedRecordId: teacherId,
      oldValue: teacher,
      newValue: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json(formatSuccessResponse('Teacher deleted successfully'));
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get system statistics
 * GET /api/admin/statistics
 */
const getStatistics = async (req, res) => {
  try {
    // User statistics by role
    const usersByRole = await query(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // Active vs inactive classes
    const classStats = await query(`
      SELECT
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_classes,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_classes
      FROM classes
    `);

    // Marks entered this month
    const marksThisMonth = await query(`
      SELECT COUNT(*) as marks_this_month
      FROM marks
      WHERE created_at >= date_trunc('month', CURRENT_DATE)
    `);

    // Average grade across all students
    const avgGrade = await query(`
      SELECT AVG(weighted_average) as average_grade
      FROM calculations
    `);

    res.status(200).json(formatSuccessResponse('Statistics retrieved', {
      users_by_role: usersByRole.rows,
      class_stats: classStats.rows[0],
      marks_this_month: parseInt(marksThisMonth.rows[0].marks_this_month) || 0,
      average_grade: parseFloat(avgGrade.rows[0].average_grade) || 0,
    }));
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

module.exports = {
  getDashboard,
  getTeachers,
  approveTeacher,
  revokeApproval,
  deleteTeacher,
  getStatistics,
};
