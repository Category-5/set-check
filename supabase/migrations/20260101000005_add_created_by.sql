-- Add created_by column to playlists table
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS created_by TEXT;
