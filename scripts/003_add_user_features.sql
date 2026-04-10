-- Add added_by column for tracking who added the song
ALTER TABLE songs ADD COLUMN IF NOT EXISTS added_by TEXT;

-- Add is_promoted column to distinguish Set vs Ideas
ALTER TABLE songs ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
