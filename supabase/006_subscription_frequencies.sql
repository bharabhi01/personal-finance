-- Run once after 005. Stores how often each subscription is billed (monthly when not set).
-- name is the subscription's description, trimmed and lower-cased.
begin;
create table public.subscription_frequencies (
 user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(name=lower(btrim(name)) and length(name) between 1 and 200),
 frequency text not null check(frequency in ('weekly','monthly','quarterly','yearly')),
 primary key(user_id,name)
);
alter table public.subscription_frequencies enable row level security;
create policy "Private owner access" on public.subscription_frequencies for all to authenticated
 using (user_id=(select auth.uid()))
 with check(user_id=(select auth.uid()));
grant select,insert,update,delete on public.subscription_frequencies to authenticated;
revoke all on public.subscription_frequencies from anon;
commit;
