-- Run once after 003. Adds the Housing and Groceries expense categories.
begin;
alter table public.transactions drop constraint transactions_shape;
alter table public.transactions add constraint transactions_shape check(
 (kind='expense' and amount_paise between 1 and 100000000 and category is not null and category in ('Housing','Bills','Food','Groceries','Shopping','Subscriptions','Travel','Health','Other') and to_bank is null)
 or (kind in ('income','investment') and amount_paise between 1 and 100000000000 and category is null and to_bank is null)
 or (kind='savings' and amount_paise between 1 and 100000000000 and category is null and bank is not null and to_bank is not null and lower(btrim(bank))<>lower(btrim(to_bank)))
 or (kind='balance' and amount_paise between 0 and 100000000000 and category is null and bank is not null and to_bank is null)
);
commit;
