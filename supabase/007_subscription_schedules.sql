-- Run once after 006. Frequencies become schedules: adds a six-monthly frequency and a status
-- (active, paused or cancelled). A row may now be saved with only a status; its frequency defaults to monthly.
begin;
alter table public.subscription_frequencies rename to subscription_schedules;
alter table public.subscription_schedules alter column frequency set default 'monthly';
alter table public.subscription_schedules drop constraint subscription_frequencies_frequency_check;
alter table public.subscription_schedules add constraint subscription_schedules_frequency_check check(frequency in ('weekly','monthly','quarterly','half-yearly','yearly'));
alter table public.subscription_schedules add column status text not null default 'active' check(status in ('active','paused','cancelled'));
commit;
