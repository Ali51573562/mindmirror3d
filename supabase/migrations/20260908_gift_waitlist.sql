-- Gift interest only. No orders, payment or assessment records are changed.
create table if not exists public.gift_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254),
  created_at timestamptz not null default now()
);
alter table public.gift_waitlist enable row level security;
revoke all on public.gift_waitlist from anon, authenticated;
grant select, insert, update on public.gift_waitlist to service_role;
notify pgrst, 'reload schema';
