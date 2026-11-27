-- First-party page view analytics, replacing Vercel Analytics.
-- No cookies and no raw IPs: visitor_hash is a hash of IP + user agent with a
-- salt that changes daily, so a visitor can be counted within a day but not
-- followed across days.
CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  path TEXT NOT NULL,
  referrer_host TEXT,
  visitor_hash TEXT NOT NULL,
  country TEXT,
  device TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);

-- RLS on with no policies: only the service role (server-side) can read or
-- write. The anon key in the browser cannot touch this table.
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Aggregates for the /stats page, so it never pulls raw rows (PostgREST caps
-- responses at 1000 rows).
CREATE OR REPLACE FUNCTION page_view_stats(days INTEGER DEFAULT 30)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH recent AS (
    SELECT * FROM page_views
    WHERE created_at >= date_trunc('day', now()) - make_interval(days => days - 1)
  ),
  daily AS (
    SELECT
      date_trunc('day', created_at)::date AS day,
      count(*) AS views,
      count(DISTINCT visitor_hash) AS visitors
    FROM recent
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'views', (SELECT count(*) FROM recent),
    'visitors', (SELECT coalesce(sum(visitors), 0) FROM daily),
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('day', day, 'views', views, 'visitors', visitors) ORDER BY day), '[]'::jsonb)
      FROM daily
    ),
    'pages', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.views DESC), '[]'::jsonb) FROM (
        SELECT path AS label, count(*) AS views FROM recent GROUP BY 1 ORDER BY 2 DESC LIMIT 20
      ) t
    ),
    'referrers', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.views DESC), '[]'::jsonb) FROM (
        SELECT referrer_host AS label, count(*) AS views FROM recent
        WHERE referrer_host IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 20
      ) t
    ),
    'countries', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.views DESC), '[]'::jsonb) FROM (
        SELECT country AS label, count(*) AS views FROM recent
        WHERE country IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 20
      ) t
    ),
    'devices', (
      SELECT coalesce(jsonb_agg(t ORDER BY t.views DESC), '[]'::jsonb) FROM (
        SELECT device AS label, count(*) AS views FROM recent GROUP BY 1 ORDER BY 2 DESC
      ) t
    )
  );
$$;

REVOKE ALL ON FUNCTION page_view_stats(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION page_view_stats(INTEGER) TO service_role;
