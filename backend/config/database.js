const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// SQLite database path
const dbPath = path.join(__dirname, '..', process.env.DB_PATH || 'database.sqlite');

// Create database connection
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log(`✓ Connected to SQLite database at ${dbPath}`);

// Query helper function (PostgreSQL-compatible interface)
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    // Convert PostgreSQL $1, $2 syntax to SQLite ? syntax
    const sqliteQuery = text.replace(/\$(\d+)/g, '?');

    let result;
    if (sqliteQuery.trim().toUpperCase().startsWith('SELECT') ||
        sqliteQuery.trim().toUpperCase().startsWith('WITH')) {
      // SELECT queries
      const stmt = db.prepare(sqliteQuery);
      const rows = stmt.all(...params);
      result = { rows, rowCount: rows.length };
    } else {
      // INSERT, UPDATE, DELETE queries
      const stmt = db.prepare(sqliteQuery);
      const info = stmt.run(...params);
      result = {
        rows: [],
        rowCount: info.changes,
        lastID: info.lastInsertRowid
      };
    }

    const duration = Date.now() - start;

    // Log slow queries (> 100ms)
    if (duration > 100) {
      console.warn(`Slow query detected (${duration}ms):`, text);
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const transactionFn = db.transaction((cb) => {
    return cb();
  });

  try {
    return transactionFn(() => callback({ query }));
  } catch (error) {
    throw error;
  }
};

// Pool interface for compatibility (SQLite doesn't have a pool)
const pool = {
  query: (text, params) => query(text, params),
  connect: () => Promise.resolve({ query, release: () => {} }),
  end: () => {
    db.close();
    return Promise.resolve();
  }
};

module.exports = {
  db,
  pool,
  query,
  transaction,
};
