-- Run once after 002. Turns expenses into a general ledger: each row is an expense, income,
-- investment, savings transfer (bank -> to_bank) or a balance the owner reported for a bank.
begin;
alter table public.expenses rename to transactions;
alter index public.expenses_owner_date rename to transactions_owner_date;
alter table public.transactions
 add column kind text not null default 'expense' check(kind in ('expense','income','investment','savings','balance')),
 add column to_bank text check(to_bank is null or length(btrim(to_bank)) between 1 and 100);
alter table public.transactions alter column kind drop default;
alter table public.transactions alter column category drop not null;
alter table public.transactions drop constraint expenses_amount_paise_check;
alter table public.transactions drop constraint expenses_category_check;
alter table public.transactions add constraint transactions_shape check(
 (kind='expense' and amount_paise between 1 and 100000000 and category is not null and category in ('Food','Travel','Shopping','Bills','Health','Subscriptions','Other') and to_bank is null)
 or (kind in ('income','investment') and amount_paise between 1 and 100000000000 and category is null and to_bank is null)
 or (kind='savings' and amount_paise between 1 and 100000000000 and category is null and bank is not null and to_bank is not null and lower(btrim(bank))<>lower(btrim(to_bank)))
 or (kind='balance' and amount_paise between 0 and 100000000000 and category is null and bank is not null and to_bank is null)
);
commit;
