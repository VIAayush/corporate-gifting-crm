-- Oaklane CRM schema
-- Applied to Supabase project ajysowosgjaipczrwpfv

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('admin', 'sales', 'operations', 'accounts', 'management');
create type public.company_status as enum ('active', 'inactive', 'prospect');
create type public.contact_type as enum ('primary', 'billing', 'procurement', 'other');
create type public.lead_stage as enum ('cold', 'warm', 'hot', 'client', 'regular_client');
create type public.lead_source as enum ('inbound', 'referral', 'event', 'outbound', 'website', 'other');
create type public.requirement_status as enum ('draft', 'active', 'quoted', 'won', 'lost', 'closed');
create type public.product_status as enum ('active', 'discontinued');
create type public.quotation_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');
create type public.order_status as enum ('created', 'confirmed', 'in_progress', 'dispatched', 'delivered', 'cancelled');
create type public.invoice_status as enum ('unpaid', 'partially_paid', 'paid', 'overdue');
create type public.activity_type as enum ('call', 'email', 'meeting', 'follow_up', 'message');
create type public.activity_status as enum ('upcoming', 'completed', 'missed');
create type public.payment_method as enum ('bank_transfer', 'cheque', 'upi', 'card', 'cash', 'other');
create type public.mockup_status as enum ('draft', 'shared', 'approved', 'rejected');

-- ---------------------------------------------------------------------------
-- Helper: updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.app_role not null default 'sales',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth helpers (security definer for RLS)
-- ---------------------------------------------------------------------------
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.has_any_role(roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = any(roles) from public.profiles where id = auth.uid()), false);
$$;

-- Module access
create or replace function public.can_crm()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['admin','sales','management']::public.app_role[]);
$$;

create or replace function public.can_sales()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['admin','sales','management']::public.app_role[]);
$$;

create or replace function public.can_ops()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['admin','operations','management']::public.app_role[]);
$$;

create or replace function public.can_finance()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['admin','accounts','management']::public.app_role[]);
$$;

create or replace function public.can_orders_read()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['admin','sales','operations','accounts','management']::public.app_role[]);
$$;

create or replace function public.can_orders_write()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['admin','operations']::public.app_role[]);
$$;

create or replace function public.can_manage_team()
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin();
$$;

-- ---------------------------------------------------------------------------
-- Categories / brands
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (category_id, name)
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Vendors
-- ---------------------------------------------------------------------------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  city text,
  category text,
  credit_period_days integer not null default 0 check (credit_period_days >= 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger suppliers_updated_at before update on public.suppliers
for each row execute function public.set_updated_at();

create table public.printing_vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  service_type text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger printing_vendors_updated_at before update on public.printing_vendors
for each row execute function public.set_updated_at();

create table public.courier_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  service_type text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger courier_partners_updated_at before update on public.courier_partners
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Companies / branches / contacts
-- ---------------------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  website text,
  address text,
  city text,
  state text,
  country text not null default 'India',
  owner_id uuid references public.profiles(id),
  status public.company_status not null default 'prospect',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index companies_owner_idx on public.companies(owner_id);
create index companies_name_idx on public.companies(name);
create trigger companies_updated_at before update on public.companies
for each row execute function public.set_updated_at();

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  address text,
  city text,
  state text,
  is_head_office boolean not null default false,
  created_at timestamptz not null default now()
);
create index branches_company_idx on public.branches(company_id);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete set null,
  full_name text not null,
  designation text,
  email text,
  phone text,
  contact_type public.contact_type not null default 'primary',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_company_idx on public.contacts(company_id);
create trigger contacts_updated_at before update on public.contacts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand_id uuid references public.brands(id),
  category_id uuid references public.categories(id),
  subcategory_id uuid references public.subcategories(id),
  description text,
  price numeric(12,2) not null check (price >= 0),
  moq integer not null default 1 check (moq >= 1),
  hsn_code text,
  supplier_id uuid references public.suppliers(id),
  image_url text,
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_idx on public.products(status);
create index products_category_idx on public.products(category_id);
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  colour text,
  size text,
  gender text,
  material text,
  sku text unique,
  extra_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  contact_id uuid references public.contacts(id),
  owner_id uuid references public.profiles(id),
  source public.lead_source not null default 'inbound',
  stage public.lead_stage not null default 'cold',
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0),
  expected_conversion_date date,
  notes text,
  last_activity_at timestamptz,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_stage_idx on public.leads(stage);
create index leads_owner_idx on public.leads(owner_id);
create trigger leads_updated_at before update on public.leads
for each row execute function public.set_updated_at();

create table public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_stage public.lead_stage,
  to_stage public.lead_stage not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  note text
);

create or replace function public.lead_stage_rank(stage public.lead_stage)
returns integer language sql immutable as $$
  select case stage
    when 'cold' then 1
    when 'warm' then 2
    when 'hot' then 3
    when 'client' then 4
    when 'regular_client' then 5
  end;
$$;

create or replace function public.prevent_lead_regression()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.stage is distinct from old.stage then
    if public.lead_stage_rank(old.stage) >= 3
       and public.lead_stage_rank(new.stage) < public.lead_stage_rank(old.stage)
       and not public.has_any_role(array['admin','management']::public.app_role[]) then
      raise exception 'Hot or client leads cannot move backward without admin or management permission';
    end if;
    insert into public.lead_stage_history (lead_id, from_stage, to_stage, changed_by)
    values (new.id, old.stage, new.stage, auth.uid());
  end if;
  return new;
end;
$$;

create trigger leads_stage_guard before update on public.leads
for each row execute function public.prevent_lead_regression();

-- ---------------------------------------------------------------------------
-- Requirements
-- ---------------------------------------------------------------------------
create table public.requirements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_id uuid not null references public.companies(id),
  contact_id uuid references public.contacts(id),
  lead_id uuid references public.leads(id),
  owner_id uuid references public.profiles(id),
  quantity integer not null default 1 check (quantity >= 1),
  budget numeric(14,2) check (budget is null or budget >= 0),
  deadline date,
  delivery_city text,
  purpose text,
  payment_terms text,
  description text,
  revenue_opportunity numeric(14,2) not null default 0,
  status public.requirement_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index requirements_status_idx on public.requirements(status);
create trigger requirements_updated_at before update on public.requirements
for each row execute function public.set_updated_at();

create table public.requirement_products (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null default 1 check (quantity >= 1),
  notes text,
  unique (requirement_id, product_id)
);

-- ---------------------------------------------------------------------------
-- Mockups (metadata only; files in storage)
-- ---------------------------------------------------------------------------
create table public.mockups (
  id uuid primary key default gen_random_uuid(),
  requirement_id uuid not null references public.requirements(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null,
  file_size_bytes integer not null check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  status public.mockup_status not null default 'draft',
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index mockups_requirement_idx on public.mockups(requirement_id);

-- ---------------------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------------------
create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text not null unique,
  requirement_id uuid not null references public.requirements(id),
  company_id uuid not null references public.companies(id),
  contact_id uuid references public.contacts(id),
  owner_id uuid references public.profiles(id),
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  tax_percent numeric(5,2) not null default 18 check (tax_percent >= 0),
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  tax_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  valid_until date,
  status public.quotation_status not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quotations_status_idx on public.quotations(status);
create trigger quotations_updated_at before update on public.quotations
for each row execute function public.set_updated_at();

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  product_id uuid not null references public.products(id),
  description text,
  quantity integer not null check (quantity >= 1),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount_percent numeric(5,2) not null default 0,
  tax_percent numeric(5,2) not null default 18,
  line_total numeric(14,2) not null default 0
);

create table public.quotation_history (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  from_status public.quotation_status,
  to_status public.quotation_status not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  note text
);

create or replace function public.recalc_quotation_totals(p_quotation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal numeric(14,2);
  v_discount numeric(14,2);
  v_tax numeric(14,2);
  v_header public.quotations%rowtype;
begin
  select * into v_header from public.quotations where id = p_quotation_id;
  select coalesce(sum(quantity * unit_price), 0) into v_subtotal
  from public.quotation_items where quotation_id = p_quotation_id;
  v_discount := round(v_subtotal * v_header.discount_percent / 100, 2);
  v_tax := round((v_subtotal - v_discount) * v_header.tax_percent / 100, 2);
  update public.quotations
    set subtotal = v_subtotal,
        discount_amount = v_discount,
        tax_amount = v_tax,
        total = v_subtotal - v_discount + v_tax
    where id = p_quotation_id;
  update public.quotation_items
    set line_total = round(quantity * unit_price * (1 - discount_percent/100) * (1 + tax_percent/100), 2)
    where quotation_id = p_quotation_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  company_id uuid not null references public.companies(id),
  contact_id uuid references public.contacts(id),
  quotation_id uuid unique references public.quotations(id),
  owner_id uuid references public.profiles(id),
  operations_user_id uuid references public.profiles(id),
  supplier_id uuid references public.suppliers(id),
  printing_vendor_id uuid references public.printing_vendors(id),
  courier_partner_id uuid references public.courier_partners(id),
  order_value numeric(14,2) not null default 0,
  po_number text,
  expected_delivery_date date,
  actual_delivery_date date,
  status public.order_status not null default 'created',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_status_idx on public.orders(status);
create trigger orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  description text,
  quantity integer not null check (quantity >= 1),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(14,2) not null default 0
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz not null default now(),
  note text
);

create or replace function public.track_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
    if new.status = 'delivered' and new.actual_delivery_date is null then
      new.actual_delivery_date := current_date;
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_status_history before update on public.orders
for each row execute function public.track_order_status();

-- ---------------------------------------------------------------------------
-- Finance
-- ---------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  order_id uuid not null references public.orders(id),
  company_id uuid not null references public.companies(id),
  invoice_date date not null default current_date,
  due_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  status public.invoice_status not null default 'unpaid',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id)
);
create trigger invoices_updated_at before update on public.invoices
for each row execute function public.set_updated_at();

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  method public.payment_method not null default 'bank_transfer',
  reference text,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create or replace function public.refresh_invoice_status(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric(14,2);
  v_paid numeric(14,2);
  v_due date;
  v_status public.invoice_status;
begin
  select amount, due_date into v_amount, v_due from public.invoices where id = p_invoice_id;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = p_invoice_id;
  if v_paid >= v_amount then
    v_status := 'paid';
  elsif v_paid > 0 then
    v_status := 'partially_paid';
  elsif v_due < current_date then
    v_status := 'overdue';
  else
    v_status := 'unpaid';
  end if;
  update public.invoices set status = v_status where id = p_invoice_id;
end;
$$;

create or replace function public.payments_refresh_invoice()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.refresh_invoice_status(coalesce(new.invoice_id, old.invoice_id));
  return coalesce(new, old);
end;
$$;

create trigger payments_after_change after insert or update or delete on public.payments
for each row execute function public.payments_refresh_invoice();

-- ---------------------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type public.activity_type not null default 'follow_up',
  due_at timestamptz,
  assigned_to uuid references public.profiles(id),
  related_type text,
  related_id uuid,
  status public.activity_status not null default 'upcoming',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index activities_due_idx on public.activities(due_at);
create index activities_assigned_idx on public.activities(assigned_to);
create trigger activities_updated_at before update on public.activities
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs(entity, entity_id);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create or replace function public.write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action text;
  v_id uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'create';
    v_id := new.id;
    insert into public.audit_logs(user_id, action, entity, entity_id, new_value)
    values (auth.uid(), v_action, tg_table_name, v_id, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    if to_jsonb(new) ? 'status' and (to_jsonb(new)->>'status') is distinct from (to_jsonb(old)->>'status') then
      v_action := 'status_change';
    elsif to_jsonb(new) ? 'owner_id' and (to_jsonb(new)->>'owner_id') is distinct from (to_jsonb(old)->>'owner_id') then
      v_action := 'assignment_change';
    end if;
    insert into public.audit_logs(user_id, action, entity, entity_id, previous_value, new_value)
    values (auth.uid(), v_action, tg_table_name, new.id, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_logs(user_id, action, entity, entity_id, previous_value)
    values (auth.uid(), 'delete', tg_table_name, old.id, to_jsonb(old));
    return old;
  end if;
end;
$$;

create trigger audit_companies after insert or update or delete on public.companies
for each row execute function public.write_audit();
create trigger audit_contacts after insert or update or delete on public.contacts
for each row execute function public.write_audit();
create trigger audit_leads after insert or update or delete on public.leads
for each row execute function public.write_audit();
create trigger audit_requirements after insert or update or delete on public.requirements
for each row execute function public.write_audit();
create trigger audit_quotations after insert or update or delete on public.quotations
for each row execute function public.write_audit();
create trigger audit_orders after insert or update or delete on public.orders
for each row execute function public.write_audit();
create trigger audit_invoices after insert or update or delete on public.invoices
for each row execute function public.write_audit();
create trigger audit_payments after insert or update or delete on public.payments
for each row execute function public.write_audit();
create trigger audit_mockups after insert or update or delete on public.mockups
for each row execute function public.write_audit();

-- ---------------------------------------------------------------------------
-- Sequences for human numbers
-- ---------------------------------------------------------------------------
create sequence public.quotation_seq start 1001;
create sequence public.order_seq start 2001;
create sequence public.invoice_seq start 3001;

create or replace function public.next_quotation_number()
returns text language sql as $$ select 'Q-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quotation_seq')::text, 4, '0'); $$;
create or replace function public.next_order_number()
returns text language sql as $$ select 'SO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_seq')::text, 4, '0'); $$;
create or replace function public.next_invoice_number()
returns text language sql as $$ select 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0'); $$;

-- Convert accepted quotation to order
create or replace function public.convert_quotation_to_order(p_quotation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  q public.quotations%rowtype;
  v_order_id uuid;
begin
  if not public.has_any_role(array['admin','sales','operations']::public.app_role[]) then
    raise exception 'Not permitted to convert quotations';
  end if;
  select * into q from public.quotations where id = p_quotation_id;
  if not found then raise exception 'Quotation not found'; end if;
  if q.status <> 'accepted' then raise exception 'Only accepted quotations can become orders'; end if;
  if exists (select 1 from public.orders where quotation_id = q.id) then
    select id into v_order_id from public.orders where quotation_id = q.id;
    return v_order_id;
  end if;

  insert into public.orders (
    order_number, company_id, contact_id, quotation_id, owner_id,
    order_value, expected_delivery_date, status
  ) values (
    public.next_order_number(), q.company_id, q.contact_id, q.id, q.owner_id,
    q.total, current_date + 21, 'created'
  ) returning id into v_order_id;

  insert into public.order_items (order_id, product_id, description, quantity, unit_price, line_total)
  select v_order_id, product_id, description, quantity, unit_price,
         round(quantity * unit_price, 2)
  from public.quotation_items where quotation_id = q.id;

  update public.requirements set status = 'won' where id = q.requirement_id;
  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.brands enable row level security;
alter table public.suppliers enable row level security;
alter table public.printing_vendors enable row level security;
alter table public.courier_partners enable row level security;
alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.contacts enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.leads enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.requirements enable row level security;
alter table public.requirement_products enable row level security;
alter table public.mockups enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.quotation_history enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.activities enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles: users see all active team (needed for assignment dropdowns), only admin updates roles
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));
create policy profiles_admin_all on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Catalog: readable by authenticated; write by sales/admin
create policy cat_select on public.categories for select to authenticated using (true);
create policy cat_write on public.categories for all to authenticated using (public.can_sales()) with check (public.can_sales());
create policy subcat_select on public.subcategories for select to authenticated using (true);
create policy subcat_write on public.subcategories for all to authenticated using (public.can_sales()) with check (public.can_sales());
create policy brands_select on public.brands for select to authenticated using (true);
create policy brands_write on public.brands for all to authenticated using (public.can_sales()) with check (public.can_sales());

create policy products_select on public.products for select to authenticated using (true);
create policy products_write on public.products for all to authenticated using (public.can_sales()) with check (public.can_sales());
create policy variants_select on public.product_variants for select to authenticated using (true);
create policy variants_write on public.product_variants for all to authenticated using (public.can_sales()) with check (public.can_sales());

-- CRM
create policy companies_select on public.companies for select to authenticated using (public.can_crm() or public.can_orders_read() or public.can_finance());
create policy companies_write on public.companies for all to authenticated using (public.can_crm()) with check (public.can_crm());
create policy branches_select on public.branches for select to authenticated using (public.can_crm() or public.can_orders_read() or public.can_finance());
create policy branches_write on public.branches for all to authenticated using (public.can_crm()) with check (public.can_crm());
create policy contacts_select on public.contacts for select to authenticated using (public.can_crm() or public.can_orders_read() or public.can_finance());
create policy contacts_write on public.contacts for all to authenticated using (public.can_crm()) with check (public.can_crm());
create policy leads_select on public.leads for select to authenticated using (public.can_crm());
create policy leads_write on public.leads for all to authenticated using (public.can_crm()) with check (public.can_crm());
create policy lead_hist_select on public.lead_stage_history for select to authenticated using (public.can_crm());
create policy req_select on public.requirements for select to authenticated using (public.can_crm() or public.can_ops());
create policy req_write on public.requirements for all to authenticated using (public.can_crm()) with check (public.can_crm());
create policy req_prod_select on public.requirement_products for select to authenticated using (public.can_crm() or public.can_ops());
create policy req_prod_write on public.requirement_products for all to authenticated using (public.can_sales()) with check (public.can_sales());
create policy mockups_select on public.mockups for select to authenticated using (public.can_sales() or public.can_ops());
create policy mockups_write on public.mockups for all to authenticated using (public.can_sales()) with check (public.can_sales());

-- Quotations
create policy quot_select on public.quotations for select to authenticated using (public.can_sales() or public.can_ops() or public.can_finance());
create policy quot_write on public.quotations for all to authenticated using (public.can_sales()) with check (public.can_sales());
create policy quot_items_select on public.quotation_items for select to authenticated using (public.can_sales() or public.can_ops() or public.can_finance());
create policy quot_items_write on public.quotation_items for all to authenticated using (public.can_sales()) with check (public.can_sales());
create policy quot_hist_select on public.quotation_history for select to authenticated using (public.can_sales() or public.can_ops());

-- Orders
create policy orders_select on public.orders for select to authenticated using (public.can_orders_read());
create policy orders_insert on public.orders for insert to authenticated with check (public.has_any_role(array['admin','sales','operations']::public.app_role[]));
create policy orders_update on public.orders for update to authenticated using (public.can_orders_write() or public.is_admin()) with check (public.can_orders_write() or public.is_admin());
create policy orders_delete on public.orders for delete to authenticated using (public.is_admin());
create policy order_items_select on public.order_items for select to authenticated using (public.can_orders_read());
create policy order_items_write on public.order_items for all to authenticated using (public.can_orders_write() or public.is_admin()) with check (public.can_orders_write() or public.is_admin());
create policy order_hist_select on public.order_status_history for select to authenticated using (public.can_orders_read());

-- Vendors
create policy suppliers_select on public.suppliers for select to authenticated using (public.can_ops() or public.can_sales() or public.can_finance());
create policy suppliers_write on public.suppliers for all to authenticated using (public.can_ops()) with check (public.can_ops());
create policy print_select on public.printing_vendors for select to authenticated using (public.can_ops() or public.is_admin());
create policy print_write on public.printing_vendors for all to authenticated using (public.can_ops()) with check (public.can_ops());
create policy courier_select on public.courier_partners for select to authenticated using (public.can_ops() or public.is_admin());
create policy courier_write on public.courier_partners for all to authenticated using (public.can_ops()) with check (public.can_ops());

-- Finance
create policy invoices_select on public.invoices for select to authenticated using (public.can_finance() or public.is_admin() or public.has_any_role(array['management']::public.app_role[]));
create policy invoices_write on public.invoices for all to authenticated using (public.can_finance()) with check (public.can_finance());
create policy payments_select on public.payments for select to authenticated using (public.can_finance() or public.has_any_role(array['management']::public.app_role[]));
create policy payments_write on public.payments for all to authenticated using (public.can_finance()) with check (public.can_finance());

-- Activities: sales + ops + admin + management
create policy activities_select on public.activities for select to authenticated using (true);
create policy activities_write on public.activities for all to authenticated
  using (public.has_any_role(array['admin','sales','operations','management']::public.app_role[]))
  with check (public.has_any_role(array['admin','sales','operations','management']::public.app_role[]));

-- Audit: admin + management
create policy audit_select on public.audit_logs for select to authenticated
  using (public.has_any_role(array['admin','management']::public.app_role[]));
create policy audit_insert on public.audit_logs for insert to authenticated with check (true);

-- New profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'sales')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mockups',
  'mockups',
  false,
  10485760,
  array['image/png','image/jpeg','image/webp','application/pdf']
)
on conflict (id) do nothing;

create policy mockups_storage_select on storage.objects for select to authenticated
  using (bucket_id = 'mockups' and (public.can_sales() or public.can_ops()));
create policy mockups_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'mockups' and public.can_sales());
create policy mockups_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'mockups' and (public.can_sales() or public.is_admin()));
