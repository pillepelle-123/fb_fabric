-- Create new database for fb_fabric project
CREATE DATABASE fb_fabric;

-- Connect to the new database
\c fb_fabric;

-- Set search path to public schema
SET search_path TO public;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id),
  page_size VARCHAR(20) DEFAULT 'A4',
  orientation VARCHAR(20) DEFAULT 'portrait',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_saved_at TIMESTAMP,
  archived BOOLEAN DEFAULT FALSE
);

-- Create book_permissions table
CREATE TABLE IF NOT EXISTS book_permissions (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'viewer',
  UNIQUE(book_id, user_id)
);

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  canvas_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, page_number)
);

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE fb_fabric TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;