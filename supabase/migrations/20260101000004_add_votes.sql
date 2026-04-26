-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(song_id, user_name)
);

-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Allow public access (no auth required)
CREATE POLICY "Allow public read votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Allow public insert votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update votes" ON votes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete votes" ON votes FOR DELETE USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_votes_song_id ON votes(song_id);
