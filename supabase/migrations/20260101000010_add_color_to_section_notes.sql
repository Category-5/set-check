-- Add color column to section_notes
ALTER TABLE section_notes ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'slate';
