const { Pool } = require('pg');
require('dotenv').config();

// Use DATABASE_URL for production (Render) or individual vars for development
const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

// Initialize database tables
const initDB = async () => {
  try {
    // Set search path to public schema
    await pool.query('SET search_path TO public;');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        size VARCHAR(20) DEFAULT 'A4',
        orientation VARCHAR(20) DEFAULT 'portrait',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_saved_at TIMESTAMP
      )
    `);
    
    // Add columns if they don't exist (for existing databases)
    await pool.query(`
      ALTER TABLE books 
      ADD COLUMN IF NOT EXISTS size VARCHAR(20) DEFAULT 'A4',
      ADD COLUMN IF NOT EXISTS orientation VARCHAR(20) DEFAULT 'portrait',
      ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS book_permissions (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'viewer',
        UNIQUE(book_id, user_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pages (
        id SERIAL PRIMARY KEY,
        book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
        page_number INTEGER NOT NULL,
        canvas_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(book_id, page_number)
      )
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

module.exports = { pool, initDB };