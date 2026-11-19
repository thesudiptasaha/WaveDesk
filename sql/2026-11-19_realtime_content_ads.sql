-- STATUS: already run live in Supabase. This file is the record only.
-- Date: 2026-11-19
-- What it did: Adds content_ads to supabase_realtime publication.
-- Tables now in supabase_realtime publication: contents, team_members, notifications, notices, bookings, content_ads.

alter publication supabase_realtime add table public.content_ads;

-- ROLLBACK:
-- alter publication supabase_realtime drop table public.content_ads;
