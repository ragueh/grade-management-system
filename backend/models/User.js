const { query, transaction } = require('../config/database');
const { hashPassword, sanitizeUser } = require('../utils/helpers');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      phone_number,
      is_verified = false,
    } = userData;

    // Hash password
    const password_hash = await hashPassword(password);

    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone_number, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, role, is_verified, phone_number, created_at`,
      [email, password_hash, first_name, last_name, role, phone_number, is_verified]
    );

    return result.rows[0];
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object|null>} User object or null
   */
  static async findByEmail(email) {
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, is_verified,
              phone_number, login_attempts, locked_until, created_at, last_login
       FROM users
       WHERE email = $1`,
      [email]
    );

    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  static async findById(id) {
    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_verified,
              phone_number, created_at, last_login
       FROM users
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  static async update(id, updates) {
    const allowedFields = ['first_name', 'last_name', 'phone_number', 'is_verified'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const result = await query(
      `UPDATE users
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, email, first_name, last_name, role, is_verified, phone_number, updated_at`,
      [id, ...fields.map(field => updates[field])]
    );

    return result.rows[0];
  }

  /**
   * Update password
   * @param {number} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<void>}
   */
  static async updatePassword(id, newPassword) {
    const password_hash = await hashPassword(newPassword);

    await query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [password_hash, id]
    );
  }

  /**
   * Update last login timestamp
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  static async updateLastLogin(id) {
    await query(
      `UPDATE users
       SET last_login = CURRENT_TIMESTAMP,
           login_attempts = 0,
           locked_until = NULL
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Increment login attempts
   * @param {number} id - User ID
   * @param {number} maxAttempts - Maximum allowed attempts
   * @returns {Promise<void>}
   */
  static async incrementLoginAttempts(id, maxAttempts = 5) {
    const result = await query(
      `UPDATE users
       SET login_attempts = login_attempts + 1
       WHERE id = $1
       RETURNING login_attempts`,
      [id]
    );

    const attempts = result.rows[0].login_attempts;

    // Lock account if max attempts reached
    if (attempts >= maxAttempts) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15); // Lock for 15 minutes

      await query(
        `UPDATE users
         SET locked_until = $1
         WHERE id = $2`,
        [lockTime, id]
      );
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }

  /**
   * Get all users with role filter
   * @param {string} role - User role
   * @param {Object} pagination - Pagination params
   * @returns {Promise<Object>} Users and total count
   */
  static async findByRole(role, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;

    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_verified, phone_number, created_at
       FROM users
       WHERE role = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [role, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users WHERE role = $1`,
      [role]
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Search users by name or email
   * @param {string} searchTerm - Search term
   * @param {Object} pagination - Pagination params
   * @returns {Promise<Object>} Users and total count
   */
  static async search(searchTerm, pagination = {}) {
    const { limit = 20, offset = 0 } = pagination;
    const searchPattern = `%${searchTerm}%`;

    const result = await query(
      `SELECT id, email, first_name, last_name, role, is_verified, phone_number, created_at
       FROM users
       WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [searchPattern, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM users
       WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1`,
      [searchPattern]
    );

    return {
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
    };
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @returns {Promise<boolean>} Exists or not
   */
  static async emailExists(email) {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0;
  }

  /**
   * Verify user account
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  static async verify(id) {
    await query(
      `UPDATE users
       SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
  }
}

module.exports = User;
