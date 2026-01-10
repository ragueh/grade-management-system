const { verifyToken } = require('../config/auth');
const { query } = require('../config/database');
const { USER_ROLES, MESSAGES } = require('../config/constants');

/**
 * Middleware to verify JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database
    const result = await query(
      'SELECT id, email, first_name, last_name, role, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
      });
    }

    const user = result.rows[0];

    // Check if account is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please verify your email.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: error.message || MESSAGES.ERROR.UNAUTHORIZED,
    });
  }
};

/**
 * Middleware to check user role
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.UNAUTHORIZED,
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.ERROR.FORBIDDEN,
      });
    }

    next();
  };
};

/**
 * Middleware to check if teacher owns the class
 */
const checkClassOwnership = async (req, res, next) => {
  try {
    const classId = req.params.classId || req.body.class_id;
    const userId = req.user.id;

    // Get teacher ID from user ID
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Teacher record not found',
      });
    }

    const teacherId = teacherResult.rows[0].id;

    // Check if teacher owns the class
    const classResult = await query(
      'SELECT id FROM classes WHERE id = $1 AND teacher_id = $2',
      [classId, teacherId]
    );

    if (classResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this class',
      });
    }

    req.teacherId = teacherId;
    next();
  } catch (error) {
    console.error('Class ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Middleware to check if student owns the data
 */
const checkStudentOwnership = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get student ID from user ID
    const studentResult = await query(
      'SELECT id FROM students WHERE user_id = $1',
      [userId]
    );

    if (studentResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Student record not found',
      });
    }

    req.studentId = studentResult.rows[0].id;
    next();
  } catch (error) {
    console.error('Student ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Middleware to check parent access permission
 */
const checkParentAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const studentId = req.params.studentId || req.query.studentId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID required',
      });
    }

    // Get parent ID from user ID
    const parentResult = await query(
      'SELECT id FROM parents WHERE user_id = $1',
      [userId]
    );

    if (parentResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Parent record not found',
      });
    }

    const parentId = parentResult.rows[0].id;

    // Check if parent has access to student
    const accessResult = await query(
      `SELECT s.id FROM students s
       INNER JOIN parent_access_log pal ON pal.student_id = s.id
       WHERE s.id = $1 AND s.parent_id = $2
       AND s.allow_parent_access = TRUE
       AND pal.permission_status = 'active'`,
      [studentId, parentId]
    );

    if (accessResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.ERROR.PARENT_ACCESS_DENIED,
      });
    }

    req.parentId = parentId;
    next();
  } catch (error) {
    console.error('Parent access check error:', error);
    return res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Middleware to check if teacher is approved by admin
 */
const checkTeacherApproval = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await query(
      'SELECT is_approved_by_admin FROM teachers WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_approved_by_admin) {
      return res.status(403).json({
        success: false,
        message: 'Your teacher account is pending admin approval',
      });
    }

    next();
  } catch (error) {
    console.error('Teacher approval check error:', error);
    return res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  checkClassOwnership,
  checkStudentOwnership,
  checkParentAccess,
  checkTeacherApproval,
};
