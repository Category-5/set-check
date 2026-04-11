-- Add song_key column to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS song_key text DEFAULT 'C';
