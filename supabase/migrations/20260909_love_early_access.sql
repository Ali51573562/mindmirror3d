-- LoveMirror interest only. No orders, payment or assessment records are changed.
create table if not exists public.love_early_access (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254),
  created_at timestamptz not null default now()
);
alter table public.love_early_access enable row level security;
revoke all on public.love_early_access from anon, authenticated;
grant select, insert, update on public.love_early_access to service_role;
notify pgrst, 'reload schema';

