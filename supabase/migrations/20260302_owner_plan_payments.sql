create table if not exists public.owner_plan_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  razorpay_signature text,
  amount_paise integer not null,
  currency text not null default 'INR',
  plan_name text not null,
  status text not null default 'created' check (status in ('created','paid','failed')),
  paid_at timestamp without time zone,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create index if not exists owner_plan_payments_user_id_idx
  on public.owner_plan_payments(user_id);

create index if not exists owner_plan_payments_created_at_idx
  on public.owner_plan_payments(created_at desc);

alter table public.owner_plan_payments enable row level security;

drop policy if exists "Users can view own plan payments" on public.owner_plan_payments;
create policy "Users can view own plan payments"
  on public.owner_plan_payments
  for select
  using (auth.uid() = user_id);
