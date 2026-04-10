-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Untitled Playlist',
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  thumbnail_url TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Platform links stored as JSONB
  platform_links JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Create index for faster playlist lookups
CREATE INDEX IF NOT EXISTS idx_songs_playlist_id ON songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_songs_position ON songs(playlist_id, position);

-- Enable Row Level Security
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required)
-- Anyone can view playlists
CREATE POLICY "Anyone can view playlists" ON playlists
  FOR SELECT USING (true);

-- Anyone can create playlists
CREATE POLICY "Anyone can create playlists" ON playlists
  FOR INSERT WITH CHECK (true);

-- Anyone can update playlists
CREATE POLICY "Anyone can update playlists" ON playlists
  FOR UPDATE USING (true);

-- Anyone can delete playlists
CREATE POLICY "Anyone can delete playlists" ON playlists
  FOR DELETE USING (true);

-- Anyone can view songs
CREATE POLICY "Anyone can view songs" ON songs
  FOR SELECT USING (true);

-- Anyone can add songs
CREATE POLICY "Anyone can add songs" ON songs
  FOR INSERT WITH CHECK (true);

-- Anyone can update songs
CREATE POLICY "Anyone can update songs" ON songs
  FOR UPDATE USING (true);

-- Anyone can delete songs
CREATE POLICY "Anyone can delete songs" ON songs
  FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for playlists
DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
