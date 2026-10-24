-- Run once after 001_expenses.sql: adds the bank column and Subscriptions category,
-- and removes the batch-import function and table (Instinct saves through the API instead).
begin;
alter table public.expenses add column bank text check(bank is null or length(btrim(bank)) between 1 and 100);
alter table public.expenses drop constraint expenses_category_check;
alter table public.expenses add constraint expenses_category_check check(category in ('Food','Travel','Shopping','Bills','Health','Subscriptions','Other'));
drop function public.import_expenses(text,jsonb);
drop table public.expense_imports;
commit;
