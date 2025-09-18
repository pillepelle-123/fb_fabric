-- Add last_saved_at column to books table
ALTER TABLE books ADD COLUMN last_saved_at TIMESTAMP;

-- Update existing records to have a default value
UPDATE books SET last_saved_at = CURRENT_TIMESTAMP;