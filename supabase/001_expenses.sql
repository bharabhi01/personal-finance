begin;
create table public.allowed_users (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.allowed_users enable row level security;
create policy "Owner can check own access" on public.allowed_users for select to authenticated using (user_id=(select auth.uid()));
revoke all on public.allowed_users from public,anon,authenticated;
grant select on public.allowed_users to authenticated;
create table public.expenses (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 amount_paise bigint not null check(amount_paise>0 and amount_paise<=100000000), currency text not null default 'INR' check(currency='INR'),
 date date not null, description text not null check(length(btrim(description)) between 1 and 200),
 category text not null check(category in ('Food','Travel','Shopping','Bills','Health','Other')),
 source text not null check(source in ('app','whatsapp')), source_message_id text, source_line int,
 check((source='app' and source_message_id is null and source_line is null) or (source='whatsapp' and source_message_id is not null and source_line is not null and length(source_message_id) between 1 and 256 and source_line between 1 and 50)),
 created_at timestamptz not null default now(),
 unique(user_id,source_message_id,source_line)
);
alter table public.expenses enable row level security;
create policy "Private owner access" on public.expenses for all to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.allowed_users where user_id=(select auth.uid())))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.allowed_users where user_id=(select auth.uid())));
grant select,insert,update,delete on public.expenses to authenticated;
revoke all on public.expenses from anon;
create index expenses_owner_date on public.expenses(user_id,date desc);
create table public.expense_imports (
 user_id uuid not null references auth.users(id) on delete cascade, message_id text not null check(length(message_id) between 1 and 256),
 payload jsonb not null, created_at timestamptz not null default now(), primary key(user_id,message_id)
);
alter table public.expense_imports enable row level security;
create policy "Private import access" on public.expense_imports for all to authenticated
 using (user_id=(select auth.uid()) and exists(select 1 from public.allowed_users where user_id=(select auth.uid())))
 with check(user_id=(select auth.uid()) and exists(select 1 from public.allowed_users where user_id=(select auth.uid())));
revoke all on public.expense_imports from public,anon,authenticated;
grant select,insert on public.expense_imports to authenticated;
revoke all on public.expense_imports from anon;
create function public.import_expenses(message_id text,items jsonb) returns jsonb
 language plpgsql security invoker set search_path = '' as $$
declare n int; prior jsonb; inserted int;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.allowed_users a where a.user_id=auth.uid()) then raise exception 'Access denied'; end if;
 if items is null or jsonb_typeof(items)<>'array' then raise exception 'Expected array'; end if;
 if message_id is null or length(message_id) not between 1 and 256 then raise exception 'Invalid message ID'; end if;
 n:=jsonb_array_length(items); if n<1 or n>50 then raise exception 'Invalid batch size'; end if;
 insert into public.expense_imports(user_id,message_id,payload) values(auth.uid(),message_id,items) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then
  select i.payload into prior from public.expense_imports i where i.user_id=auth.uid() and i.message_id=import_expenses.message_id;
  if prior is distinct from items then raise exception 'Same message ID with changed contents'; end if;
  return jsonb_build_object('status','already_saved','count',n);
 end if;
 insert into public.expenses(user_id,amount_paise,date,description,category,source,source_message_id,source_line)
 select auth.uid(),(x.item->>'amount_paise')::bigint,(x.item->>'date')::date,btrim(x.item->>'description'),x.item->>'category','whatsapp',message_id,x.pos::int
 from jsonb_array_elements(items) with ordinality as x(item,pos);
 return jsonb_build_object('status','saved','count',n);
end; $$;
revoke all on function public.import_expenses(text,jsonb) from public,anon;
grant execute on function public.import_expenses(text,jsonb) to authenticated;
commit;
