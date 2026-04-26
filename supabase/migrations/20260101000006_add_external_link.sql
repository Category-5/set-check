-- Add external_link column to playlists table
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS external_link TEXT;
