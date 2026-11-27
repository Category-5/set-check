-- Public bucket for playlist cover images, replacing Vercel Blob.
-- Uploads go through /api/upload-cover with the service role key, so anon
-- clients get no write policy here. Public buckets serve reads without one.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'playlist-covers',
  'playlist-covers',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
