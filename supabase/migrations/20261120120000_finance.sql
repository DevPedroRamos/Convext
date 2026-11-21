-- Workspace Financeiro: funil de leads, produtos, clientes financeiros, propostas,
-- contratos (recorrente + avulso), parcelas a receber, folha e despesas.
-- Valores monetários em centavos (bigint), no mesmo padrão de employee_records.
-- Cálculos (geração de parcelas, folha, fluxo de caixa) ficam em lib/finance/*.ts;
-- aqui ficam esquema, RLS e as ações atômicas (converter lead, aceitar proposta).

-- ---------------------------------------------------------------------------
-- Acesso
-- ---------------------------------------------------------------------------
create or replace function public.profile_is_finance_commercial()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role in ('admin', 'commercial')
  );
$$;

revoke all on function public.profile_is_finance_commercial() from public, anon;
grant execute on function public.profile_is_finance_commercial() to authenticated;

-- ---------------------------------------------------------------------------
-- Produtos
-- ---------------------------------------------------------------------------
create table if not exists public.finance_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  billing_type text not null default 'recurring' check (billing_type in ('recurring', 'one_off')),
  default_price_cents bigint not null default 0 check (default_price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

-- ---------------------------------------------------------------------------
-- Clientes financeiros
-- ---------------------------------------------------------------------------
create table if not exists public.finance_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  document text,
  email text,
  phone text,
  address text,
  notes text,
  client_id uuid references public.clients(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_customers_client_idx on public.finance_customers (client_id);
create index if not exists finance_customers_contact_idx on public.finance_customers (contact_id);

-- ---------------------------------------------------------------------------
-- Leads (contacts): funil, origem, responsável
-- ---------------------------------------------------------------------------
alter table public.contacts
  add column if not exists source text not null default 'landing',
  add column if not exists assignee_id uuid references public.profiles(id) on delete set null,
  add column if not exists estimated_value_cents bigint,
  add column if not exists lost_reason text,
  add column if not exists notes text,
  add column if not exists converted_customer_id uuid references public.finance_customers(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.contacts drop constraint if exists contacts_status_check;
alter table public.contacts add constraint contacts_status_check
  check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'archived'));

alter table public.contacts drop constraint if exists contacts_source_check;
alter table public.contacts add constraint contacts_source_check
  check (source in ('landing', 'manual', 'referral', 'whatsapp', 'other'));

alter table public.contacts drop constraint if exists contacts_estimated_value_check;
alter table public.contacts add constraint contacts_estimated_value_check
  check (estimated_value_cents is null or estimated_value_cents >= 0);

-- Leads manuais podem não ter e-mail (indicação, WhatsApp).
alter table public.contacts alter column email drop not null;

create index if not exists contacts_status_idx on public.contacts (status);
create index if not exists contacts_assignee_idx on public.contacts (assignee_id);

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Propostas
-- ---------------------------------------------------------------------------
create table if not exists public.finance_proposals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  customer_id uuid references public.finance_customers(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until date,
  notes text,
  accepted_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_proposals_target_check check (customer_id is not null or contact_id is not null)
);

create index if not exists finance_proposals_status_idx on public.finance_proposals (status);

create table if not exists public.finance_proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.finance_proposals(id) on delete cascade,
  product_id uuid references public.finance_products(id) on delete set null,
  description text not null,
  billing_type text not null check (billing_type in ('recurring', 'one_off')),
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  installments integer not null default 1 check (installments between 1 and 60),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists finance_proposal_items_proposal_idx on public.finance_proposal_items (proposal_id);

-- ---------------------------------------------------------------------------
-- Contratos
-- ---------------------------------------------------------------------------
create table if not exists public.finance_contracts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  customer_id uuid not null references public.finance_customers(id) on delete restrict,
  proposal_id uuid references public.finance_proposals(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'paused', 'ended', 'cancelled')),
  start_date date not null default current_date,
  end_date date,
  due_day smallint not null default 10 check (due_day between 1 and 31),
  monthly_amount_cents bigint not null default 0,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_contracts_dates_check check (end_date is null or end_date >= start_date)
);

create index if not exists finance_contracts_customer_idx on public.finance_contracts (customer_id);
create index if not exists finance_contracts_status_idx on public.finance_contracts (status);
create index if not exists finance_contracts_seller_idx on public.finance_contracts (seller_id);

create table if not exists public.finance_contract_items (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.finance_contracts(id) on delete cascade,
  product_id uuid references public.finance_products(id) on delete set null,
  description text not null,
  billing_type text not null check (billing_type in ('recurring', 'one_off')),
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  installments integer not null default 1 check (installments between 1 and 60),
  first_due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists finance_contract_items_contract_idx on public.finance_contract_items (contract_id);

-- Mantém finance_contracts.monthly_amount_cents = soma dos itens recorrentes.
create or replace function public.finance_refresh_contract_amount()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target uuid := coalesce(new.contract_id, old.contract_id);
begin
  update public.finance_contracts c
  set monthly_amount_cents = coalesce((
    select sum(i.quantity * i.unit_price_cents)
    from public.finance_contract_items i
    where i.contract_id = target and i.billing_type = 'recurring'
  ), 0)
  where c.id = target;
  if tg_op = 'UPDATE' and old.contract_id is distinct from new.contract_id then
    update public.finance_contracts c
    set monthly_amount_cents = coalesce((
      select sum(i.quantity * i.unit_price_cents)
      from public.finance_contract_items i
      where i.contract_id = old.contract_id and i.billing_type = 'recurring'
    ), 0)
    where c.id = old.contract_id;
  end if;
  return null;
end;
$$;

revoke all on function public.finance_refresh_contract_amount() from public, anon, authenticated;

drop trigger if exists finance_contract_items_refresh_amount on public.finance_contract_items;
create trigger finance_contract_items_refresh_amount
after insert or update or delete on public.finance_contract_items
for each row execute function public.finance_refresh_contract_amount();

-- ---------------------------------------------------------------------------
-- Parcelas a receber
-- source_key = 'recurring' para a mensalidade, ou o id do item avulso.
-- ---------------------------------------------------------------------------
create table if not exists public.finance_receivables (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.finance_contracts(id) on delete cascade,
  contract_item_id uuid references public.finance_contract_items(id) on delete set null,
  source_key text not null,
  kind text not null check (kind in ('recurring', 'one_off')),
  competence date not null check (extract(day from competence) = 1),
  due_date date not null,
  amount_cents bigint not null check (amount_cents >= 0),
  installment_number integer,
  installments_total integer,
  status text not null default 'open' check (status in ('open', 'paid', 'cancelled')),
  paid_at date,
  paid_amount_cents bigint check (paid_amount_cents is null or paid_amount_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contract_id, source_key, competence),
  constraint finance_receivables_paid_check check (status <> 'paid' or paid_at is not null)
);

create index if not exists finance_receivables_competence_idx on public.finance_receivables (competence);
create index if not exists finance_receivables_paid_at_idx on public.finance_receivables (paid_at);
create index if not exists finance_receivables_status_due_idx on public.finance_receivables (status, due_date);

-- ---------------------------------------------------------------------------
-- Folha
-- ---------------------------------------------------------------------------
create table if not exists public.finance_payroll_runs (
  id uuid primary key default gen_random_uuid(),
  competence date not null unique check (extract(day from competence) = 1),
  status text not null default 'draft' check (status in ('draft', 'closed', 'paid')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_payroll_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.finance_payroll_runs(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  employee_name text not null,
  contract_type text,
  payment_day smallint,
  base_cents bigint not null default 0 check (base_cents >= 0),
  commission_cents bigint not null default 0 check (commission_cents >= 0),
  additional_cents bigint not null default 0 check (additional_cents >= 0),
  bonus_cents bigint not null default 0 check (bonus_cents >= 0),
  deduction_cents bigint not null default 0 check (deduction_cents >= 0),
  total_cents bigint generated always as (base_cents + commission_cents + additional_cents + bonus_cents - deduction_cents) stored,
  paid_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, user_id)
);

create index if not exists finance_payroll_items_paid_at_idx on public.finance_payroll_items (paid_at);

-- ---------------------------------------------------------------------------
-- Despesas
-- ---------------------------------------------------------------------------
create table if not exists public.finance_expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.finance_expense_categories (name)
values ('Ferramentas'), ('Impostos'), ('Aluguel'), ('Marketing'), ('Outros')
on conflict (name) do nothing;

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category_id uuid references public.finance_expense_categories(id) on delete set null,
  supplier text,
  amount_cents bigint not null check (amount_cents >= 0),
  competence date not null check (extract(day from competence) = 1),
  due_date date,
  paid_at date,
  recurring boolean not null default false,
  notes text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_expenses_competence_idx on public.finance_expenses (competence);
create index if not exists finance_expenses_paid_at_idx on public.finance_expenses (paid_at);

-- ---------------------------------------------------------------------------
-- Configurações (linha única)
-- ---------------------------------------------------------------------------
create table if not exists public.finance_settings (
  id boolean primary key default true check (id),
  default_due_day smallint not null default 10 check (default_due_day between 1 and 31),
  company_name text,
  updated_at timestamptz not null default now()
);

insert into public.finance_settings (id) values (true) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'finance_products', 'finance_customers', 'finance_proposals', 'finance_contracts',
    'finance_receivables', 'finance_payroll_runs', 'finance_payroll_items',
    'finance_expense_categories', 'finance_expenses', 'finance_settings'
  ] loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- Comercial (admin + commercial): leads, produtos, clientes, propostas, contratos, parcelas.
-- Administrativo (admin): folha, despesas, categorias; configurações são lidas pelo comercial.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'contacts', 'finance_products', 'finance_customers', 'finance_proposals', 'finance_proposal_items',
    'finance_contracts', 'finance_contract_items', 'finance_receivables'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_finance_select', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.profile_is_finance_commercial())', t || '_finance_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_finance_insert', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.profile_is_finance_commercial())', t || '_finance_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_finance_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.profile_is_finance_commercial()) with check (public.profile_is_finance_commercial())', t || '_finance_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_finance_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.profile_is_admin())', t || '_finance_delete', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;

  -- Itens de proposta são editados pelo comercial (substituição em bloco ao salvar a proposta).
  drop policy if exists finance_proposal_items_finance_delete on public.finance_proposal_items;
  create policy finance_proposal_items_finance_delete on public.finance_proposal_items
  for delete to authenticated using (public.profile_is_finance_commercial());

  foreach t in array array[
    'finance_payroll_runs', 'finance_payroll_items', 'finance_expense_categories', 'finance_expenses'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.profile_is_admin()) with check (public.profile_is_admin())', t || '_admin_all', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end;
$$;

alter table public.finance_settings enable row level security;
drop policy if exists finance_settings_select on public.finance_settings;
create policy finance_settings_select on public.finance_settings
for select to authenticated using (public.profile_is_finance_commercial());
drop policy if exists finance_settings_admin_update on public.finance_settings;
create policy finance_settings_admin_update on public.finance_settings
for update to authenticated using (public.profile_is_admin()) with check (public.profile_is_admin());
grant select, update on public.finance_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Ações atômicas (security invoker: a RLS acima continua valendo)
-- ---------------------------------------------------------------------------

-- Converte um lead em cliente financeiro (reaproveita o cliente se já convertido).
create or replace function public.finance_convert_lead(
  p_contact_id uuid,
  p_name text default null,
  p_document text default null,
  p_client_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  lead public.contacts%rowtype;
  customer uuid;
begin
  select * into lead from public.contacts where id = p_contact_id for update;
  if not found then
    raise exception 'Lead não encontrado.' using errcode = 'P0002';
  end if;

  customer := lead.converted_customer_id;
  if customer is null then
    insert into public.finance_customers (name, legal_name, document, email, phone, contact_id, client_id, owner_id)
    values (
      coalesce(nullif(trim(p_name), ''), nullif(trim(lead.company), ''), trim(concat_ws(' ', lead.first_name, lead.last_name)), 'Cliente'),
      nullif(trim(lead.company), ''),
      nullif(trim(p_document), ''),
      lead.email,
      lead.phone,
      lead.id,
      p_client_id,
      coalesce(lead.assignee_id, auth.uid())
    )
    returning id into customer;
  end if;

  update public.contacts
  set status = 'won', converted_customer_id = customer
  where id = lead.id;

  update public.finance_proposals
  set customer_id = customer
  where contact_id = lead.id and customer_id is null;

  return customer;
end;
$$;

-- Aceita uma proposta: garante o cliente, cria o contrato e copia os itens.
create or replace function public.finance_accept_proposal(
  p_proposal_id uuid,
  p_start_date date default current_date,
  p_due_day smallint default null,
  p_seller_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  proposal public.finance_proposals%rowtype;
  customer uuid;
  contract uuid;
  due_day smallint;
  first_due date;
begin
  select * into proposal from public.finance_proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'Proposta não encontrada.' using errcode = 'P0002';
  end if;
  if proposal.status not in ('draft', 'sent') then
    raise exception 'Só propostas em rascunho ou enviadas podem ser aceitas.' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.finance_proposal_items where proposal_id = proposal.id) then
    raise exception 'A proposta não tem itens.' using errcode = 'P0001';
  end if;

  customer := proposal.customer_id;
  if customer is null then
    customer := public.finance_convert_lead(proposal.contact_id);
  elsif proposal.contact_id is not null then
    update public.contacts
    set status = 'won', converted_customer_id = coalesce(converted_customer_id, customer)
    where id = proposal.contact_id;
  end if;

  due_day := coalesce(p_due_day, (select default_due_day from public.finance_settings limit 1), 10);
  -- Primeiro vencimento: dia de vencimento no mês de início (limitado ao fim do mês),
  -- ou no mês seguinte se já passou.
  first_due := least(
    date_trunc('month', p_start_date)::date + (due_day - 1),
    (date_trunc('month', p_start_date) + interval '1 month - 1 day')::date
  );
  if first_due < p_start_date then
    first_due := least(
      (date_trunc('month', p_start_date) + interval '1 month')::date + (due_day - 1),
      (date_trunc('month', p_start_date) + interval '2 month - 1 day')::date
    );
  end if;

  insert into public.finance_contracts (title, customer_id, proposal_id, seller_id, start_date, due_day, notes)
  values (proposal.title, customer, proposal.id, coalesce(p_seller_id, proposal.owner_id, auth.uid()), p_start_date, due_day, proposal.notes)
  returning id into contract;

  insert into public.finance_contract_items (contract_id, product_id, description, billing_type, quantity, unit_price_cents, installments, first_due_date, position)
  select contract, i.product_id, i.description, i.billing_type, i.quantity, i.unit_price_cents, i.installments,
         case when i.billing_type = 'one_off' then first_due end, i.position
  from public.finance_proposal_items i
  where i.proposal_id = proposal.id;

  update public.finance_proposals
  set status = 'accepted', accepted_at = now(), customer_id = customer
  where id = proposal.id;

  return contract;
end;
$$;

revoke all on function public.finance_convert_lead(uuid, text, text, uuid) from public, anon;
grant execute on function public.finance_convert_lead(uuid, text, text, uuid) to authenticated;
revoke all on function public.finance_accept_proposal(uuid, date, smallint, uuid) from public, anon;
grant execute on function public.finance_accept_proposal(uuid, date, smallint, uuid) to authenticated;
