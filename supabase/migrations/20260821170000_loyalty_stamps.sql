-- Potato Hut loyalty stamps
-- stamps: 0–7 earned paid stamps. Slot 8 (yellow FREE) is UI-only until redeem.
-- At 7 stamps the free meal is available; redeem resets to 0.

create table if not exists public.loyalty_cards (
  customer_id text primary key,
  stamps integer not null default 0
    check (stamps >= 0 and stamps <= 7),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_payment_events (
  payment_id text primary key,
  customer_id text not null references public.loyalty_cards (customer_id) on delete cascade,
  amount_cents integer not null,
  direction text not null check (direction in ('credit', 'debit')),
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_redemptions (
  id bigserial primary key,
  customer_id text not null references public.loyalty_cards (customer_id) on delete cascade,
  stamps_before integer not null,
  created_at timestamptz not null default now()
);

create index if not exists loyalty_payment_events_customer_id_idx
  on public.loyalty_payment_events (customer_id);

create or replace function public.touch_loyalty_card_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists loyalty_cards_updated_at on public.loyalty_cards;
create trigger loyalty_cards_updated_at
  before update on public.loyalty_cards
  for each row execute function public.touch_loyalty_card_updated_at();

-- Ensure a card row exists (0 stamps).
create or replace function public.ensure_loyalty_card(c_id text)
returns public.loyalty_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.loyalty_cards;
begin
  if c_id is null or length(trim(c_id)) = 0 then
    raise exception 'customer_id required';
  end if;

  insert into public.loyalty_cards (customer_id, stamps)
  values (trim(c_id), 0)
  on conflict (customer_id) do nothing;

  select * into row from public.loyalty_cards where customer_id = trim(c_id);
  return row;
end;
$$;

-- Legacy helper: +1 stamp, capped at 7.
create or replace function public.increment_stamp(c_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stamps integer;
begin
  perform public.ensure_loyalty_card(c_id);

  update public.loyalty_cards
  set stamps = least(stamps + 1, 7)
  where customer_id = trim(c_id)
  returning stamps into new_stamps;

  return new_stamps;
end;
$$;

-- Idempotent payment credit: if amount >= threshold and payment not yet credited, +1 (cap 7).
create or replace function public.apply_loyalty_payment_credit(
  c_id text,
  p_id text,
  amount_cents integer,
  threshold_cents integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stamps integer;
begin
  if c_id is null or length(trim(c_id)) = 0 then
    raise exception 'customer_id required';
  end if;
  if p_id is null or length(trim(p_id)) = 0 then
    raise exception 'payment_id required';
  end if;

  perform public.ensure_loyalty_card(c_id);

  if amount_cents is null or amount_cents < coalesce(threshold_cents, 0) then
    select stamps into new_stamps from public.loyalty_cards where customer_id = trim(c_id);
    return new_stamps;
  end if;

  if exists (
    select 1 from public.loyalty_payment_events
    where payment_id = trim(p_id) and direction = 'credit'
  ) then
    select stamps into new_stamps from public.loyalty_cards where customer_id = trim(c_id);
    return new_stamps;
  end if;

  insert into public.loyalty_payment_events (payment_id, customer_id, amount_cents, direction)
  values (trim(p_id), trim(c_id), amount_cents, 'credit');

  update public.loyalty_cards
  set stamps = least(stamps + 1, 7)
  where customer_id = trim(c_id)
  returning stamps into new_stamps;

  return new_stamps;
end;
$$;

-- Idempotent debit on refund: undo one stamp if this payment was previously credited.
create or replace function public.apply_loyalty_payment_debit(
  c_id text,
  p_id text,
  amount_cents integer default 0
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stamps integer;
begin
  if c_id is null or length(trim(c_id)) = 0 then
    raise exception 'customer_id required';
  end if;
  if p_id is null or length(trim(p_id)) = 0 then
    raise exception 'payment_id required';
  end if;

  perform public.ensure_loyalty_card(c_id);

  if not exists (
    select 1 from public.loyalty_payment_events
    where payment_id = trim(p_id) and direction = 'credit'
  ) then
    select stamps into new_stamps from public.loyalty_cards where customer_id = trim(c_id);
    return new_stamps;
  end if;

  if exists (
    select 1 from public.loyalty_payment_events
    where payment_id = trim(p_id) || ':debit' and direction = 'debit'
  ) then
    select stamps into new_stamps from public.loyalty_cards where customer_id = trim(c_id);
    return new_stamps;
  end if;

  insert into public.loyalty_payment_events (payment_id, customer_id, amount_cents, direction)
  values (trim(p_id) || ':debit', trim(c_id), coalesce(amount_cents, 0), 'debit');

  update public.loyalty_cards
  set stamps = greatest(stamps - 1, 0)
  where customer_id = trim(c_id)
  returning stamps into new_stamps;

  return new_stamps;
end;
$$;

-- Redeem free meal when stamps = 7 → reset to 0.
create or replace function public.redeem_loyalty_reward(c_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_stamps integer;
begin
  perform public.ensure_loyalty_card(c_id);

  select stamps into current_stamps
  from public.loyalty_cards
  where customer_id = trim(c_id)
  for update;

  if current_stamps < 7 then
    raise exception 'Reward not available (need 7 stamps, have %)', current_stamps;
  end if;

  insert into public.loyalty_redemptions (customer_id, stamps_before)
  values (trim(c_id), current_stamps);

  update public.loyalty_cards
  set stamps = 0
  where customer_id = trim(c_id);

  return 0;
end;
$$;

alter table public.loyalty_cards enable row level security;
alter table public.loyalty_payment_events enable row level security;
alter table public.loyalty_redemptions enable row level security;

-- Public read of stamp counts (card page). Writes go through service role + RPCs.
drop policy if exists "Public can read loyalty cards" on public.loyalty_cards;
create policy "Public can read loyalty cards"
  on public.loyalty_cards
  for select
  to anon, authenticated
  using (true);

revoke all on public.loyalty_payment_events from anon, authenticated;
revoke all on public.loyalty_redemptions from anon, authenticated;

grant select on public.loyalty_cards to anon, authenticated;
grant execute on function public.ensure_loyalty_card(text) to service_role;
grant execute on function public.increment_stamp(text) to service_role;
grant execute on function public.apply_loyalty_payment_credit(text, text, integer, integer) to service_role;
grant execute on function public.apply_loyalty_payment_debit(text, text, integer) to service_role;
grant execute on function public.redeem_loyalty_reward(text) to service_role;

-- Demo customer used by the app fallback id
insert into public.loyalty_cards (customer_id, stamps)
values ('SQ-USER-987654321', 0)
on conflict (customer_id) do nothing;
