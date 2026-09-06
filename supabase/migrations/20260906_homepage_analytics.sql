-- Additive: preserves all existing events and existing clients.
alter table public.funnel_events add column if not exists context jsonb;
create index if not exists funnel_events_created_at_idx on public.funnel_events(created_at);
notify pgrst, 'reload schema';
