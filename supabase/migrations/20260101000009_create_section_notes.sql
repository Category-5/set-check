-- Create section_notes table for scripture/prayer notes between songs
CREATE TABLE IF NOT EXISTS section_notes (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'hand-heart',
  color TEXT NOT NULL DEFAULT 'slate',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster playlist lookups
CREATE INDEX IF NOT EXISTS idx_section_notes_playlist_id ON section_notes(playlist_id);
CREATE INDEX IF NOT EXISTS idx_section_notes_position ON section_notes(playlist_id, position);

-- Enable Row Level Security
ALTER TABLE section_notes ENABLE ROW LEVEL SECURITY;

-- Public access policies (matching existing pattern)
CREATE POLICY "Anyone can view section_notes" ON section_notes
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create section_notes" ON section_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update section_notes" ON section_notes
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete section_notes" ON section_notes
  FOR DELETE USING (true);
