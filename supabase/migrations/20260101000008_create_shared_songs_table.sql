-- Create shared_songs table for single song sharing
CREATE TABLE IF NOT EXISTS public.shared_songs (
  id TEXT PRIMARY KEY,
  original_url TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  album TEXT,
  thumbnail_url TEXT,
  platform_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Enable RLS
ALTER TABLE public.shared_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can create shared songs" ON public.shared_songs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view shared songs" ON public.shared_songs
  FOR SELECT TO anon, authenticated
  USING (true);
