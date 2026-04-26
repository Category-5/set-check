-- Drop existing tables and recreate with TEXT id for shareable URLs
-- This allows short, URL-friendly IDs like "Dd_m6LoX3u"

-- Drop songs first due to foreign key constraint
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS playlists;

-- Recreate playlists table with TEXT id
CREATE TABLE playlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Untitled Playlist',
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate songs table with TEXT id
CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  thumbnail_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  platform_links JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_songs_playlist_id ON songs(playlist_id);
CREATE INDEX idx_songs_position ON songs(playlist_id, position);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view playlists" ON playlists FOR SELECT USING (true);
CREATE POLICY "Anyone can create playlists" ON playlists FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update playlists" ON playlists FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete playlists" ON playlists FOR DELETE USING (true);

CREATE POLICY "Anyone can view songs" ON songs FOR SELECT USING (true);
CREATE POLICY "Anyone can add songs" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update songs" ON songs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete songs" ON songs FOR DELETE USING (true);

-- Recreate updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
