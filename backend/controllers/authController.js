const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const { generateToken, generateRefreshToken } = require('../config/auth');
const { comparePassword, isAccountLocked, sanitizeUser, logAudit } = require('../utils/helpers');
const { MESSAGES, USER_ROLES } = require('../config/constants');

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role, phone_number, employee_id, department, student_id, class_id } = req.body;

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
      });
    }

    let createdUser;

    // Create user based on role
    switch (role) {
      case USER_ROLES.TEACHER:
        createdUser = await Teacher.create({
          email,
          password,
          first_name,
          last_name,
          phone_number,
          employee_id,
          department,
        });
        break;

      case USER_ROLES.STUDENT:
        if (!student_id || !class_id) {
          return res.status(400).json({
            success: false,
            message: 'Student ID and Class ID are required for student registration',
          });
        }
        createdUser = await Student.create({
          email,
          password,
          first_name,
          last_name,
          phone_number,
          student_id,
          class_id,
        });
        break;

      case USER_ROLES.PARENT:
        createdUser = await Parent.create({
          email,
          password,
          first_name,
          last_name,
          phone_number,
        });
        break;

      case USER_ROLES.ADMIN:
        // Admins can only be created by existing admins
        return res.status(403).json({
          success: false,
          message: 'Admin accounts must be created by an existing administrator',
        });

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified',
        });
    }

    // Log the registration
    await logAudit({
      action: 'USER_REGISTER',
      userId: createdUser.id,
      affectedTable: 'users',
      affectedRecordId: createdUser.id,
      newValue: { email, role },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Generate token
    const token = generateToken({ userId: createdUser.id, role });

    res.status(201).json({
      success: true,
      message: MESSAGES.SUCCESS.REGISTER,
      data: {
        user: sanitizeUser(createdUser),
        token,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.INVALID_CREDENTIALS,
      });
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      return res.status(403).json({
        success: false,
        message: MESSAGES.ERROR.ACCOUNT_LOCKED,
        locked_until: user.locked_until,
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment login attempts
      await User.incrementLoginAttempts(user.id);

      return res.status(401).json({
        success: false,
        message: MESSAGES.ERROR.INVALID_CREDENTIALS,
      });
    }

    // Update last login
    await User.updateLastLogin(user.id);

    // Generate tokens
    const token = generateToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    // Log the login
    await logAudit({
      action: 'USER_LOGIN',
      userId: user.id,
      affectedTable: 'users',
      affectedRecordId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Get role-specific data
    let roleData = null;
    switch (user.role) {
      case USER_ROLES.TEACHER:
        roleData = await Teacher.findByUserId(user.id);
        break;
      case USER_ROLES.STUDENT:
        roleData = await Student.findByUserId(user.id);
        break;
      case USER_ROLES.PARENT:
        roleData = await Parent.findByUserId(user.id);
        break;
    }

    res.status(200).json({
      success: true,
      message: MESSAGES.SUCCESS.LOGIN,
      data: {
        user: {
          ...sanitizeUser(user),
          ...roleData,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get role-specific data
    let profileData = null;
    switch (req.user.role) {
      case USER_ROLES.TEACHER:
        profileData = await Teacher.findByUserId(userId);
        break;
      case USER_ROLES.STUDENT:
        profileData = await Student.findByUserId(userId);
        break;
      case USER_ROLES.PARENT:
        profileData = await Parent.findByUserId(userId);
        break;
      default:
        profileData = await User.findById(userId);
    }

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Update user basic info
    const updatedUser = await User.update(userId, updates);

    // Log the update
    await logAudit({
      action: 'USER_UPDATE_PROFILE',
      userId,
      affectedTable: 'users',
      affectedRecordId: userId,
      newValue: updates,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: MESSAGES.SUCCESS.UPDATED,
      data: sanitizeUser(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Change password
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    // Get user with password hash
    const user = await User.findByEmail(req.user.email);

    // Verify current password
    const isPasswordValid = await comparePassword(current_password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    await User.updatePassword(userId, new_password);

    // Log the change
    await logAudit({
      action: 'USER_CHANGE_PASSWORD',
      userId,
      affectedTable: 'users',
      affectedRecordId: userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    // Verify refresh token
    const { verifyToken } = require('../config/auth');
    const decoded = verifyToken(refreshToken);

    // Generate new access token
    const token = generateToken({ userId: decoded.userId, role: decoded.role });

    res.status(200).json({
      success: true,
      data: { token },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const userId = req.user.id;

    // Log the logout
    await logAudit({
      action: 'USER_LOGOUT',
      userId,
      affectedTable: 'users',
      affectedRecordId: userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: MESSAGES.ERROR.INTERNAL_SERVER,
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshAccessToken,
  logout,
};
