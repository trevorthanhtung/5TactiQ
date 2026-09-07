-- Migration: Create team_shares table for ultra-compact share links
-- Purpose: Stores shared snapshots for stats and tactics so URLs only need an ID (e.g. /share?id=s_a8k9m2x)

CREATE TABLE IF NOT EXISTS public.team_shares (
  id TEXT PRIMARY KEY,
  share_type TEXT NOT NULL,
  title TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for quick lookup and performance
CREATE INDEX IF NOT EXISTS idx_team_shares_created_at ON public.team_shares (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.team_shares ENABLE ROW LEVEL SECURITY;

-- Allow public (anon + authenticated) to read shared links
CREATE POLICY "Allow public read access to team_shares"
  ON public.team_shares
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public (anon + authenticated) to insert new share links
CREATE POLICY "Allow public insert to team_shares"
  ON public.team_shares
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
