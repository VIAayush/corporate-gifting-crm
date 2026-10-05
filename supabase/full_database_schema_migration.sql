-- Souvenir Gifting Solutions — full database schema migration
-- Source: Supabase project corporate-gifting-crm (ajysowosgjaipczrwpfv), PostgreSQL 17.6
-- Snapshot: 2026-10-05 11:21 UTC, after migration 20261005095825 (51 migrations applied)
--
-- Recreates the complete application schema in a NEW, empty Supabase project
-- (Postgres 17): extensions, enums, sequences, tables, constraints, indexes,
-- functions, views, triggers, RLS, policies, grants, comments, storage buckets
-- and storage policies.
--
-- Schema only. Not included: table data, auth users, files stored in buckets.
--
-- Run once against the new project, e.g.:
--   psql "<new project connection string>" -v ON_ERROR_STOP=1 -f full_database_schema_migration.sql
-- or paste into the Supabase SQL editor.

set check_function_bodies = false;


-- ======================================================================
-- 1. Extensions
-- ======================================================================

create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;


-- ======================================================================
-- 2. Enum types (18)
-- ======================================================================

create type public.activity_status as enum ('upcoming', 'completed', 'missed');
create type public.activity_type as enum ('call', 'email', 'meeting', 'follow_up', 'message');
create type public.app_role as enum ('admin', 'sales', 'operations', 'accounts', 'management', 'client_admin', 'client_user');
create type public.campaign_status as enum ('planning', 'internal_review', 'published_to_client', 'client_viewed', 'client_shortlisted', 'client_selected', 'quoted', 'awaiting_approval', 'approved', 'rejected', 'order_ready', 'closed');
create type public.company_status as enum ('active', 'inactive', 'prospect');
create type public.contact_type as enum ('primary', 'billing', 'procurement', 'other');
create type public.invoice_status as enum ('unpaid', 'partially_paid', 'paid', 'overdue');
create type public.lead_source as enum ('inbound', 'referral', 'event', 'outbound', 'website', 'other');
create type public.lead_stage as enum ('cold', 'warm', 'hot', 'client', 'regular_client');
create type public.mockup_status as enum ('draft', 'shared', 'approved', 'rejected');
create type public.notification_audience as enum ('internal', 'client');
create type public.offering_visibility as enum ('draft', 'published', 'unpublished', 'archived');
create type public.order_status as enum ('created', 'confirmed', 'in_progress', 'dispatched', 'delivered', 'cancelled', 'procurement', 'printing', 'quality_check', 'ready_to_dispatch');
create type public.payment_method as enum ('bank_transfer', 'cheque', 'upi', 'card', 'cash', 'other');
create type public.product_status as enum ('active', 'discontinued');
create type public.quotation_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired', 'viewed');
create type public.requirement_status as enum ('draft', 'active', 'quoted', 'won', 'lost', 'closed');
create type public.selection_kind as enum ('none', 'shortlisted', 'selected', 'rejected');


-- ======================================================================
-- 3. Sequences (3) — created at their original START values; current values are data, not schema
-- ======================================================================

create sequence public.invoice_seq as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 start with 3001 cache 1 no cycle;
create sequence public.order_seq as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 start with 2001 cache 1 no cycle;
create sequence public.quotation_seq as bigint increment by 1 minvalue 1 maxvalue 9223372036854775807 start with 1001 cache 1 no cycle;


-- ======================================================================
-- 4. Tables (53)
-- ======================================================================

create table public.activities (
  id uuid default gen_random_uuid() not null,
  title text not null,
  type public.activity_type default 'follow_up'::public.activity_type not null,
  due_at timestamp with time zone,
  assigned_to uuid,
  related_type text,
  related_id uuid,
  status public.activity_status default 'upcoming'::public.activity_status not null,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.announcements (
  id uuid default gen_random_uuid() not null,
  title text not null,
  body text,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.audit_logs (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone default now() not null
);

create table public.branches (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  name text not null,
  address text,
  city text,
  state text,
  is_head_office boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.brands (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);

create table public.campaign_events (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid not null,
  actor_id uuid,
  event_type text not null,
  payload jsonb,
  created_at timestamp with time zone default now() not null
);

create table public.campaign_products (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid not null,
  product_id uuid not null,
  display_name text not null,
  client_description text,
  client_image_url text,
  selling_price numeric(12,2) not null,
  discount_percent numeric(5,2) default 0 not null,
  quantity_limit integer,
  moq integer,
  personalization_options text,
  variant_availability text,
  estimated_delivery text,
  client_specs text,
  display_order integer default 0 not null,
  visibility public.offering_visibility default 'draft'::public.offering_visibility not null,
  published_at timestamp with time zone,
  published_by uuid,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  pack_option text,
  pack_kit_id uuid,
  pack_kit_role text,
  pack_kit_total numeric
);

create table public.campaigns (
  id uuid default gen_random_uuid() not null,
  name text not null,
  company_id uuid,
  requirement_id uuid,
  owner_id uuid,
  occasion text,
  description text,
  employee_quantity integer default 1 not null,
  budget_per_employee numeric(12,2) default 0 not null,
  total_budget numeric(14,2) default 0 not null,
  required_delivery_date date,
  delivery_locations text,
  preferred_categories text,
  branding_requirements text,
  packaging_requirements text,
  custom_requirements text,
  status public.campaign_status default 'planning'::public.campaign_status not null,
  published_to_client_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  cloned_from uuid
);

create table public.catalog_assignments (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid not null,
  company_id uuid not null,
  assigned_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.catalog_share_links (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid not null,
  token text not null,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.categories (
  id uuid default gen_random_uuid() not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);

create table public.client_comments (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid not null,
  campaign_product_id uuid,
  quotation_id uuid,
  company_id uuid not null,
  user_id uuid not null,
  body text not null,
  created_at timestamp with time zone default now() not null
);

create table public.client_product_selections (
  id uuid default gen_random_uuid() not null,
  campaign_id uuid not null,
  campaign_product_id uuid not null,
  company_id uuid not null,
  user_id uuid not null,
  kind public.selection_kind default 'shortlisted'::public.selection_kind not null,
  quantity integer,
  preference_rank integer,
  comment text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.companies (
  id uuid default gen_random_uuid() not null,
  name text not null,
  industry text,
  website text,
  address text,
  city text,
  state text,
  country text default 'India'::text not null,
  owner_id uuid,
  status public.company_status default 'prospect'::public.company_status not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  logo_path text,
  gst_number text,
  company_type text,
  margin_percent numeric,
  allowed_email_domains text[] default '{}'::text[] not null,
  portal_slug text,
  portal_status text default 'active'::text not null,
  trial_ends_at timestamp with time zone,
  subdomain_status text default 'none'::text,
  subdomain_attempts integer default 0,
  subdomain_last_error text,
  subdomain_updated_at timestamp with time zone
);

create table public.company_product_access (
  company_id uuid not null,
  product_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.company_product_exclusions (
  company_id uuid not null,
  product_id uuid not null,
  created_at timestamp with time zone default now() not null
);

create table public.contacts (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  branch_id uuid,
  full_name text not null,
  designation text,
  email text,
  phone text,
  contact_type public.contact_type default 'primary'::public.contact_type not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  linkedin text,
  kind text default 'corporate'::text not null,
  department_name text
);

create table public.courier_partners (
  id uuid default gen_random_uuid() not null,
  name text not null,
  contact_person text,
  phone text,
  email text,
  service_type text,
  notes text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  city text,
  tracking_supported boolean default true not null
);

create table public.department_members (
  department_id uuid not null,
  user_id uuid not null
);

create table public.departments (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  name text not null,
  manager_id uuid,
  created_at timestamp with time zone default now() not null
);

create table public.goals (
  id uuid default gen_random_uuid() not null,
  title text not null,
  period_type text not null,
  period_start date not null,
  metric text not null,
  target numeric(14,2) not null,
  owner_id uuid,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.invoices (
  id uuid default gen_random_uuid() not null,
  invoice_number text not null,
  order_id uuid not null,
  company_id uuid not null,
  invoice_date date default CURRENT_DATE not null,
  due_date date not null,
  amount numeric(14,2) not null,
  status public.invoice_status default 'unpaid'::public.invoice_status not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.lead_stage_history (
  id uuid default gen_random_uuid() not null,
  lead_id uuid not null,
  from_stage public.lead_stage,
  to_stage public.lead_stage not null,
  changed_by uuid,
  changed_at timestamp with time zone default now() not null,
  note text
);

create table public.leads (
  id uuid default gen_random_uuid() not null,
  company_id uuid not null,
  contact_id uuid,
  owner_id uuid,
  source public.lead_source default 'inbound'::public.lead_source not null,
  stage public.lead_stage default 'cold'::public.lead_stage not null,
  estimated_value numeric(14,2) default 0 not null,
  expected_conversion_date date,
  notes text,
  last_activity_at timestamp with time zone,
  next_follow_up_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.mockups (
  id uuid default gen_random_uuid() not null,
  requirement_id uuid,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  file_size_bytes integer not null,
  status public.mockup_status default 'draft'::public.mockup_status not null,
  uploaded_by uuid,
  created_at timestamp with time zone default now() not null,
  order_id uuid,
  product_id uuid
);

create table public.notifications (
  id uuid default gen_random_uuid() not null,
  audience public.notification_audience not null,
  company_id uuid,
  user_id uuid,
  title text not null,
  body text,
  link text,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table public.order_assignments (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  department_id uuid,
  assigned_to uuid,
  assigned_by uuid,
  note text,
  created_at timestamp with time zone default now() not null
);

create table public.order_items (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  product_id uuid not null,
  description text,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  line_total numeric(14,2) default 0 not null
);

create table public.order_status_history (
  id uuid default gen_random_uuid() not null,
  order_id uuid not null,
  from_status public.order_status,
  to_status public.order_status not null,
  changed_by uuid,
  changed_at timestamp with time zone default now() not null,
  note text
);

create table public.orders (
  id uuid default gen_random_uuid() not null,
  order_number text not null,
  company_id uuid not null,
  contact_id uuid,
  quotation_id uuid,
  owner_id uuid,
  operations_user_id uuid,
  supplier_id uuid,
  printing_vendor_id uuid,
  courier_partner_id uuid,
  order_value numeric(14,2) default 0 not null,
  po_number text,
  expected_delivery_date date,
  actual_delivery_date date,
  status public.order_status default 'created'::public.order_status not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  assigned_to uuid,
  current_department_id uuid,
  stage_due_at date,
  next_action text,
  priority integer default 3 not null,
  requirement_id uuid,
  tracking_number text,
  dispatch_date date,
  product_cost numeric(14,2) default 0 not null,
  printing_cost numeric(14,2) default 0 not null,
  courier_cost numeric(14,2) default 0 not null,
  other_cost numeric(14,2) default 0 not null,
  total_cost numeric(14,2) default 0 not null,
  gross_profit numeric(14,2) default 0 not null,
  campaign_id uuid
);

create table public.org_settings (
  id integer default 1 not null,
  organisation_name text default 'Oaklane Gift Operations'::text not null,
  default_tax_percent numeric(5,2) default 18 not null,
  currency text default 'INR'::text not null,
  updated_at timestamp with time zone default now() not null,
  default_margin_percent numeric,
  b2c_margin_percent numeric,
  b2b_margin_percent numeric,
  best_cost_require_in_stock boolean default true not null,
  crm_use_best_cost boolean default false not null,
  crm_show_sell_price boolean default true not null,
  portal_use_best_cost boolean default false not null,
  portal_show_sell_price boolean default true not null,
  microsite_use_best_cost boolean default false not null,
  microsite_show_sell_price boolean default true not null,
  store_use_best_cost boolean default false not null,
  store_show_sell_price boolean default true not null
);

create table public.payables (
  id uuid default gen_random_uuid() not null,
  vendor_type text not null,
  vendor_name text not null,
  order_id uuid,
  amount numeric(14,2) not null,
  amount_paid numeric(14,2) default 0 not null,
  due_date date,
  status text default 'unpaid'::text not null,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.payments (
  id uuid default gen_random_uuid() not null,
  invoice_id uuid not null,
  payment_date date default CURRENT_DATE not null,
  amount numeric(14,2) not null,
  method public.payment_method default 'bank_transfer'::public.payment_method not null,
  reference text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.portal_host_runs (
  id uuid default gen_random_uuid() not null,
  kind text not null,
  started_at timestamp with time zone default now() not null,
  finished_at timestamp with time zone,
  processed integer default 0 not null,
  errors integer default 0 not null,
  rate_limited_until timestamp with time zone,
  details jsonb default '{}'::jsonb not null
);

create table public.portal_hosts (
  id uuid default gen_random_uuid() not null,
  company_id uuid,
  slug text not null,
  hostname text not null,
  role text default 'primary'::text not null,
  desired text default 'parked'::text not null,
  status text default 'queued'::text not null,
  attempts integer default 0 not null,
  next_attempt_at timestamp with time zone default now() not null,
  locked_until timestamp with time zone,
  verify_deadline timestamp with time zone,
  redirect_until timestamp with time zone,
  unpark_after timestamp with time zone,
  action_requested_at timestamp with time zone,
  park_requests integer default 0 not null,
  unpark_requests integer default 0 not null,
  unpark_requested_at timestamp with time zone,
  last_error text,
  last_error_code text,
  last_checked_at timestamp with time zone,
  live_at timestamp with time zone,
  notify_on_live boolean default true not null,
  notify_client_admins boolean default false not null,
  notified_live_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.printing_vendors (
  id uuid default gen_random_uuid() not null,
  name text not null,
  contact_person text,
  phone text,
  email text,
  service_type text,
  notes text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  city text
);

create table public.product_supplier_offers (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  supplier_id uuid not null,
  supplier_sku text,
  cost numeric not null,
  moq integer default 1 not null,
  lead_time_days integer,
  in_stock boolean default true not null,
  is_active boolean default true not null,
  is_preferred boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.product_variants (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  colour text,
  size text,
  gender text,
  material text,
  sku text,
  extra_price numeric(12,2) default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table public.products (
  id uuid default gen_random_uuid() not null,
  name text not null,
  brand_id uuid,
  category_id uuid,
  subcategory_id uuid,
  description text,
  price numeric(12,2) not null,
  moq integer default 1 not null,
  hsn_code text,
  supplier_id uuid,
  image_url text,
  status public.product_status default 'active'::public.product_status not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  supplier_cost numeric(12,2),
  internal_margin numeric(12,2),
  internal_notes text,
  visibility text default 'internal_only'::text not null,
  sku text not null,
  catalogue_access text default 'all'::text not null
);

create table public.profiles (
  id uuid not null,
  full_name text not null,
  email text not null,
  role public.app_role default 'sales'::public.app_role not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  company_id uuid,
  department_id uuid
);

create table public.quotation_history (
  id uuid default gen_random_uuid() not null,
  quotation_id uuid not null,
  from_status public.quotation_status,
  to_status public.quotation_status not null,
  changed_by uuid,
  changed_at timestamp with time zone default now() not null,
  note text
);

create table public.quotation_item_costs (
  quotation_item_id uuid not null,
  supplier_offer_id uuid,
  supplier_cost numeric,
  margin_percent numeric,
  updated_at timestamp with time zone default now() not null
);

create table public.quotation_items (
  id uuid default gen_random_uuid() not null,
  quotation_id uuid not null,
  product_id uuid not null,
  description text,
  quantity integer not null,
  unit_price numeric(12,2) not null,
  discount_percent numeric(5,2) default 0 not null,
  tax_percent numeric(5,2) default 18 not null,
  line_total numeric(14,2) default 0 not null,
  client_response text
);

create table public.quotations (
  id uuid default gen_random_uuid() not null,
  quotation_number text not null,
  requirement_id uuid,
  company_id uuid not null,
  contact_id uuid,
  owner_id uuid,
  discount_percent numeric(5,2) default 0 not null,
  tax_percent numeric(5,2) default 18 not null,
  subtotal numeric(14,2) default 0 not null,
  discount_amount numeric(14,2) default 0 not null,
  tax_amount numeric(14,2) default 0 not null,
  total numeric(14,2) default 0 not null,
  valid_until date,
  status public.quotation_status default 'draft'::public.quotation_status not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  campaign_id uuid,
  client_comment text,
  responded_at timestamp with time zone,
  responded_by uuid
);

create table public.requirement_products (
  id uuid default gen_random_uuid() not null,
  requirement_id uuid not null,
  product_id uuid not null,
  quantity integer default 1 not null,
  notes text
);

create table public.requirements (
  id uuid default gen_random_uuid() not null,
  name text not null,
  company_id uuid not null,
  contact_id uuid,
  lead_id uuid,
  owner_id uuid,
  quantity integer default 1 not null,
  budget numeric(14,2),
  deadline date,
  delivery_city text,
  purpose text,
  payment_terms text,
  description text,
  revenue_opportunity numeric(14,2) default 0 not null,
  status public.requirement_status default 'draft'::public.requirement_status not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  branch_id uuid,
  department_name text,
  campaign_id uuid
);

create table public.reviews (
  id uuid default gen_random_uuid() not null,
  company_id uuid,
  order_id uuid,
  contact_id uuid,
  rating integer,
  feedback text,
  status text default 'pending'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.sample_movements (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  quantity integer not null,
  from_holder text not null,
  to_holder text not null,
  company_id uuid,
  requirement_id uuid,
  cost numeric(12,2) default 0 not null,
  note text,
  created_by uuid,
  created_at timestamp with time zone default now() not null
);

create table public.sample_stock (
  id uuid default gen_random_uuid() not null,
  product_id uuid not null,
  in_office integer default 0 not null,
  with_client integer default 0 not null,
  pending_supplier integer default 0 not null,
  unit_cost numeric(12,2) default 0 not null,
  with_team integer default 0 not null
);

create table public.slug_history (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  company_id uuid,
  released_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table public.subcategories (
  id uuid default gen_random_uuid() not null,
  category_id uuid not null,
  name text not null,
  created_at timestamp with time zone default now() not null
);

create table public.suppliers (
  id uuid default gen_random_uuid() not null,
  name text not null,
  contact_person text,
  email text,
  phone text,
  city text,
  category text,
  credit_period_days integer default 0 not null,
  notes text,
  is_active boolean default true not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  credit_limit numeric(14,2) default 0 not null
);

create table public.tasks (
  id uuid default gen_random_uuid() not null,
  title text not null,
  description text,
  order_id uuid,
  department_id uuid,
  assigned_to uuid,
  created_by uuid,
  due_at date,
  completed_at timestamp with time zone,
  status text default 'open'::text not null,
  created_at timestamp with time zone default now() not null,
  priority integer default 3 not null,
  company_id uuid,
  requirement_id uuid
);


-- ======================================================================
-- 5. Primary key, unique and check constraints (132)
-- ======================================================================

alter table only public.activities add constraint activities_pkey PRIMARY KEY (id);
alter table only public.announcements add constraint announcements_pkey PRIMARY KEY (id);
alter table only public.audit_logs add constraint audit_logs_pkey PRIMARY KEY (id);
alter table only public.branches add constraint branches_pkey PRIMARY KEY (id);
alter table only public.brands add constraint brands_pkey PRIMARY KEY (id);
alter table only public.brands add constraint brands_name_key UNIQUE (name);
alter table only public.campaign_events add constraint campaign_events_pkey PRIMARY KEY (id);
alter table only public.campaign_products add constraint campaign_products_pkey PRIMARY KEY (id);
alter table only public.campaign_products add constraint campaign_products_campaign_id_product_id_key UNIQUE (campaign_id, product_id);
alter table only public.campaign_products add constraint campaign_products_discount_percent_check CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric)));
alter table only public.campaign_products add constraint campaign_products_pack_kit_role_check CHECK (((pack_kit_role IS NULL) OR (pack_kit_role = ANY (ARRAY['primary'::text, 'line'::text]))));
alter table only public.campaign_products add constraint campaign_products_pack_option_check CHECK (((pack_option IS NULL) OR (pack_option = ANY (ARRAY['A'::text, 'B'::text, 'C'::text]))));
alter table only public.campaign_products add constraint campaign_products_selling_price_check CHECK ((selling_price >= (0)::numeric));
alter table only public.campaigns add constraint campaigns_pkey PRIMARY KEY (id);
alter table only public.campaigns add constraint campaigns_budget_per_employee_check CHECK ((budget_per_employee >= (0)::numeric));
alter table only public.campaigns add constraint campaigns_employee_quantity_check CHECK ((employee_quantity >= 1));
alter table only public.campaigns add constraint campaigns_total_budget_check CHECK ((total_budget >= (0)::numeric));
alter table only public.catalog_assignments add constraint catalog_assignments_pkey PRIMARY KEY (id);
alter table only public.catalog_assignments add constraint catalog_assignments_campaign_id_company_id_key UNIQUE (campaign_id, company_id);
alter table only public.catalog_share_links add constraint catalog_share_links_pkey PRIMARY KEY (id);
alter table only public.catalog_share_links add constraint catalog_share_links_token_key UNIQUE (token);
alter table only public.catalog_share_links add constraint catalog_share_links_token_len CHECK (((char_length(token) >= 16) AND (char_length(token) <= 128)));
alter table only public.categories add constraint categories_pkey PRIMARY KEY (id);
alter table only public.categories add constraint categories_name_key UNIQUE (name);
alter table only public.client_comments add constraint client_comments_pkey PRIMARY KEY (id);
alter table only public.client_product_selections add constraint client_product_selections_pkey PRIMARY KEY (id);
alter table only public.client_product_selections add constraint client_product_selections_campaign_product_id_user_id_key UNIQUE (campaign_product_id, user_id);
alter table only public.client_product_selections add constraint client_product_selections_quantity_check CHECK (((quantity IS NULL) OR (quantity >= 1)));
alter table only public.companies add constraint companies_pkey PRIMARY KEY (id);
alter table only public.companies add constraint companies_portal_slug_format_check CHECK (((portal_slug IS NULL) OR (((char_length(portal_slug) >= 3) AND (char_length(portal_slug) <= 40)) AND (portal_slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$'::text))));
alter table only public.companies add constraint companies_portal_status_check CHECK ((portal_status = ANY (ARRAY['trial'::text, 'active'::text, 'suspended'::text, 'cancelled'::text])));
alter table only public.companies add constraint companies_subdomain_status_check CHECK ((subdomain_status = ANY (ARRAY['none'::text, 'pending'::text, 'provisioning'::text, 'ssl_pending'::text, 'live'::text, 'failed'::text])));
alter table only public.company_product_access add constraint company_product_access_pkey PRIMARY KEY (company_id, product_id);
alter table only public.company_product_exclusions add constraint company_product_exclusions_pkey PRIMARY KEY (company_id, product_id);
alter table only public.contacts add constraint contacts_pkey PRIMARY KEY (id);
alter table only public.contacts add constraint contacts_kind_check CHECK ((kind = ANY (ARRAY['corporate'::text, 'direct'::text])));
alter table only public.courier_partners add constraint courier_partners_pkey PRIMARY KEY (id);
alter table only public.department_members add constraint department_members_pkey PRIMARY KEY (department_id, user_id);
alter table only public.departments add constraint departments_pkey PRIMARY KEY (id);
alter table only public.departments add constraint departments_slug_key UNIQUE (slug);
alter table only public.goals add constraint goals_pkey PRIMARY KEY (id);
alter table only public.goals add constraint goals_metric_check CHECK ((metric = ANY (ARRAY['revenue'::text, 'order_value'::text, 'requirement_value'::text, 'conversion_pct'::text])));
alter table only public.goals add constraint goals_period_type_check CHECK ((period_type = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text])));
alter table only public.goals add constraint goals_target_check CHECK ((target >= (0)::numeric));
alter table only public.invoices add constraint invoices_pkey PRIMARY KEY (id);
alter table only public.invoices add constraint invoices_invoice_number_key UNIQUE (invoice_number);
alter table only public.invoices add constraint invoices_order_id_key UNIQUE (order_id);
alter table only public.invoices add constraint invoices_amount_check CHECK ((amount > (0)::numeric));
alter table only public.lead_stage_history add constraint lead_stage_history_pkey PRIMARY KEY (id);
alter table only public.leads add constraint leads_pkey PRIMARY KEY (id);
alter table only public.leads add constraint leads_estimated_value_check CHECK ((estimated_value >= (0)::numeric));
alter table only public.mockups add constraint mockups_pkey PRIMARY KEY (id);
alter table only public.mockups add constraint mockups_storage_path_key UNIQUE (storage_path);
alter table only public.mockups add constraint mockups_file_size_bytes_check CHECK (((file_size_bytes > 0) AND (file_size_bytes <= 10485760)));
alter table only public.notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table only public.order_assignments add constraint order_assignments_pkey PRIMARY KEY (id);
alter table only public.order_items add constraint order_items_pkey PRIMARY KEY (id);
alter table only public.order_items add constraint order_items_quantity_check CHECK ((quantity >= 1));
alter table only public.order_items add constraint order_items_unit_price_check CHECK ((unit_price >= (0)::numeric));
alter table only public.order_status_history add constraint order_status_history_pkey PRIMARY KEY (id);
alter table only public.orders add constraint orders_pkey PRIMARY KEY (id);
alter table only public.orders add constraint orders_order_number_key UNIQUE (order_number);
alter table only public.orders add constraint orders_quotation_id_key UNIQUE (quotation_id);
alter table only public.org_settings add constraint org_settings_pkey PRIMARY KEY (id);
alter table only public.org_settings add constraint org_settings_id_check CHECK ((id = 1));
alter table only public.payables add constraint payables_pkey PRIMARY KEY (id);
alter table only public.payables add constraint payables_amount_check CHECK ((amount > (0)::numeric));
alter table only public.payables add constraint payables_amount_paid_check CHECK ((amount_paid >= (0)::numeric));
alter table only public.payables add constraint payables_status_check CHECK ((status = ANY (ARRAY['unpaid'::text, 'partial'::text, 'paid'::text])));
alter table only public.payables add constraint payables_vendor_type_check CHECK ((vendor_type = ANY (ARRAY['supplier'::text, 'printing'::text, 'courier'::text, 'sample'::text, 'other'::text])));
alter table only public.payments add constraint payments_pkey PRIMARY KEY (id);
alter table only public.payments add constraint payments_amount_check CHECK ((amount > (0)::numeric));
alter table only public.portal_host_runs add constraint portal_host_runs_pkey PRIMARY KEY (id);
alter table only public.portal_host_runs add constraint portal_host_runs_kind_check CHECK ((kind = ANY (ARRAY['worker'::text, 'reconcile'::text])));
alter table only public.portal_hosts add constraint portal_hosts_pkey PRIMARY KEY (id);
alter table only public.portal_hosts add constraint portal_hosts_desired_check CHECK ((desired = ANY (ARRAY['parked'::text, 'unparked'::text])));
alter table only public.portal_hosts add constraint portal_hosts_hostname_matches_slug CHECK ((hostname = (slug || '.giftingstore.online'::text)));
alter table only public.portal_hosts add constraint portal_hosts_role_check CHECK ((role = ANY (ARRAY['primary'::text, 'redirect'::text, 'manual'::text])));
alter table only public.portal_hosts add constraint portal_hosts_slug_format_check CHECK ((((char_length(slug) >= 3) AND (char_length(slug) <= 40)) AND (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$'::text)));
alter table only public.portal_hosts add constraint portal_hosts_status_check CHECK ((status = ANY (ARRAY['queued'::text, 'parking'::text, 'verifying'::text, 'live'::text, 'unparking'::text, 'removed'::text, 'failed'::text, 'blocked'::text])));
alter table only public.printing_vendors add constraint printing_vendors_pkey PRIMARY KEY (id);
alter table only public.product_supplier_offers add constraint product_supplier_offers_pkey PRIMARY KEY (id);
alter table only public.product_supplier_offers add constraint product_supplier_offers_product_id_supplier_id_key UNIQUE (product_id, supplier_id);
alter table only public.product_supplier_offers add constraint product_supplier_offers_cost_check CHECK ((cost >= (0)::numeric));
alter table only public.product_supplier_offers add constraint product_supplier_offers_lead_time_days_check CHECK (((lead_time_days IS NULL) OR (lead_time_days >= 0)));
alter table only public.product_supplier_offers add constraint product_supplier_offers_moq_check CHECK ((moq >= 1));
alter table only public.product_variants add constraint product_variants_pkey PRIMARY KEY (id);
alter table only public.product_variants add constraint product_variants_sku_key UNIQUE (sku);
alter table only public.products add constraint products_pkey PRIMARY KEY (id);
alter table only public.products add constraint products_catalogue_access_check CHECK ((catalogue_access = ANY (ARRAY['all'::text, 'selected'::text, 'none'::text])));
alter table only public.products add constraint products_moq_check CHECK ((moq >= 1));
alter table only public.products add constraint products_price_check CHECK ((price >= (0)::numeric));
alter table only public.products add constraint products_supplier_cost_check CHECK (((supplier_cost IS NULL) OR (supplier_cost >= (0)::numeric)));
alter table only public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table only public.profiles add constraint profiles_email_key UNIQUE (email);
alter table only public.quotation_history add constraint quotation_history_pkey PRIMARY KEY (id);
alter table only public.quotation_item_costs add constraint quotation_item_costs_pkey PRIMARY KEY (quotation_item_id);
alter table only public.quotation_item_costs add constraint quotation_item_costs_margin_percent_check CHECK (((margin_percent IS NULL) OR (margin_percent >= (0)::numeric)));
alter table only public.quotation_item_costs add constraint quotation_item_costs_supplier_cost_check CHECK (((supplier_cost IS NULL) OR (supplier_cost >= (0)::numeric)));
alter table only public.quotation_items add constraint quotation_items_pkey PRIMARY KEY (id);
alter table only public.quotation_items add constraint quotation_items_client_response_check CHECK (((client_response IS NULL) OR (client_response = ANY (ARRAY['accepted'::text, 'rejected'::text]))));
alter table only public.quotation_items add constraint quotation_items_quantity_check CHECK ((quantity >= 1));
alter table only public.quotation_items add constraint quotation_items_unit_price_check CHECK ((unit_price >= (0)::numeric));
alter table only public.quotations add constraint quotations_pkey PRIMARY KEY (id);
alter table only public.quotations add constraint quotations_quotation_number_key UNIQUE (quotation_number);
alter table only public.quotations add constraint quotations_discount_percent_check CHECK (((discount_percent >= (0)::numeric) AND (discount_percent <= (100)::numeric)));
alter table only public.quotations add constraint quotations_tax_percent_check CHECK ((tax_percent >= (0)::numeric));
alter table only public.requirement_products add constraint requirement_products_pkey PRIMARY KEY (id);
alter table only public.requirement_products add constraint requirement_products_requirement_id_product_id_key UNIQUE (requirement_id, product_id);
alter table only public.requirement_products add constraint requirement_products_quantity_check CHECK ((quantity >= 1));
alter table only public.requirements add constraint requirements_pkey PRIMARY KEY (id);
alter table only public.requirements add constraint requirements_budget_check CHECK (((budget IS NULL) OR (budget >= (0)::numeric)));
alter table only public.requirements add constraint requirements_quantity_check CHECK ((quantity >= 1));
alter table only public.reviews add constraint reviews_pkey PRIMARY KEY (id);
alter table only public.reviews add constraint reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)));
alter table only public.sample_movements add constraint sample_movements_pkey PRIMARY KEY (id);
alter table only public.sample_movements add constraint sample_movements_from_holder_check CHECK ((from_holder = ANY (ARRAY['supplier'::text, 'office'::text, 'client'::text])));
alter table only public.sample_movements add constraint sample_movements_quantity_check CHECK ((quantity > 0));
alter table only public.sample_movements add constraint sample_movements_to_holder_check CHECK ((to_holder = ANY (ARRAY['supplier'::text, 'office'::text, 'client'::text])));
alter table only public.sample_stock add constraint sample_stock_pkey PRIMARY KEY (id);
alter table only public.sample_stock add constraint sample_stock_product_id_key UNIQUE (product_id);
alter table only public.sample_stock add constraint sample_stock_in_office_check CHECK ((in_office >= 0));
alter table only public.sample_stock add constraint sample_stock_pending_supplier_check CHECK ((pending_supplier >= 0));
alter table only public.sample_stock add constraint sample_stock_with_client_check CHECK ((with_client >= 0));
alter table only public.slug_history add constraint slug_history_pkey PRIMARY KEY (id);
alter table only public.slug_history add constraint slug_history_slug_format_check CHECK ((((char_length(slug) >= 3) AND (char_length(slug) <= 40)) AND (slug ~ '^[a-z0-9]([a-z0-9-]{1,38}[a-z0-9])?$'::text)));
alter table only public.subcategories add constraint subcategories_pkey PRIMARY KEY (id);
alter table only public.subcategories add constraint subcategories_category_id_name_key UNIQUE (category_id, name);
alter table only public.suppliers add constraint suppliers_pkey PRIMARY KEY (id);
alter table only public.suppliers add constraint suppliers_credit_period_days_check CHECK ((credit_period_days >= 0));
alter table only public.tasks add constraint tasks_pkey PRIMARY KEY (id);
alter table only public.tasks add constraint tasks_status_check CHECK ((status = ANY (ARRAY['open'::text, 'in_progress'::text, 'done'::text, 'cancelled'::text])));


-- ======================================================================
-- 6. Foreign keys (126) — profiles.id references auth.users(id)
-- ======================================================================

alter table only public.activities add constraint activities_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);
alter table only public.activities add constraint activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
alter table only public.announcements add constraint announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
alter table only public.audit_logs add constraint audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
alter table only public.branches add constraint branches_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.campaign_events add constraint campaign_events_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id);
alter table only public.campaign_events add constraint campaign_events_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
alter table only public.campaign_products add constraint campaign_products_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
alter table only public.campaign_products add constraint campaign_products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
alter table only public.campaign_products add constraint campaign_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
alter table only public.campaign_products add constraint campaign_products_published_by_fkey FOREIGN KEY (published_by) REFERENCES public.profiles(id);
alter table only public.campaigns add constraint campaigns_cloned_from_fkey FOREIGN KEY (cloned_from) REFERENCES public.campaigns(id) ON DELETE SET NULL;
alter table only public.campaigns add constraint campaigns_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.campaigns add constraint campaigns_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
alter table only public.campaigns add constraint campaigns_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.requirements(id) ON DELETE SET NULL;
alter table only public.catalog_assignments add constraint catalog_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.catalog_assignments add constraint catalog_assignments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
alter table only public.catalog_assignments add constraint catalog_assignments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.catalog_share_links add constraint catalog_share_links_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
alter table only public.catalog_share_links add constraint catalog_share_links_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.client_comments add constraint client_comments_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
alter table only public.client_comments add constraint client_comments_campaign_product_id_fkey FOREIGN KEY (campaign_product_id) REFERENCES public.campaign_products(id) ON DELETE CASCADE;
alter table only public.client_comments add constraint client_comments_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.client_comments add constraint client_comments_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;
alter table only public.client_comments add constraint client_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
alter table only public.client_product_selections add constraint client_product_selections_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
alter table only public.client_product_selections add constraint client_product_selections_campaign_product_id_fkey FOREIGN KEY (campaign_product_id) REFERENCES public.campaign_products(id) ON DELETE CASCADE;
alter table only public.client_product_selections add constraint client_product_selections_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.client_product_selections add constraint client_product_selections_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
alter table only public.companies add constraint companies_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
alter table only public.company_product_access add constraint company_product_access_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.company_product_access add constraint company_product_access_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
alter table only public.company_product_exclusions add constraint company_product_exclusions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.company_product_exclusions add constraint company_product_exclusions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
alter table only public.contacts add constraint contacts_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
alter table only public.contacts add constraint contacts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.department_members add constraint department_members_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;
alter table only public.department_members add constraint department_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table only public.departments add constraint departments_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.goals add constraint goals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
alter table only public.goals add constraint goals_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.invoices add constraint invoices_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
alter table only public.invoices add constraint invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
alter table only public.lead_stage_history add constraint lead_stage_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);
alter table only public.lead_stage_history add constraint lead_stage_history_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
alter table only public.leads add constraint leads_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
alter table only public.leads add constraint leads_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
alter table only public.leads add constraint leads_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
alter table only public.mockups add constraint mockups_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
alter table only public.mockups add constraint mockups_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
alter table only public.mockups add constraint mockups_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.requirements(id) ON DELETE CASCADE;
alter table only public.mockups add constraint mockups_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);
alter table only public.notifications add constraint notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.notifications add constraint notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
alter table only public.order_assignments add constraint order_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.order_assignments add constraint order_assignments_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.order_assignments add constraint order_assignments_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
alter table only public.order_assignments add constraint order_assignments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
alter table only public.order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
alter table only public.order_items add constraint order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
alter table only public.order_status_history add constraint order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);
alter table only public.order_status_history add constraint order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
alter table only public.orders add constraint orders_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.orders add constraint orders_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id);
alter table only public.orders add constraint orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
alter table only public.orders add constraint orders_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
alter table only public.orders add constraint orders_courier_partner_id_fkey FOREIGN KEY (courier_partner_id) REFERENCES public.courier_partners(id);
alter table only public.orders add constraint orders_current_department_id_fkey FOREIGN KEY (current_department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
alter table only public.orders add constraint orders_operations_user_id_fkey FOREIGN KEY (operations_user_id) REFERENCES public.profiles(id);
alter table only public.orders add constraint orders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
alter table only public.orders add constraint orders_printing_vendor_id_fkey FOREIGN KEY (printing_vendor_id) REFERENCES public.printing_vendors(id);
alter table only public.orders add constraint orders_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id);
alter table only public.orders add constraint orders_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.requirements(id) ON DELETE SET NULL;
alter table only public.orders add constraint orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
alter table only public.payables add constraint payables_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
alter table only public.payables add constraint payables_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
alter table only public.payments add constraint payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
alter table only public.payments add constraint payments_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
alter table only public.portal_hosts add constraint portal_hosts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
alter table only public.portal_hosts add constraint portal_hosts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.product_supplier_offers add constraint product_supplier_offers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
alter table only public.product_supplier_offers add constraint product_supplier_offers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE RESTRICT;
alter table only public.product_variants add constraint product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
alter table only public.products add constraint products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id);
alter table only public.products add constraint products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);
alter table only public.products add constraint products_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id);
alter table only public.products add constraint products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);
alter table only public.profiles add constraint profiles_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
alter table only public.profiles add constraint profiles_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
alter table only public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table only public.quotation_history add constraint quotation_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);
alter table only public.quotation_history add constraint quotation_history_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;
alter table only public.quotation_item_costs add constraint quotation_item_costs_quotation_item_id_fkey FOREIGN KEY (quotation_item_id) REFERENCES public.quotation_items(id) ON DELETE CASCADE;
alter table only public.quotation_item_costs add constraint quotation_item_costs_supplier_offer_id_fkey FOREIGN KEY (supplier_offer_id) REFERENCES public.product_supplier_offers(id) ON DELETE SET NULL;
alter table only public.quotation_items add constraint quotation_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
alter table only public.quotation_items add constraint quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE CASCADE;
alter table only public.quotations add constraint quotations_campaign_fk FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;
alter table only public.quotations add constraint quotations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
alter table only public.quotations add constraint quotations_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
alter table only public.quotations add constraint quotations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
alter table only public.quotations add constraint quotations_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.requirements(id);
alter table only public.quotations add constraint quotations_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.profiles(id);
alter table only public.requirement_products add constraint requirement_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
alter table only public.requirement_products add constraint requirement_products_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.requirements(id) ON DELETE CASCADE;
alter table only public.requirements add constraint requirements_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
alter table only public.requirements add constraint requirements_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;
alter table only public.requirements add constraint requirements_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
alter table only public.requirements add constraint requirements_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
alter table only public.requirements add constraint requirements_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id);
alter table only public.requirements add constraint requirements_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id);
alter table only public.reviews add constraint reviews_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
alter table only public.reviews add constraint reviews_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id);
alter table only public.reviews add constraint reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);
alter table only public.sample_movements add constraint sample_movements_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);
alter table only public.sample_movements add constraint sample_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
alter table only public.sample_movements add constraint sample_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
alter table only public.sample_movements add constraint sample_movements_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.requirements(id);
alter table only public.sample_stock add constraint sample_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
alter table only public.slug_history add constraint slug_history_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
alter table only public.subcategories add constraint subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;
alter table only public.tasks add constraint tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.tasks add constraint tasks_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;
alter table only public.tasks add constraint tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
alter table only public.tasks add constraint tasks_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
alter table only public.tasks add constraint tasks_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
alter table only public.tasks add constraint tasks_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES public.requirements(id) ON DELETE SET NULL;


-- ======================================================================
-- 7. Indexes not backing a constraint (63)
-- ======================================================================

CREATE INDEX activities_due_idx ON public.activities USING btree (due_at);
CREATE INDEX audit_logs_created_idx ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity, entity_id);
CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);
CREATE INDEX branches_company_idx ON public.branches USING btree (company_id);
CREATE INDEX campaign_events_campaign_idx ON public.campaign_events USING btree (campaign_id, created_at DESC);
CREATE INDEX campaign_products_campaign_idx ON public.campaign_products USING btree (campaign_id);
CREATE INDEX campaign_products_campaign_pack_idx ON public.campaign_products USING btree (campaign_id, pack_option);
CREATE INDEX campaign_products_pack_kit_idx ON public.campaign_products USING btree (campaign_id, pack_kit_id);
CREATE INDEX campaigns_cloned_from_idx ON public.campaigns USING btree (cloned_from);
CREATE INDEX campaigns_company_idx ON public.campaigns USING btree (company_id);
CREATE INDEX campaigns_status_idx ON public.campaigns USING btree (status);
CREATE INDEX catalog_assignments_company_idx ON public.catalog_assignments USING btree (company_id);
CREATE INDEX catalog_share_links_campaign_idx ON public.catalog_share_links USING btree (campaign_id, created_at DESC);
CREATE INDEX client_comments_campaign_idx ON public.client_comments USING btree (campaign_id);
CREATE INDEX selections_campaign_idx ON public.client_product_selections USING btree (campaign_id);
CREATE INDEX companies_name_idx ON public.companies USING btree (name);
CREATE INDEX companies_owner_idx ON public.companies USING btree (owner_id);
CREATE UNIQUE INDEX companies_portal_slug_key ON public.companies USING btree (portal_slug);
CREATE INDEX company_product_access_product_idx ON public.company_product_access USING btree (product_id);
CREATE INDEX idx_cpa_company ON public.company_product_access USING btree (company_id);
CREATE INDEX idx_cpa_product ON public.company_product_access USING btree (product_id);
CREATE INDEX company_product_exclusions_product_id_idx ON public.company_product_exclusions USING btree (product_id);
CREATE INDEX contacts_company_idx ON public.contacts USING btree (company_id);
CREATE INDEX leads_owner_idx ON public.leads USING btree (owner_id);
CREATE INDEX leads_stage_idx ON public.leads USING btree (stage);
CREATE INDEX mockups_requirement_idx ON public.mockups USING btree (requirement_id);
CREATE INDEX notifications_audience_idx ON public.notifications USING btree (audience, created_at DESC);
CREATE INDEX notifications_company_idx ON public.notifications USING btree (company_id);
CREATE INDEX notifications_created_idx ON public.notifications USING btree (created_at DESC);
CREATE INDEX idx_order_assignments_order ON public.order_assignments USING btree (order_id, created_at DESC);
CREATE INDEX order_assignments_assigned_to_idx ON public.order_assignments USING btree (assigned_to);
CREATE INDEX idx_orders_assigned_to ON public.orders USING btree (assigned_to);
CREATE INDEX idx_orders_dept ON public.orders USING btree (current_department_id);
CREATE INDEX orders_assigned_to_idx ON public.orders USING btree (assigned_to);
CREATE INDEX orders_campaign_idx ON public.orders USING btree (campaign_id);
CREATE INDEX orders_company_idx ON public.orders USING btree (company_id);
CREATE INDEX orders_delivery_idx ON public.orders USING btree (expected_delivery_date);
CREATE INDEX orders_department_idx ON public.orders USING btree (current_department_id);
CREATE INDEX orders_owner_idx ON public.orders USING btree (owner_id);
CREATE INDEX orders_status_idx ON public.orders USING btree (status);
CREATE INDEX portal_host_runs_started_idx ON public.portal_host_runs USING btree (started_at DESC);
CREATE INDEX portal_hosts_claim_idx ON public.portal_hosts USING btree (next_attempt_at, status) WHERE (status <> 'removed'::text);
CREATE INDEX portal_hosts_company_idx ON public.portal_hosts USING btree (company_id);
CREATE UNIQUE INDEX portal_hosts_hostname_active_key ON public.portal_hosts USING btree (hostname) WHERE (status <> 'removed'::text);
CREATE UNIQUE INDEX portal_hosts_one_primary_parked_per_company ON public.portal_hosts USING btree (company_id) WHERE ((role = 'primary'::text) AND (desired = 'parked'::text) AND (status <> 'removed'::text));
CREATE INDEX portal_hosts_slug_idx ON public.portal_hosts USING btree (slug);
CREATE UNIQUE INDEX product_supplier_offers_one_preferred ON public.product_supplier_offers USING btree (product_id) WHERE is_preferred;
CREATE INDEX product_supplier_offers_product_idx ON public.product_supplier_offers USING btree (product_id);
CREATE INDEX products_catalogue_browse_idx ON public.products USING btree (status, catalogue_access);
CREATE INDEX products_category_idx ON public.products USING btree (category_id);
CREATE INDEX products_name_lower_idx ON public.products USING btree (lower(name));
CREATE UNIQUE INDEX products_sku_unique ON public.products USING btree (sku);
CREATE INDEX products_status_idx ON public.products USING btree (status);
CREATE INDEX profiles_company_idx ON public.profiles USING btree (company_id);
CREATE INDEX quotations_owner_idx ON public.quotations USING btree (owner_id);
CREATE INDEX quotations_status_idx ON public.quotations USING btree (status);
CREATE INDEX requirements_campaign_idx ON public.requirements USING btree (campaign_id);
CREATE INDEX requirements_owner_idx ON public.requirements USING btree (owner_id);
CREATE INDEX requirements_status_idx ON public.requirements USING btree (status);
CREATE UNIQUE INDEX slug_history_slug_key ON public.slug_history USING btree (slug);
CREATE INDEX idx_tasks_assigned ON public.tasks USING btree (assigned_to, status);
CREATE INDEX tasks_assigned_due_idx ON public.tasks USING btree (assigned_to, due_at);


-- ======================================================================
-- 8. Functions / RPCs (57)
-- ======================================================================

CREATE OR REPLACE FUNCTION public.advance_order_stage(p_order_id uuid, p_status public.order_status DEFAULT NULL::public.order_status, p_assigned_to uuid DEFAULT NULL::uuid, p_department_id uuid DEFAULT NULL::uuid, p_comment text DEFAULT NULL::text, p_stage_due date DEFAULT NULL::date, p_next_action text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
  v_old public.order_status;
  v_company uuid;
  v_ord text;
  v_client_label text;
  v_new public.order_status;
  v_dept uuid;
BEGIN
  v_role := public.current_role();
  IF v_role IS NULL OR v_role IN ('client_admin','client_user','sales','management') THEN
    RAISE EXCEPTION 'Not permitted to change order stages';
  END IF;
  IF v_role = 'accounts' AND coalesce(p_status, 'delivered') NOT IN ('delivered') THEN
    RAISE EXCEPTION 'Accounts cannot change this operational stage';
  END IF;
  IF v_role NOT IN ('admin','operations','accounts') THEN
    RAISE EXCEPTION 'Not permitted to change order stages';
  END IF;

  SELECT status, company_id, order_number, current_department_id
    INTO v_old, v_company, v_ord, v_dept
  FROM public.orders WHERE id = p_order_id;
  IF v_old IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  v_new := coalesce(p_status, v_old);
  v_dept := coalesce(p_department_id, v_dept);

  UPDATE public.orders SET
    status = v_new,
    assigned_to = COALESCE(p_assigned_to, assigned_to),
    current_department_id = COALESCE(p_department_id, current_department_id),
    operations_user_id = COALESCE(p_assigned_to, operations_user_id),
    stage_due_at = COALESCE(p_stage_due, stage_due_at),
    next_action = COALESCE(p_next_action, next_action),
    actual_delivery_date = CASE WHEN v_new = 'delivered' THEN COALESCE(actual_delivery_date, CURRENT_DATE) ELSE actual_delivery_date END,
    updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note, changed_at)
  VALUES (p_order_id, v_old, v_new, auth.uid(), p_comment, now());

  IF p_department_id IS NOT NULL OR p_assigned_to IS NOT NULL THEN
    INSERT INTO public.order_assignments (order_id, department_id, assigned_to, assigned_by, note)
    VALUES (p_order_id, p_department_id, p_assigned_to, auth.uid(), COALESCE(p_comment, 'Stage changed to ' || v_new::text));
  END IF;

  IF v_new IS DISTINCT FROM v_old THEN
    IF v_new = 'procurement' THEN
      INSERT INTO public.tasks (title, order_id, department_id, assigned_to, created_by, due_at, description, status, priority)
      VALUES ('Confirm supplier availability', p_order_id, v_dept, p_assigned_to, auth.uid(), COALESCE(p_stage_due, CURRENT_DATE + 2), p_comment, 'open', 2);
    ELSIF v_new = 'printing' THEN
      INSERT INTO public.tasks (title, order_id, department_id, assigned_to, created_by, due_at, description, status, priority)
      VALUES ('Complete logo printing / customization', p_order_id, v_dept, p_assigned_to, auth.uid(), COALESCE(p_stage_due, CURRENT_DATE + 3), p_comment, 'open', 2);
    ELSIF v_new = 'quality_check' THEN
      INSERT INTO public.tasks (title, order_id, department_id, assigned_to, created_by, due_at, description, status, priority)
      VALUES ('Quality check finished goods', p_order_id, v_dept, p_assigned_to, auth.uid(), COALESCE(p_stage_due, CURRENT_DATE + 1), p_comment, 'open', 1);
    ELSIF v_new IN ('ready_to_dispatch','dispatched') THEN
      INSERT INTO public.tasks (title, order_id, department_id, assigned_to, created_by, due_at, description, status, priority)
      VALUES ('Book courier and upload tracking', p_order_id, v_dept, p_assigned_to, auth.uid(), COALESCE(p_stage_due, CURRENT_DATE + 1), p_comment, 'open', 2);
    ELSIF v_new = 'delivered' THEN
      INSERT INTO public.tasks (title, order_id, department_id, assigned_to, created_by, due_at, description, status, priority)
      VALUES ('Generate invoice', p_order_id, (SELECT id FROM departments WHERE slug='accounts' LIMIT 1), (SELECT manager_id FROM departments WHERE slug='accounts' LIMIT 1), auth.uid(), CURRENT_DATE + 1, p_comment, 'open', 1);
    END IF;
  END IF;

  PERFORM public.notify_users('internal', v_company, 'Order ' || v_ord || ' moved to ' || replace(v_new::text, '_', ' '), coalesce(p_comment,''), '/crm/orders/' || p_order_id::text);

  v_client_label := CASE v_new
      WHEN 'created' THEN 'received'
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'procurement' THEN 'in procurement'
      WHEN 'printing' THEN 'printing in progress'
      WHEN 'quality_check' THEN 'in quality check'
      WHEN 'ready_to_dispatch' THEN 'ready to dispatch'
      WHEN 'dispatched' THEN 'dispatched'
      WHEN 'delivered' THEN 'delivered'
      WHEN 'in_progress' THEN 'in production'
      ELSE replace(v_new::text, '_', ' ')
    END;
  PERFORM public.notify_users('client', v_company, 'Your order ' || v_ord || ' is now ' || v_client_label, '', '/portal/orders/' || p_order_id::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.assign_order(p_order_id uuid, p_assigned_to uuid, p_department_id uuid, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_role public.app_role; v_company uuid; v_ord text;
BEGIN
  v_role := public.current_role();
  IF v_role NOT IN ('admin','operations','management') THEN
    RAISE EXCEPTION 'Not allowed to assign orders';
  END IF;
  SELECT company_id, order_number INTO v_company, v_ord FROM public.orders WHERE id = p_order_id;
  UPDATE public.orders SET assigned_to = p_assigned_to, current_department_id = p_department_id, operations_user_id = COALESCE(p_assigned_to, operations_user_id), updated_at = now() WHERE id = p_order_id;
  INSERT INTO public.order_assignments (order_id, department_id, assigned_to, assigned_by, note)
  VALUES (p_order_id, p_department_id, p_assigned_to, auth.uid(), p_note);
  PERFORM public.notify_users('internal', v_company, 'Order ' || coalesce(v_ord,'') || ' was reassigned', coalesce(p_note,''), '/orders/' || p_order_id::text);
END;
$function$;

CREATE OR REPLACE FUNCTION public.best_supplier_cost(p_product_id uuid, p_quantity integer DEFAULT NULL::integer)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with flags as (
    select coalesce(best_cost_require_in_stock, true) as require_stock
    from public.org_settings
    limit 1
  ),
  eligible as (
    select o.cost, o.is_preferred, o.lead_time_days, o.created_at
    from public.product_supplier_offers o
    cross join flags f
    where o.product_id = p_product_id
      and o.is_active
      and (not f.require_stock or o.in_stock)
      and (p_quantity is null or o.moq <= p_quantity)
  ),
  preferred as (
    select cost
    from eligible
    where is_preferred
    order by cost asc, lead_time_days asc nulls last, created_at asc
    limit 1
  )
  select coalesce(
    (select cost from preferred),
    (
      select cost
      from eligible
      order by cost asc, lead_time_days asc nulls last, created_at asc
      limit 1
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_client_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select role = 'client_admin' from public.profiles where id = auth.uid() and is_active),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.can_crm()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_any_role(array['admin','sales']::public.app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.can_finance()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_any_role(array['admin','accounts']::public.app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.can_manage_team()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.is_admin();
$function$;

CREATE OR REPLACE FUNCTION public.can_management_read()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_any_role(array['admin','management']::public.app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.can_ops()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_any_role(array['admin','operations']::public.app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.can_orders_read()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_any_role(array['admin','sales','operations','accounts','management']::public.app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.can_orders_write()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_any_role(array['admin','operations']::public.app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.can_sales()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select public.has_any_role(array['admin','sales']::public.app_role[]);
$function$;

CREATE OR REPLACE FUNCTION public.claim_portal_host_jobs(p_limit integer DEFAULT 10, p_lock_seconds integer DEFAULT 120, p_company_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF public.portal_hosts
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  return query
  with due as (
    select ph.id
    from public.portal_hosts ph
    where ph.status <> 'removed'
      and (p_company_id is null or ph.company_id = p_company_id)
      and (ph.locked_until is null or ph.locked_until < now())
      and not (
        ph.status = 'failed'
        and ph.last_error_code in ('unpark_timeout', 'invalid_hostname')
      )
      and (
        (
          (
            ph.status in ('queued', 'parking', 'verifying', 'unparking', 'blocked')
            or (ph.status = 'failed' and ph.desired = 'unparked')
          )
          and ph.next_attempt_at <= now()
          and (
            ph.desired = 'parked'
            or (ph.desired = 'unparked' and coalesce(ph.unpark_after, now()) <= now())
          )
        )
        or (
          ph.role = 'redirect'
          and ph.desired = 'parked'
          and ph.redirect_until is not null
          and ph.redirect_until <= now()
          and ph.next_attempt_at <= now()
        )
        or (
          ph.desired = 'unparked'
          and ph.status not in ('unparking', 'removed')
          and coalesce(ph.unpark_after, now()) <= now()
          and ph.next_attempt_at <= now()
        )
      )
    order by ph.next_attempt_at asc nulls first
    limit greatest(1, least(coalesce(p_limit, 10), 50))
    for update of ph skip locked
  ),
  locked as (
    update public.portal_hosts ph
    set locked_until = now() + make_interval(secs => greatest(30, least(coalesce(p_lock_seconds, 120), 600))),
        desired = case
          when ph.role = 'redirect'
               and ph.desired = 'parked'
               and ph.redirect_until is not null
               and ph.redirect_until <= now()
            then 'unparked'
          else ph.desired
        end,
        unpark_after = case
          when ph.role = 'redirect'
               and ph.desired = 'parked'
               and ph.redirect_until is not null
               and ph.redirect_until <= now()
            then coalesce(ph.unpark_after, now())
          else ph.unpark_after
        end,
        unpark_requests = case
          when ph.role = 'redirect'
               and ph.desired = 'parked'
               and ph.redirect_until is not null
               and ph.redirect_until <= now()
            then 0
          else ph.unpark_requests
        end,
        unpark_requested_at = case
          when ph.role = 'redirect'
               and ph.desired = 'parked'
               and ph.redirect_until is not null
               and ph.redirect_until <= now()
            then null
          else ph.unpark_requested_at
        end,
        status = case
          when (
                 ph.desired = 'unparked'
                 or (
                   ph.role = 'redirect'
                   and ph.desired = 'parked'
                   and ph.redirect_until is not null
                   and ph.redirect_until <= now()
                 )
               )
               and not (
                 ph.status = 'failed'
                 and ph.last_error_code in ('unpark_timeout', 'invalid_hostname')
               )
            then case
              when ph.status = 'removed' then ph.status
              else 'unparking'
            end
          else ph.status
        end
    where ph.id in (select id from due)
    returning ph.*
  )
  select * from locked;
end;
$function$;

CREATE OR REPLACE FUNCTION public.client_company_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select company_id from public.profiles
  where id = auth.uid() and role in ('client_admin','client_user') and is_active;
$function$;

CREATE OR REPLACE FUNCTION public.client_mark_quotation_viewed(p_quotation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare q public.quotations%rowtype;
begin
  if not public.is_client() then return; end if;
  select * into q from public.quotations where id = p_quotation_id;
  if not found then return; end if;
  if q.company_id is distinct from public.client_company_id() then return; end if;
  if q.status = 'sent' then
    update public.quotations set status = 'viewed' where id = p_quotation_id;
    insert into public.quotation_history (quotation_id, from_status, to_status, changed_by)
    values (p_quotation_id, 'sent', 'viewed', auth.uid());
    perform public.notify_users('internal', q.company_id, 'Client viewed quotation', '', '/quotations/' || p_quotation_id);
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.client_respond_quotation(p_quotation_id uuid, p_accept boolean, p_comment text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  q public.quotations%rowtype;
  v_status public.quotation_status;
begin
  if not public.is_client() then raise exception 'Not permitted'; end if;
  select * into q from public.quotations where id = p_quotation_id;
  if not found then raise exception 'Quotation not found'; end if;
  if q.company_id is distinct from public.client_company_id() then raise exception 'Quotation not found'; end if;
  if q.status not in ('sent','viewed') then raise exception 'This quotation can no longer be answered'; end if;
  v_status := case when p_accept then 'accepted'::public.quotation_status else 'rejected'::public.quotation_status end;
  update public.quotations
    set status = v_status,
        client_comment = p_comment,
        responded_at = now(),
        responded_by = auth.uid()
    where id = p_quotation_id;
  insert into public.quotation_history (quotation_id, from_status, to_status, changed_by, note)
  values (p_quotation_id, q.status, v_status, auth.uid(), p_comment);
  if q.campaign_id is not null then
    update public.campaigns set status = case when p_accept then 'approved'::public.campaign_status else 'rejected'::public.campaign_status end
    where id = q.campaign_id;
    perform public.record_campaign_event(q.campaign_id, case when p_accept then 'quotation_accepted' else 'quotation_rejected' end, jsonb_build_object('quotation_id', p_quotation_id));
  end if;
  perform public.notify_users('internal', q.company_id, case when p_accept then 'Quotation accepted' else 'Quotation rejected' end, coalesce(p_comment, ''), '/quotations/' || p_quotation_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.client_respond_quotation(p_quotation_id uuid, p_status text, p_comment text DEFAULT NULL::text, p_accepted_item_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  q public.quotations%rowtype;
  v_ids uuid[];
  v_order_id uuid;
  v_ops uuid;
  v_campaign_id uuid;
  v_req_campaign uuid;
  v_delivery date;
  v_req_deadline date;
  v_cost numeric := 0;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_line_count integer := 0;
  v_active_count integer := 0;
begin
  if not public.is_client() then
    raise exception 'Only portal clients can use this action';
  end if;

  if p_status not in ('accepted', 'rejected') then
    raise exception 'Invalid response status';
  end if;

  select * into q
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation not found';
  end if;

  if q.company_id is distinct from public.client_company_id() then
    raise exception 'Not permitted to respond to this quotation';
  end if;

  if p_status = 'rejected' then
    update public.quotation_items
    set client_response = 'rejected'
    where quotation_id = q.id;

    perform public.respond_quotation(p_quotation_id, 'rejected', p_comment);
    return null;
  end if;

  if p_accepted_item_ids is null then
    select coalesce(array_agg(id), '{}'::uuid[])
      into v_ids
    from public.quotation_items
    where quotation_id = q.id;
  else
    select coalesce(array_agg(distinct x), '{}'::uuid[])
      into v_ids
    from unnest(p_accepted_item_ids) as x
    where x is not null;
  end if;

  if coalesce(cardinality(v_ids), 0) < 1 then
    raise exception 'Select at least one line to accept';
  end if;

  if exists (
    select 1
    from unnest(v_ids) as x
    where not exists (
      select 1
      from public.quotation_items qi
      where qi.id = x
        and qi.quotation_id = q.id
    )
  ) then
    raise exception 'One or more items do not belong to this quotation';
  end if;

  select count(*) into v_line_count
  from public.quotation_items qi
  where qi.quotation_id = q.id
    and qi.id = any(v_ids);

  select count(*) into v_active_count
  from public.quotation_items qi
  join public.products p on p.id = qi.product_id and p.status = 'active'
  where qi.quotation_id = q.id
    and qi.id = any(v_ids);

  if v_line_count <> v_active_count then
    raise exception 'An accepted line is no longer available to order';
  end if;

  if exists (select 1 from public.orders where quotation_id = q.id) then
    raise exception 'An order already exists for this quotation';
  end if;

  update public.quotation_items
  set client_response = case when id = any(v_ids) then 'accepted' else 'rejected' end
  where quotation_id = q.id;

  perform public.respond_quotation(p_quotation_id, 'accepted', p_comment);

  select coalesce(sum(round(qi.quantity * qi.unit_price, 2)), 0)
    into v_subtotal
  from public.quotation_items qi
  where qi.quotation_id = q.id
    and qi.id = any(v_ids);

  v_discount := round(v_subtotal * coalesce(q.discount_percent, 0) / 100.0, 2);
  v_tax := round((v_subtotal - v_discount) * coalesce(q.tax_percent, 0) / 100.0, 2);
  v_total := v_subtotal - v_discount + v_tax;

  select coalesce(sum(coalesce(p.supplier_cost, p.price * 0.62) * qi.quantity), 0)
    into v_cost
  from public.quotation_items qi
  join public.products p on p.id = qi.product_id
  where qi.quotation_id = q.id
    and qi.id = any(v_ids)
    and p.status = 'active';

  v_delivery := current_date + 21;
  v_campaign_id := q.campaign_id;
  if q.requirement_id is not null then
    select r.deadline, r.campaign_id
      into v_req_deadline, v_req_campaign
    from public.requirements r
    where r.id = q.requirement_id;
    if found then
      if v_req_deadline is not null then
        v_delivery := v_req_deadline;
      end if;
      if v_campaign_id is null then
        v_campaign_id := v_req_campaign;
      end if;
    end if;
  end if;

  select id into v_ops from public.departments where slug = 'operations';

  insert into public.orders (
    order_number, company_id, contact_id, quotation_id, requirement_id, owner_id,
    order_value, expected_delivery_date, status, current_department_id, next_action,
    product_cost, total_cost, gross_profit, campaign_id
  ) values (
    public.next_order_number(), q.company_id, q.contact_id, q.id, q.requirement_id, q.owner_id,
    v_total, v_delivery, 'created', v_ops, 'Confirm PO and assign operations',
    v_cost, v_cost, v_total - v_cost, v_campaign_id
  ) returning id into v_order_id;

  insert into public.order_items (order_id, product_id, description, quantity, unit_price, line_total)
  select v_order_id, qi.product_id, coalesce(qi.description, p.name), qi.quantity, qi.unit_price,
         round(qi.quantity * qi.unit_price, 2)
  from public.quotation_items qi
  join public.products p on p.id = qi.product_id
  where qi.quotation_id = q.id
    and qi.id = any(v_ids)
    and p.status = 'active';

  insert into public.order_assignments (order_id, department_id, assigned_by, note)
  values (v_order_id, v_ops, auth.uid(), 'Order received from accepted quotation lines');

  insert into public.tasks (title, order_id, department_id, created_by, due_at, description)
  values (
    'Confirm order and assign operations',
    v_order_id,
    v_ops,
    auth.uid(),
    current_date + 1,
    'New order from accepted quotation lines'
  );

  if q.requirement_id is not null then
    update public.requirements set status = 'won' where id = q.requirement_id;
  end if;

  if v_campaign_id is not null then
    update public.campaigns set status = 'order_ready' where id = v_campaign_id;
    perform public.record_campaign_event(
      v_campaign_id,
      'order_created',
      jsonb_build_object('order_id', v_order_id)
    );
  end if;

  perform public.notify_users(
    'internal',
    q.company_id,
    'New order from accepted quotation',
    'Only the lines the client accepted are on this order.',
    '/crm/orders/' || v_order_id::text
  );
  perform public.notify_users(
    'client',
    q.company_id,
    'Your order is confirmed',
    'We have started fulfilment for the lines you accepted.',
    '/portal/orders'
  );

  return v_order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.client_set_campaign_status(p_campaign_id uuid, p_status public.campaign_status)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c public.campaigns%rowtype;
begin
  if not public.is_client() then raise exception 'Not permitted'; end if;
  select * into c from public.campaigns where id = p_campaign_id;
  if not found or c.company_id is distinct from public.client_company_id() then
    raise exception 'Campaign not found';
  end if;
  if c.published_to_client_at is null then raise exception 'Campaign not found'; end if;
  if p_status not in ('client_viewed','client_shortlisted','client_selected') then
    raise exception 'Invalid status';
  end if;
  update public.campaigns set status = p_status where id = p_campaign_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.companies_record_slug_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'UPDATE'
     and old.portal_slug is not null
     and old.portal_slug is distinct from new.portal_slug then
    insert into public.slug_history (slug, company_id, released_at, created_at)
    values (old.portal_slug, old.id, now(), now())
    on conflict (slug) do update
      set company_id = excluded.company_id,
          released_at = excluded.released_at,
          created_at = excluded.created_at;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.companies_sync_portal_hosts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_old_slug text;
  v_new_slug text;
  v_old_host text;
  v_new_host text;
  v_existing_id uuid;
  v_existing_status text;
  v_want_unparked boolean;
  v_has_primary_parked boolean;
begin
  v_old_slug := case when tg_op = 'UPDATE' then old.portal_slug else null end;
  v_new_slug := new.portal_slug;
  v_want_unparked := (new.portal_status = 'cancelled');

  if v_new_slug is not null
     and (tg_op = 'INSERT' or v_new_slug is distinct from v_old_slug) then
    perform public.portal_hosts_assert_slug_available(v_new_slug, new.id);
  end if;

  -- New / changed slug → primary row
  if v_new_slug is not null
     and (tg_op = 'INSERT' or v_new_slug is distinct from v_old_slug) then
    v_new_host := public.portal_host_hostname(v_new_slug);

    -- Demote previous primary to redirect (stay parked 30 days)
    if v_old_slug is not null and v_old_slug is distinct from v_new_slug then
      v_old_host := public.portal_host_hostname(v_old_slug);
      update public.portal_hosts
      set role = 'redirect',
          desired = 'parked',
          redirect_until = now() + interval '30 days',
          unpark_after = null,
          next_attempt_at = now() + interval '30 days',
          last_error = null,
          last_error_code = null
      where company_id = new.id
        and hostname = v_old_host
        and status <> 'removed'
        and role = 'primary';
    end if;

    select id, status into v_existing_id, v_existing_status
    from public.portal_hosts
    where hostname = v_new_host
      and status <> 'removed'
    limit 1;

    if v_existing_id is not null then
      if v_want_unparked then
        update public.portal_hosts
        set company_id = new.id,
            slug = v_new_slug,
            role = 'primary',
            desired = 'unparked',
            unpark_after = now() + interval '30 days',
            next_attempt_at = now() + interval '30 days',
            redirect_until = null,
            locked_until = null,
            unpark_requests = 0,
            unpark_requested_at = null,
            status = case when status = 'live' then status else status end,
            last_error = case when status = 'live' then last_error else last_error end
        where id = v_existing_id;
      elsif v_existing_status = 'live' then
        update public.portal_hosts
        set company_id = new.id,
            slug = v_new_slug,
            role = 'primary',
            desired = 'parked',
            redirect_until = null,
            unpark_after = null,
            locked_until = null
        where id = v_existing_id;
      else
        update public.portal_hosts
        set company_id = new.id,
            slug = v_new_slug,
            role = 'primary',
            desired = 'parked',
            status = 'queued',
            attempts = 0,
            park_requests = 0,
            action_requested_at = null,
            unpark_requests = 0,
            unpark_requested_at = null,
            verify_deadline = null,
            next_attempt_at = now(),
            redirect_until = null,
            unpark_after = null,
            locked_until = null,
            last_error = null,
            last_error_code = null,
            notify_on_live = true
        where id = v_existing_id;
      end if;
    else
      if v_want_unparked then
        insert into public.portal_hosts (
          company_id, slug, hostname, role, desired, status,
          attempts, next_attempt_at, unpark_after, unpark_requests, notify_on_live
        ) values (
          new.id, v_new_slug, v_new_host, 'primary', 'unparked', 'queued',
          0, now() + interval '30 days', now() + interval '30 days', 0, true
        );
      else
        insert into public.portal_hosts (
          company_id, slug, hostname, role, desired, status,
          attempts, next_attempt_at, notify_on_live
        ) values (
          new.id, v_new_slug, v_new_host, 'primary', 'parked', 'queued',
          0, now(), true
        );
      end if;
    end if;

    update public.companies
    set subdomain_status = case
          when subdomain_status = 'live' and v_old_slug is not distinct from v_new_slug then subdomain_status
          else 'pending'
        end,
        subdomain_updated_at = now(),
        subdomain_last_error = null
    where id = new.id
      and (subdomain_status is distinct from 'live' or v_old_slug is distinct from v_new_slug);
  end if;

  -- Slug cleared → schedule unpark of old primary after 7 days
  if v_new_slug is null
     and v_old_slug is not null then
    v_old_host := public.portal_host_hostname(v_old_slug);
    update public.portal_hosts
    set desired = 'unparked',
        unpark_after = now() + interval '7 days',
        next_attempt_at = now() + interval '7 days',
        redirect_until = null,
        unpark_requests = 0,
        unpark_requested_at = null
    where company_id = new.id
      and hostname = v_old_host
      and status <> 'removed';

    update public.companies
    set subdomain_status = 'none',
        subdomain_updated_at = now(),
        subdomain_last_error = null
    where id = new.id;
  end if;

  -- Cancelled → unpark primary + redirect after 30 days
  if tg_op = 'UPDATE'
     and new.portal_status is distinct from old.portal_status
     and new.portal_status = 'cancelled' then
    update public.portal_hosts
    set desired = 'unparked',
        unpark_after = least(coalesce(unpark_after, now() + interval '30 days'), now() + interval '30 days'),
        next_attempt_at = least(coalesce(next_attempt_at, now() + interval '30 days'), now() + interval '30 days'),
        unpark_requests = 0,
        unpark_requested_at = null
    where company_id = new.id
      and status <> 'removed'
      and desired = 'parked';
  end if;

  -- Leaving cancelled → restore park for current primary + active redirects
  if tg_op = 'UPDATE'
     and old.portal_status = 'cancelled'
     and new.portal_status is distinct from 'cancelled'
     and new.portal_slug is not null then
    v_new_host := public.portal_host_hostname(new.portal_slug);

    select exists (
      select 1 from public.portal_hosts ph
      where ph.company_id = new.id
        and ph.role = 'primary'
        and ph.desired = 'parked'
        and ph.status <> 'removed'
    ) into v_has_primary_parked;

    -- Non-removed primary for current hostname
    update public.portal_hosts
    set desired = 'parked',
        unpark_after = null,
        next_attempt_at = now(),
        attempts = case when status in ('unparking', 'failed') then 0 else attempts end,
        park_requests = case when status in ('unparking', 'failed') then 0 else park_requests end,
        action_requested_at = case when status in ('unparking', 'failed') then null else action_requested_at end,
        unpark_requests = case when status in ('unparking', 'failed') then 0 else unpark_requests end,
        unpark_requested_at = case when status in ('unparking', 'failed') then null else unpark_requested_at end,
        verify_deadline = case when status in ('unparking', 'failed') then null else verify_deadline end,
        status = case
          when status in ('unparking', 'failed') then 'queued'
          else status
        end,
        last_error = case
          when status in ('unparking', 'failed') then null
          else last_error
        end,
        last_error_code = case
          when status in ('unparking', 'failed') then null
          else last_error_code
        end
    where company_id = new.id
      and hostname = v_new_host
      and role = 'primary'
      and status <> 'removed';

    -- Latest removed primary for hostname only if no other non-removed row holds it,
    -- and only if this company does not already have a primary/parked row.
    if not v_has_primary_parked
       and not exists (
         select 1 from public.portal_hosts ph
         where ph.hostname = v_new_host and ph.status <> 'removed'
       ) then
      update public.portal_hosts ph
      set desired = 'parked',
          unpark_after = null,
          next_attempt_at = now(),
          attempts = 0,
          park_requests = 0,
          action_requested_at = null,
          unpark_requests = 0,
          unpark_requested_at = null,
          verify_deadline = null,
          status = 'queued',
          last_error = null,
          last_error_code = null,
          role = 'primary',
          company_id = new.id,
          slug = new.portal_slug
      where ph.id = (
        select ph2.id
        from public.portal_hosts ph2
        where ph2.company_id = new.id
          and ph2.hostname = v_new_host
          and ph2.role = 'primary'
          and ph2.status = 'removed'
        order by ph2.updated_at desc
        limit 1
      );
    end if;

    -- Non-removed redirects still in grace
    update public.portal_hosts
    set desired = 'parked',
        unpark_after = null,
        next_attempt_at = now(),
        attempts = case when status in ('unparking', 'failed') then 0 else attempts end,
        park_requests = case when status in ('unparking', 'failed') then 0 else park_requests end,
        action_requested_at = case when status in ('unparking', 'failed') then null else action_requested_at end,
        unpark_requests = case when status in ('unparking', 'failed') then 0 else unpark_requests end,
        unpark_requested_at = case when status in ('unparking', 'failed') then null else unpark_requested_at end,
        verify_deadline = case when status in ('unparking', 'failed') then null else verify_deadline end,
        status = case
          when status in ('unparking', 'failed') then 'queued'
          else status
        end,
        last_error = case
          when status in ('unparking', 'failed') then null
          else last_error
        end,
        last_error_code = case
          when status in ('unparking', 'failed') then null
          else last_error_code
        end
    where company_id = new.id
      and role = 'redirect'
      and redirect_until is not null
      and redirect_until > now()
      and status <> 'removed';

    -- Latest removed redirect per hostname (only if hostname free)
    update public.portal_hosts ph
    set desired = 'parked',
        unpark_after = null,
        next_attempt_at = now(),
        attempts = 0,
        park_requests = 0,
        action_requested_at = null,
        unpark_requests = 0,
        unpark_requested_at = null,
        verify_deadline = null,
        status = 'queued',
        last_error = null,
        last_error_code = null
    where ph.id in (
      select distinct on (ph2.hostname) ph2.id
      from public.portal_hosts ph2
      where ph2.company_id = new.id
        and ph2.role = 'redirect'
        and ph2.status = 'removed'
        and ph2.redirect_until is not null
        and ph2.redirect_until > now()
        and not exists (
          select 1 from public.portal_hosts other
          where other.hostname = ph2.hostname
            and other.status <> 'removed'
        )
      order by ph2.hostname, ph2.updated_at desc
    );
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.companies_unpark_portal_hosts_on_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.portal_hosts
  set desired = 'unparked',
      unpark_after = now(),
      next_attempt_at = now(),
      redirect_until = null,
      unpark_requests = 0,
      unpark_requested_at = null
  where company_id = old.id
    and status <> 'removed';
  return old;
end;
$function$;

CREATE OR REPLACE FUNCTION public.convert_quotation_to_order(p_quotation_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  q public.quotations%rowtype;
  v_order_id uuid;
  v_ops uuid;
  v_cost numeric := 0;
  v_item_count integer := 0;
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

  select count(*) into v_item_count
  from public.quotation_items qi
  join public.products p on p.id = qi.product_id
  where qi.quotation_id = q.id
    and p.status = 'active'
    and coalesce(p.catalogue_access, 'all') <> 'none';
  if v_item_count = 0 then
    raise exception 'Quotation has no active catalogue products to convert';
  end if;

  select id into v_ops from public.departments where slug = 'operations';
  select coalesce(sum(coalesce(p.supplier_cost, p.price * 0.62) * qi.quantity), 0) into v_cost
  from public.quotation_items qi
  join public.products p on p.id = qi.product_id
  where qi.quotation_id = q.id
    and p.status = 'active'
    and coalesce(p.catalogue_access, 'all') <> 'none';

  insert into public.orders (
    order_number, company_id, contact_id, quotation_id, requirement_id, owner_id,
    order_value, expected_delivery_date, status, current_department_id, next_action,
    product_cost, total_cost, gross_profit, campaign_id
  ) values (
    public.next_order_number(), q.company_id, q.contact_id, q.id, q.requirement_id, q.owner_id,
    q.total, current_date + 21, 'created', v_ops, 'Confirm PO and assign operations',
    v_cost, v_cost, q.total - v_cost, q.campaign_id
  ) returning id into v_order_id;

  insert into public.order_items (order_id, product_id, description, quantity, unit_price, line_total)
  select v_order_id, qi.product_id, coalesce(qi.description, p.name), qi.quantity, qi.unit_price, round(qi.quantity * qi.unit_price, 2)
  from public.quotation_items qi
  join public.products p on p.id = qi.product_id
  where qi.quotation_id = q.id
    and p.status = 'active'
    and coalesce(p.catalogue_access, 'all') <> 'none';

  insert into public.order_assignments (order_id, department_id, assigned_by, note)
  values (v_order_id, v_ops, auth.uid(), 'Order received from accepted quotation');
  insert into public.tasks (title, order_id, department_id, created_by, due_at, description)
  values ('Confirm order and assign operations', v_order_id, v_ops, auth.uid(), current_date + 1, 'New order from quotation');

  if q.requirement_id is not null then
    update public.requirements set status = 'won' where id = q.requirement_id;
  end if;
  if q.campaign_id is not null then
    update public.campaigns set status = 'order_ready' where id = q.campaign_id;
    perform public.record_campaign_event(q.campaign_id, 'order_created', jsonb_build_object('order_id', v_order_id));
  end if;
  perform public.notify_users('internal', q.company_id, 'New order from accepted quotation', '', '/orders/' || v_order_id::text);
  perform public.notify_users('client', q.company_id, 'Your order is confirmed', 'We have started fulfilment.', '/portal/orders');
  return v_order_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public."current_role"()
 RETURNS public.app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.profiles where id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.duplicate_quotation(p_quotation_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE q public.quotations%ROWTYPE; v_id uuid; v_num text;
BEGIN
  IF NOT public.has_any_role(array['admin','sales']::public.app_role[]) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  SELECT * INTO q FROM public.quotations WHERE id = p_quotation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quotation not found'; END IF;
  v_num := public.next_quotation_number();
  INSERT INTO public.quotations (
    quotation_number, requirement_id, campaign_id, company_id, contact_id, owner_id,
    discount_percent, tax_percent, valid_until, status, notes
  ) VALUES (
    v_num, q.requirement_id, q.campaign_id, q.company_id, q.contact_id, COALESCE(auth.uid(), q.owner_id),
    q.discount_percent, q.tax_percent, q.valid_until, 'draft', COALESCE(q.notes,'') || ' (revision)'
  ) RETURNING id INTO v_id;
  INSERT INTO public.quotation_items (quotation_id, product_id, description, quantity, unit_price)
  SELECT v_id, product_id, description, quantity, unit_price FROM public.quotation_items WHERE quotation_id = p_quotation_id;
  PERFORM public.recalc_quotation_totals(v_id);
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_shared_catalog(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_campaign_id uuid;
  v_name text;
  v_occasion text;
  v_budget numeric;
  v_expires timestamptz;
  v_products jsonb;
begin
  if p_token is null or char_length(p_token) < 16 or char_length(p_token) > 128 then
    return null;
  end if;

  select l.campaign_id, l.expires_at
    into v_campaign_id, v_expires
  from public.catalog_share_links l
  where l.token = p_token
    and l.revoked_at is null
    and (l.expires_at is null or l.expires_at > now());

  if v_campaign_id is null then
    return null;
  end if;

  select c.name, c.occasion, c.budget_per_employee
    into v_name, v_occasion, v_budget
  from public.campaigns c
  where c.id = v_campaign_id;

  if v_name is null then
    return null;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', cp.id,
        'product_id', cp.product_id,
        'sku', p.sku,
        'display_name', cp.display_name,
        'client_description', cp.client_description,
        'client_image_url', cp.client_image_url,
        'selling_price', cp.selling_price,
        'moq', cp.moq,
        'pack_option', cp.pack_option,
        'pack_kit_id', cp.pack_kit_id,
        'pack_kit_role', cp.pack_kit_role,
        'pack_kit_total', cp.pack_kit_total,
        'display_order', cp.display_order
      )
      order by cp.display_order nulls last, cp.display_name
    ),
    '[]'::jsonb
  )
    into v_products
  from public.campaign_products cp
  join public.products p on p.id = cp.product_id
  where cp.campaign_id = v_campaign_id
    and cp.visibility = 'published'
    and p.status = 'active';

  return jsonb_build_object(
    'name', v_name,
    'occasion', v_occasion,
    'budget_per_employee', v_budget,
    'expires_at', v_expires,
    'products', v_products
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name, email, role, company_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'sales'),
    nullif(new.raw_user_meta_data->>'company_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.has_any_role(roles public.app_role[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role = any(roles) from public.profiles where id = auth.uid()), false);
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$function$;

CREATE OR REPLACE FUNCTION public.is_catalog_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('admin', 'sales', 'management')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_client()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select role in ('client_admin','client_user')
     from public.profiles where id = auth.uid() and is_active),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_internal()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select role in ('admin','sales','operations','accounts','management')
     from public.profiles where id = auth.uid() and is_active),
    false
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_pricing_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('admin', 'sales', 'management', 'accounts')
  );
$function$;

CREATE OR REPLACE FUNCTION public.lead_stage_rank(stage public.lead_stage)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case stage when 'cold' then 1 when 'warm' then 2 when 'hot' then 3 when 'client' then 4 when 'regular_client' then 5 end;
$function$;

CREATE OR REPLACE FUNCTION public.move_sample(p_product_id uuid, p_quantity integer, p_from text, p_to text, p_company_id uuid DEFAULT NULL::uuid, p_requirement_id uuid DEFAULT NULL::uuid, p_cost numeric DEFAULT 0, p_note text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_row public.sample_stock%ROWTYPE;
BEGIN
  IF NOT public.has_any_role(array['admin','sales','operations']::public.app_role[]) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 1 THEN RAISE EXCEPTION 'Quantity must be positive'; END IF;
  INSERT INTO public.sample_stock (product_id) VALUES (p_product_id)
  ON CONFLICT (product_id) DO NOTHING;
  SELECT * INTO v_row FROM public.sample_stock WHERE product_id = p_product_id FOR UPDATE;
  IF p_from = 'office' AND v_row.in_office < p_quantity THEN RAISE EXCEPTION 'Not enough samples in office'; END IF;
  IF p_from = 'client' AND v_row.with_client < p_quantity THEN RAISE EXCEPTION 'Not enough samples with client'; END IF;
  IF p_from = 'supplier' AND v_row.pending_supplier < p_quantity THEN RAISE EXCEPTION 'Not enough samples pending supplier'; END IF;
  UPDATE public.sample_stock SET
    in_office = in_office + CASE WHEN p_to='office' THEN p_quantity ELSE 0 END - CASE WHEN p_from='office' THEN p_quantity ELSE 0 END,
    with_client = with_client + CASE WHEN p_to='client' THEN p_quantity ELSE 0 END - CASE WHEN p_from='client' THEN p_quantity ELSE 0 END,
    pending_supplier = pending_supplier + CASE WHEN p_to='supplier' THEN p_quantity ELSE 0 END - CASE WHEN p_from='supplier' THEN p_quantity ELSE 0 END
  WHERE product_id = p_product_id;
  INSERT INTO public.sample_movements (product_id, quantity, from_holder, to_holder, company_id, requirement_id, cost, note, created_by)
  VALUES (p_product_id, p_quantity, p_from, p_to, p_company_id, p_requirement_id, COALESCE(p_cost,0), p_note, auth.uid());
END;
$function$;

CREATE OR REPLACE FUNCTION public.next_invoice_number()
 RETURNS text
 LANGUAGE sql
AS $function$ select 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 4, '0'); $function$;

CREATE OR REPLACE FUNCTION public.next_order_number()
 RETURNS text
 LANGUAGE sql
AS $function$ select 'SO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_seq')::text, 4, '0'); $function$;

CREATE OR REPLACE FUNCTION public.next_quotation_number()
 RETURNS text
 LANGUAGE sql
AS $function$ select 'Q-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.quotation_seq')::text, 4, '0'); $function$;

CREATE OR REPLACE FUNCTION public.notify_users(p_audience public.notification_audience, p_company_id uuid, p_title text, p_body text, p_link text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.notifications (audience, company_id, title, body, link)
  values (p_audience, p_company_id, p_title, p_body, p_link);
end;
$function$;

CREATE OR REPLACE FUNCTION public.payments_refresh_invoice()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin perform public.refresh_invoice_status(coalesce(new.invoice_id, old.invoice_id)); return coalesce(new, old); end;
$function$;

CREATE OR REPLACE FUNCTION public.portal_host_hostname(p_slug text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select lower(p_slug) || '.giftingstore.online';
$function$;

CREATE OR REPLACE FUNCTION public.portal_hosts_assert_slug_available(p_slug text, p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_hostname text := public.portal_host_hostname(p_slug);
  v_other record;
begin
  select ph.* into v_other
  from public.portal_hosts ph
  where ph.hostname = v_hostname
    and ph.status <> 'removed'
    and (ph.company_id is distinct from p_company_id)
  limit 1;

  if found then
    raise exception 'PORTAL_SLUG_HELD: That portal address is already assigned to another company.'
      using errcode = 'P0001';
  end if;

  select ph.* into v_other
  from public.portal_hosts ph
  where ph.hostname = v_hostname
    and ph.status = 'removed'
    and ph.updated_at > now() - interval '90 days'
    and (ph.company_id is distinct from p_company_id)
  limit 1;

  if found then
    raise exception 'PORTAL_SLUG_COOLOFF: That portal address was recently used and cannot be reused yet.'
      using errcode = 'P0001';
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.portal_hosts_touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_lead_hot_downgrade()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  rank_old int;
  rank_new int;
BEGIN
  rank_old := CASE OLD.stage
    WHEN 'cold' THEN 0 WHEN 'warm' THEN 1 WHEN 'hot' THEN 2
    WHEN 'client' THEN 3 WHEN 'regular_client' THEN 4 ELSE 0 END;
  rank_new := CASE NEW.stage
    WHEN 'cold' THEN 0 WHEN 'warm' THEN 1 WHEN 'hot' THEN 2
    WHEN 'client' THEN 3 WHEN 'regular_client' THEN 4 ELSE 0 END;
  IF rank_old >= 2 AND rank_new < 2 THEN
    RAISE EXCEPTION 'Hot or converted leads cannot move back to cold/warm';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_lead_regression()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.protect_catalogue_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.catalogue_access IS DISTINCT FROM OLD.catalogue_access
    OR NEW.visibility IS DISTINCT FROM OLD.visibility
  ) THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admin can change product catalogue visibility';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.provision_client_user(p_email text, p_full_name text, p_password text, p_company_id uuid, p_role public.app_role DEFAULT 'client_admin'::public.app_role)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'extensions'
AS $function$
declare
  v_id uuid := gen_random_uuid();
begin
  if not public.has_any_role(array['admin','sales']::public.app_role[]) then
    raise exception 'Not permitted to create client users';
  end if;
  if p_role not in ('client_admin','client_user') then
    raise exception 'Role must be client_admin or client_user';
  end if;
  if not exists (select 1 from public.companies where id = p_company_id) then
    raise exception 'Company not found';
  end if;
  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'A user with that email already exists';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_id,
    'authenticated',
    'authenticated',
    lower(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'role', p_role::text, 'company_id', p_company_id::text),
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id
  ) values (
    gen_random_uuid(),
    v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(p_email)),
    'email',
    now(), now(), now(),
    v_id::text
  );

  update public.profiles
    set company_id = p_company_id, role = p_role, full_name = p_full_name
    where id = v_id;

  return v_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.recalc_order_cost(p_order_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.orders SET
    total_cost = COALESCE(product_cost,0)+COALESCE(printing_cost,0)+COALESCE(courier_cost,0)+COALESCE(other_cost,0),
    gross_profit = COALESCE(order_value,0) - (COALESCE(product_cost,0)+COALESCE(printing_cost,0)+COALESCE(courier_cost,0)+COALESCE(other_cost,0))
  WHERE id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recalc_quotation_totals(p_quotation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_subtotal numeric(14,2); v_discount numeric(14,2); v_tax numeric(14,2); v_header public.quotations%rowtype;
begin
  select * into v_header from public.quotations where id = p_quotation_id;
  select coalesce(sum(quantity * unit_price), 0) into v_subtotal from public.quotation_items where quotation_id = p_quotation_id;
  v_discount := round(v_subtotal * v_header.discount_percent / 100, 2);
  v_tax := round((v_subtotal - v_discount) * v_header.tax_percent / 100, 2);
  update public.quotations set subtotal = v_subtotal, discount_amount = v_discount, tax_amount = v_tax, total = v_subtotal - v_discount + v_tax where id = p_quotation_id;
  update public.quotation_items set line_total = round(quantity * unit_price * (1 - discount_percent/100) * (1 + tax_percent/100), 2) where quotation_id = p_quotation_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.record_campaign_event(p_campaign_id uuid, p_event_type text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.campaign_events (campaign_id, actor_id, event_type, payload)
  values (p_campaign_id, auth.uid(), p_event_type, coalesce(p_payload, '{}'::jsonb));
end;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_invoice_status(p_invoice_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_amount numeric(14,2); v_paid numeric(14,2); v_due date; v_status public.invoice_status;
begin
  select amount, due_date into v_amount, v_due from public.invoices where id = p_invoice_id;
  select coalesce(sum(amount), 0) into v_paid from public.payments where invoice_id = p_invoice_id;
  if v_paid >= v_amount then v_status := 'paid';
  elsif v_paid > 0 then v_status := 'partially_paid';
  elsif v_due < current_date then v_status := 'overdue';
  else v_status := 'unpaid'; end if;
  update public.invoices set status = v_status where id = p_invoice_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.resolved_sell_price(p_supplier_cost numeric, p_list_price numeric, p_product_margin numeric, p_company_margin numeric, p_channel text)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_global numeric;
  v_b2c numeric;
  v_b2b numeric;
  v_channel_margin numeric;
  v_margin numeric;
begin
  select default_margin_percent, b2c_margin_percent, b2b_margin_percent
    into v_global, v_b2c, v_b2b
  from public.org_settings
  limit 1;

  if lower(coalesce(p_channel, 'b2b')) = 'b2c' then
    v_channel_margin := v_b2c;
  else
    v_channel_margin := v_b2b;
  end if;

  -- Company → product → channel → global. Explicit 0 is a valid margin.
  v_margin := coalesce(p_company_margin, p_product_margin, v_channel_margin, v_global);

  if p_supplier_cost is not null and v_margin is not null then
    return round(p_supplier_cost * (1 + v_margin / 100.0), 2);
  end if;

  return round(coalesce(p_list_price, p_supplier_cost, 0)::numeric, 2);
end;
$function$;

CREATE OR REPLACE FUNCTION public.respond_quotation(p_quotation_id uuid, p_status text, p_comment text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  q public.quotations%rowtype;
  v_allowed boolean := false;
begin
  if p_status not in ('accepted', 'rejected') then
    raise exception 'Invalid response status';
  end if;

  select * into q
  from public.quotations
  where id = p_quotation_id
  for update;

  if not found then
    raise exception 'Quotation not found';
  end if;

  if public.is_client() then
    if q.company_id is not distinct from public.client_company_id() then
      v_allowed := true;
    end if;
  elsif public.can_management_read()
    or (public.can_sales() and (public.is_admin() or q.owner_id = auth.uid()))
  then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'Not permitted to respond to this quotation';
  end if;

  if q.status not in ('sent', 'viewed') then
    raise exception 'Quotation cannot be responded to in its current state';
  end if;

  if q.valid_until is not null and q.valid_until < current_date then
    update public.quotations
    set status = 'expired', updated_at = now()
    where id = q.id;
    raise exception 'This quotation has expired';
  end if;

  update public.quotations
  set
    status = p_status::quotation_status,
    client_comment = coalesce(nullif(trim(p_comment), ''), client_comment),
    responded_at = now(),
    updated_at = now()
  where id = p_quotation_id;

  if p_status = 'accepted' and q.requirement_id is not null then
    update public.quotations
    set status = 'rejected', updated_at = now()
    where requirement_id = q.requirement_id
      and id <> p_quotation_id
      and status in ('sent', 'viewed');
  end if;

  perform public.notify_users(
    'internal',
    q.company_id,
    case when p_status = 'accepted' then 'Quotation accepted' else 'Quotation declined' end,
    coalesce(nullif(trim(p_comment), ''), ''),
    '/crm/quotations/' || p_quotation_id::text
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.track_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by) values (new.id, old.status, new.status, auth.uid());
    if new.status = 'delivered' and new.actual_delivery_date is null then new.actual_delivery_date := current_date; end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.write_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_action text;
begin
  if tg_op = 'INSERT' then
    insert into public.audit_logs(user_id, action, entity, entity_id, new_value) values (auth.uid(), 'create', tg_table_name, new.id, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    if to_jsonb(new) ? 'status' and (to_jsonb(new)->>'status') is distinct from (to_jsonb(old)->>'status') then v_action := 'status_change';
    elsif to_jsonb(new) ? 'owner_id' and (to_jsonb(new)->>'owner_id') is distinct from (to_jsonb(old)->>'owner_id') then v_action := 'assignment_change'; end if;
    insert into public.audit_logs(user_id, action, entity, entity_id, previous_value, new_value) values (auth.uid(), v_action, tg_table_name, new.id, to_jsonb(old), to_jsonb(new));
    return new;
  else
    insert into public.audit_logs(user_id, action, entity, entity_id, previous_value) values (auth.uid(), 'delete', tg_table_name, old.id, to_jsonb(old));
    return old;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.write_catalogue_access_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.company_product_access;
  v_sku text;
begin
  if tg_op = 'DELETE' then v_row := old; else v_row := new; end if;
  select sku into v_sku from public.products where id = v_row.product_id;
  insert into public.audit_logs (user_id, action, entity, entity_id, previous_value, new_value)
  values (auth.uid(),
    case when tg_op = 'INSERT' then 'catalogue_client_added' else 'catalogue_client_removed' end,
    'company_product_access', v_row.product_id,
    case when tg_op = 'DELETE' then jsonb_build_object('company_id', old.company_id, 'product_id', old.product_id, 'sku', v_sku) end,
    case when tg_op = 'INSERT' then jsonb_build_object('company_id', new.company_id, 'product_id', new.product_id, 'sku', v_sku) end);
  return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.write_catalogue_exclusion_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.company_product_exclusions;
  v_sku text;
begin
  if tg_op = 'DELETE' then
    v_row := old;
  else
    v_row := new;
  end if;

  select sku into v_sku from public.products where id = v_row.product_id;

  insert into public.audit_logs (user_id, action, entity, entity_id, previous_value, new_value)
  values (
    auth.uid(),
    case when tg_op = 'INSERT' then 'catalogue_client_hidden' else 'catalogue_client_shown' end,
    'company_product_exclusions',
    v_row.product_id,
    case when tg_op = 'DELETE'
      then jsonb_build_object('company_id', old.company_id, 'product_id', old.product_id, 'sku', v_sku)
    end,
    case when tg_op = 'INSERT'
      then jsonb_build_object('company_id', new.company_id, 'product_id', new.product_id, 'sku', v_sku)
    end
  );
  return v_row;
end;
$function$;


-- ======================================================================
-- 9. Views (6)
-- ======================================================================

create or replace view public.client_products as
 SELECT p.id,
    p.name,
    p.sku,
    p.description,
    p.image_url,
        CASE
            WHEN COALESCE(( SELECT s.portal_show_sell_price
               FROM public.org_settings s
             LIMIT 1), true) IS FALSE THEN NULL::numeric
            ELSE public.resolved_sell_price(
            CASE
                WHEN COALESCE(( SELECT s.portal_use_best_cost
                   FROM public.org_settings s
                 LIMIT 1), false) THEN COALESCE(( SELECT o.cost
                   FROM public.product_supplier_offers o
                  WHERE o.product_id = p.id AND o.is_active AND (NOT COALESCE(( SELECT s.best_cost_require_in_stock
                           FROM public.org_settings s
                         LIMIT 1), true) OR o.in_stock) AND (p.moq IS NULL OR p.moq <= 0 OR o.moq <= p.moq)
                  ORDER BY o.is_preferred DESC, o.cost, o.lead_time_days, o.created_at
                 LIMIT 1), p.supplier_cost)
                ELSE p.supplier_cost
            END, p.price, p.internal_margin, ( SELECT c.margin_percent
               FROM public.companies c
              WHERE c.id = public.client_company_id()), 'b2b'::text)
        END AS price,
    p.moq,
    p.category_id,
    cat.name AS category_name,
    p.subcategory_id,
    sub.name AS subcategory_name,
    p.brand_id,
    b.name AS brand_name
   FROM public.products p
     LEFT JOIN public.categories cat ON cat.id = p.category_id
     LEFT JOIN public.subcategories sub ON sub.id = p.subcategory_id
     LEFT JOIN public.brands b ON b.id = p.brand_id
  WHERE p.status = 'active'::public.product_status AND p.catalogue_access <> 'none'::text AND (p.catalogue_access = 'all'::text OR (EXISTS ( SELECT 1
           FROM public.company_product_access cpa
          WHERE cpa.product_id = p.id AND cpa.company_id = public.client_company_id()))) AND NOT (EXISTS ( SELECT 1
           FROM public.company_product_exclusions cpe
          WHERE cpe.product_id = p.id AND cpe.company_id = public.client_company_id()));

create or replace view public.portal_campaigns as
 SELECT id,
    name,
    company_id,
    occasion,
    description,
    employee_quantity,
    budget_per_employee,
    total_budget,
    required_delivery_date,
    delivery_locations,
    preferred_categories,
    branding_requirements,
    packaging_requirements,
    custom_requirements,
    status,
    published_to_client_at
   FROM public.campaigns c
  WHERE published_to_client_at IS NOT NULL AND company_id = public.client_company_id();

create or replace view public.portal_catalogue with (security_invoker=false) as
 SELECT p.id,
    p.name,
    p.description,
    p.price,
    p.moq,
    p.image_url,
    p.status,
    p.category_id,
    p.brand_id,
    c.name AS category_name,
    b.name AS brand_name
   FROM public.products p
     LEFT JOIN public.categories c ON c.id = p.category_id
     LEFT JOIN public.brands b ON b.id = p.brand_id
  WHERE p.status = 'active'::public.product_status AND public.client_company_id() IS NOT NULL AND (p.catalogue_access = 'all'::text OR p.catalogue_access = 'selected'::text AND (EXISTS ( SELECT 1
           FROM public.company_product_access a
          WHERE a.product_id = p.id AND a.company_id = public.client_company_id())));

create or replace view public.portal_invoices with (security_invoker=false) as
 SELECT i.id,
    i.invoice_number,
    i.company_id,
    i.amount,
    i.status,
    i.due_date,
    i.invoice_date,
    o.order_number
   FROM public.invoices i
     LEFT JOIN public.orders o ON o.id = i.order_id
  WHERE i.company_id = public.client_company_id() OR public.is_internal();

create or replace view public.portal_offerings as
 SELECT cp.id,
    cp.campaign_id,
    cp.display_name,
    cp.client_description,
    cp.client_image_url,
    cp.selling_price,
    cp.discount_percent,
    cp.quantity_limit,
    cp.moq,
    cp.personalization_options,
    cp.variant_availability,
    cp.estimated_delivery,
    cp.client_specs,
    cp.display_order,
    cp.published_at,
    c.company_id,
    c.name AS campaign_name,
    c.employee_quantity,
    c.budget_per_employee,
    c.total_budget
   FROM public.campaign_products cp
     JOIN public.campaigns c ON c.id = cp.campaign_id
  WHERE cp.visibility = 'published'::public.offering_visibility AND c.published_to_client_at IS NOT NULL AND c.company_id = public.client_company_id();

create or replace view public.portal_orders with (security_invoker=false) as
 SELECT id,
    order_number,
    company_id,
    status,
    order_value,
    expected_delivery_date,
    actual_delivery_date,
    created_at,
    tracking_number,
    dispatch_date
   FROM public.orders
  WHERE company_id = public.client_company_id() OR public.is_internal();


-- ======================================================================
-- 10. Triggers on public tables (39)
-- ======================================================================

CREATE TRIGGER activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_campaign_products AFTER INSERT OR DELETE OR UPDATE ON public.campaign_products FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER campaign_products_updated_at BEFORE UPDATE ON public.campaign_products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_campaigns AFTER INSERT OR DELETE OR UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER selections_updated_at BEFORE UPDATE ON public.client_product_selections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_companies AFTER INSERT OR DELETE OR UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER companies_portal_slug_history AFTER UPDATE OF portal_slug ON public.companies FOR EACH ROW EXECUTE FUNCTION public.companies_record_slug_history();
CREATE TRIGGER companies_sync_portal_hosts AFTER INSERT OR UPDATE OF portal_slug, portal_status ON public.companies FOR EACH ROW EXECUTE FUNCTION public.companies_sync_portal_hosts();
CREATE TRIGGER companies_unpark_portal_hosts_on_delete BEFORE DELETE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.companies_unpark_portal_hosts_on_delete();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_company_product_access AFTER INSERT OR DELETE ON public.company_product_access FOR EACH ROW EXECUTE FUNCTION public.write_catalogue_access_audit();
CREATE TRIGGER audit_company_product_exclusions AFTER INSERT OR DELETE ON public.company_product_exclusions FOR EACH ROW EXECUTE FUNCTION public.write_catalogue_exclusion_audit();
CREATE TRIGGER audit_contacts AFTER INSERT OR DELETE OR UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER courier_partners_updated_at BEFORE UPDATE ON public.courier_partners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_invoices AFTER INSERT OR DELETE OR UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_leads AFTER INSERT OR DELETE OR UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER leads_stage_guard BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.prevent_lead_regression();
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_prevent_lead_hot_downgrade BEFORE UPDATE OF stage ON public.leads FOR EACH ROW EXECUTE FUNCTION public.prevent_lead_hot_downgrade();
CREATE TRIGGER audit_mockups AFTER INSERT OR DELETE OR UPDATE ON public.mockups FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER audit_orders AFTER INSERT OR DELETE OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER orders_status_history BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.track_order_status();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_payments AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER payments_after_change AFTER INSERT OR DELETE OR UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.payments_refresh_invoice();
CREATE TRIGGER portal_hosts_touch_updated_at BEFORE UPDATE ON public.portal_hosts FOR EACH ROW EXECUTE FUNCTION public.portal_hosts_touch_updated_at();
CREATE TRIGGER printing_vendors_updated_at BEFORE UPDATE ON public.printing_vendors FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_products AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_protect_catalogue_access BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.protect_catalogue_access();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_quotations AFTER INSERT OR DELETE OR UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER audit_requirements AFTER INSERT OR DELETE OR UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.write_audit();
CREATE TRIGGER requirements_updated_at BEFORE UPDATE ON public.requirements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ======================================================================
-- 11. Trigger on auth.users — creates a public.profiles row for every new auth user
-- ======================================================================

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ======================================================================
-- 12. Row level security enabled on every table (53)
-- ======================================================================

alter table public.activities enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_logs enable row level security;
alter table public.branches enable row level security;
alter table public.brands enable row level security;
alter table public.campaign_events enable row level security;
alter table public.campaign_products enable row level security;
alter table public.campaigns enable row level security;
alter table public.catalog_assignments enable row level security;
alter table public.catalog_share_links enable row level security;
alter table public.categories enable row level security;
alter table public.client_comments enable row level security;
alter table public.client_product_selections enable row level security;
alter table public.companies enable row level security;
alter table public.company_product_access enable row level security;
alter table public.company_product_exclusions enable row level security;
alter table public.contacts enable row level security;
alter table public.courier_partners enable row level security;
alter table public.department_members enable row level security;
alter table public.departments enable row level security;
alter table public.goals enable row level security;
alter table public.invoices enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.leads enable row level security;
alter table public.mockups enable row level security;
alter table public.notifications enable row level security;
alter table public.order_assignments enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.orders enable row level security;
alter table public.org_settings enable row level security;
alter table public.payables enable row level security;
alter table public.payments enable row level security;
alter table public.portal_host_runs enable row level security;
alter table public.portal_hosts enable row level security;
alter table public.printing_vendors enable row level security;
alter table public.product_supplier_offers enable row level security;
alter table public.product_variants enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.quotation_history enable row level security;
alter table public.quotation_item_costs enable row level security;
alter table public.quotation_items enable row level security;
alter table public.quotations enable row level security;
alter table public.requirement_products enable row level security;
alter table public.requirements enable row level security;
alter table public.reviews enable row level security;
alter table public.sample_movements enable row level security;
alter table public.sample_stock enable row level security;
alter table public.slug_history enable row level security;
alter table public.subcategories enable row level security;
alter table public.suppliers enable row level security;
alter table public.tasks enable row level security;


-- ======================================================================
-- 13. RLS policies on public tables (127)
-- ======================================================================

create policy activities_delete on public.activities as permissive for delete to public
  using (public.is_admin());

create policy activities_insert on public.activities as permissive for insert to public
  with check (public.is_internal());

create policy activities_select on public.activities as permissive for select to public
  using ((public.can_management_read() OR (assigned_to = auth.uid()) OR (created_by = auth.uid())));

create policy activities_update on public.activities as permissive for update to public
  using ((public.can_management_read() OR (assigned_to = auth.uid()) OR (created_by = auth.uid())))
  with check ((public.can_management_read() OR (assigned_to = auth.uid()) OR (created_by = auth.uid())));

create policy announcements_select on public.announcements as permissive for select to authenticated
  using (public.is_internal());

create policy announcements_write on public.announcements as permissive for all to authenticated
  using (public.has_any_role(ARRAY['admin'::public.app_role, 'management'::public.app_role]))
  with check (public.has_any_role(ARRAY['admin'::public.app_role, 'management'::public.app_role]));

create policy audit_insert on public.audit_logs as permissive for insert to authenticated
  with check (true);

create policy audit_select on public.audit_logs as permissive for select to public
  using ((public.can_management_read() OR (user_id = auth.uid())));

create policy branches_select on public.branches as permissive for select to authenticated
  using ((public.can_crm() OR public.can_orders_read() OR public.can_finance()));

create policy branches_write on public.branches as permissive for all to authenticated
  using (public.can_crm())
  with check (public.can_crm());

create policy brands_public_select on public.brands as permissive for select to anon, authenticated
  using (true);

create policy brands_select on public.brands as permissive for select to authenticated
  using (public.is_internal());

create policy brands_write on public.brands as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy campaign_events_insert on public.campaign_events as permissive for insert to authenticated
  with check ((public.is_internal() OR public.is_client()));

create policy campaign_events_select on public.campaign_events as permissive for select to authenticated
  using ((public.can_crm() OR public.can_ops() OR (EXISTS ( SELECT 1
   FROM public.campaigns c
  WHERE ((c.id = campaign_events.campaign_id) AND public.is_client() AND (c.company_id = public.client_company_id()))))));

create policy campaign_products_assigned_client_select on public.campaign_products as permissive for select to public
  using ((public.is_client() AND (visibility = 'published'::public.offering_visibility) AND (EXISTS ( SELECT 1
   FROM public.catalog_assignments a
  WHERE ((a.campaign_id = campaign_products.campaign_id) AND (a.company_id = public.client_company_id()))))));

create policy campaign_products_select_client on public.campaign_products as permissive for select to authenticated
  using (((visibility = 'published'::public.offering_visibility) AND (EXISTS ( SELECT 1
   FROM public.campaigns c
  WHERE ((c.id = campaign_products.campaign_id) AND (c.company_id = public.client_company_id()) AND (c.published_to_client_at IS NOT NULL))))));

create policy campaign_products_select_internal on public.campaign_products as permissive for select to authenticated
  using ((public.can_crm() OR public.can_ops() OR public.can_finance()));

create policy campaign_products_write on public.campaign_products as permissive for all to authenticated
  using (public.can_crm())
  with check (public.can_crm());

create policy campaigns_allow_unassigned_company on public.campaigns as permissive for update to public
  using (false)
  with check (((company_id IS NULL) AND public.is_catalog_staff()));

create policy campaigns_assigned_client_select on public.campaigns as permissive for select to public
  using ((public.is_client() AND (EXISTS ( SELECT 1
   FROM public.catalog_assignments a
  WHERE ((a.campaign_id = campaigns.id) AND (a.company_id = public.client_company_id()))))));

create policy campaigns_insert_unassigned on public.campaigns as permissive for insert to public
  with check (((company_id IS NULL) AND public.is_catalog_staff()));

create policy campaigns_select_client on public.campaigns as permissive for select to authenticated
  using ((public.is_client() AND (company_id = public.client_company_id()) AND (published_to_client_at IS NOT NULL)));

create policy campaigns_select_internal on public.campaigns as permissive for select to authenticated
  using ((public.can_crm() OR public.can_ops() OR public.can_finance()));

create policy campaigns_write on public.campaigns as permissive for all to authenticated
  using (public.can_crm())
  with check (public.can_crm());

create policy catalog_assignments_client_select on public.catalog_assignments as permissive for select to public
  using ((public.is_client() AND (company_id = public.client_company_id())));

create policy catalog_assignments_staff_all on public.catalog_assignments as permissive for all to public
  using (public.is_catalog_staff())
  with check (public.is_catalog_staff());

create policy catalog_share_links_staff_all on public.catalog_share_links as permissive for all to public
  using (public.is_catalog_staff())
  with check (public.is_catalog_staff());

create policy cat_select on public.categories as permissive for select to authenticated
  using (public.is_internal());

create policy cat_write on public.categories as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy categories_public_select on public.categories as permissive for select to anon, authenticated
  using (true);

create policy comments_insert on public.client_comments as permissive for insert to authenticated
  with check ((public.is_client() AND (company_id = public.client_company_id()) AND (user_id = auth.uid())));

create policy comments_select on public.client_comments as permissive for select to authenticated
  using ((public.can_crm() OR public.can_ops() OR (public.is_client() AND (company_id = public.client_company_id()))));

create policy client_selections_assigned_insert on public.client_product_selections as permissive for insert to public
  with check ((public.is_client() AND (user_id = auth.uid()) AND (company_id = public.client_company_id()) AND (EXISTS ( SELECT 1
   FROM public.catalog_assignments a
  WHERE ((a.campaign_id = client_product_selections.campaign_id) AND (a.company_id = public.client_company_id()))))));

create policy client_selections_assigned_update on public.client_product_selections as permissive for update to public
  using ((public.is_client() AND (user_id = auth.uid()) AND (company_id = public.client_company_id()) AND (EXISTS ( SELECT 1
   FROM public.catalog_assignments a
  WHERE ((a.campaign_id = client_product_selections.campaign_id) AND (a.company_id = public.client_company_id()))))))
  with check ((public.is_client() AND (user_id = auth.uid()) AND (company_id = public.client_company_id()) AND (EXISTS ( SELECT 1
   FROM public.catalog_assignments a
  WHERE ((a.campaign_id = client_product_selections.campaign_id) AND (a.company_id = public.client_company_id()))))));

create policy selections_delete on public.client_product_selections as permissive for delete to authenticated
  using ((public.is_client() AND (user_id = auth.uid()) AND (company_id = public.client_company_id())));

create policy selections_insert on public.client_product_selections as permissive for insert to authenticated
  with check ((public.is_client() AND (company_id = public.client_company_id()) AND (user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.campaigns c
  WHERE ((c.id = client_product_selections.campaign_id) AND (c.company_id = public.client_company_id()) AND (c.published_to_client_at IS NOT NULL))))));

create policy selections_select on public.client_product_selections as permissive for select to authenticated
  using ((public.can_crm() OR public.can_ops() OR (public.is_client() AND (company_id = public.client_company_id()))));

create policy selections_update on public.client_product_selections as permissive for update to authenticated
  using ((public.is_client() AND (user_id = auth.uid()) AND (company_id = public.client_company_id())))
  with check ((public.is_client() AND (user_id = auth.uid()) AND (company_id = public.client_company_id())));

create policy companies_delete on public.companies as permissive for delete to authenticated
  using (public.is_admin());

create policy companies_select on public.companies as permissive for select to public
  using ((public.can_management_read() OR public.can_ops() OR public.can_finance() OR ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'sales'::public.app_role)))) AND (owner_id = auth.uid())) OR (public.is_client() AND (id = public.client_company_id()))));

create policy companies_update on public.companies as permissive for update to public
  using ((public.is_admin() OR (public.can_crm() AND (owner_id = auth.uid()))))
  with check ((public.is_admin() OR (public.can_crm() AND (owner_id = auth.uid()))));

create policy companies_write on public.companies as permissive for insert to authenticated
  with check (public.can_crm());

create policy cpa_select on public.company_product_access as permissive for select to public
  using ((public.is_internal() OR (company_id = public.client_company_id())));

create policy cpa_write on public.company_product_access as permissive for all to public
  using (public.is_admin())
  with check (public.is_admin());

create policy cpe_select on public.company_product_exclusions as permissive for select to public
  using ((public.can_management_read() OR public.can_crm()));

create policy cpe_write on public.company_product_exclusions as permissive for all to public
  using (public.is_admin())
  with check (public.is_admin());

create policy contacts_delete on public.contacts as permissive for delete to public
  using (public.is_admin());

create policy contacts_insert on public.contacts as permissive for insert to public
  with check ((public.can_crm() AND (public.is_admin() OR (company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.owner_id = auth.uid()))))));

create policy contacts_select on public.contacts as permissive for select to public
  using ((public.can_management_read() OR public.can_ops() OR public.can_finance() OR ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'sales'::public.app_role)))) AND (company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.owner_id = auth.uid())))) OR (public.is_client() AND (company_id = public.client_company_id()))));

create policy contacts_update on public.contacts as permissive for update to public
  using ((public.can_crm() AND (public.is_admin() OR (company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.owner_id = auth.uid()))))))
  with check ((public.can_crm() AND (public.is_admin() OR (company_id IN ( SELECT companies.id
   FROM public.companies
  WHERE (companies.owner_id = auth.uid()))))));

create policy courier_select on public.courier_partners as permissive for select to authenticated
  using ((public.can_ops() OR public.is_admin() OR public.can_management_read()));

create policy courier_write on public.courier_partners as permissive for all to authenticated
  using (public.can_ops())
  with check (public.can_ops());

create policy internal_all_dept_members on public.department_members as permissive for all to authenticated
  using ((NOT public.is_client()))
  with check ((NOT public.is_client()));

create policy internal_all_departments on public.departments as permissive for all to authenticated
  using ((NOT public.is_client()))
  with check ((NOT public.is_client()));

create policy goals_select on public.goals as permissive for select to public
  using ((public.can_management_read() OR (owner_id = auth.uid()) OR (owner_id IS NULL)));

create policy goals_write on public.goals as permissive for all to public
  using (public.can_management_read())
  with check (public.can_management_read());

create policy invoices_select on public.invoices as permissive for select to authenticated
  using ((public.can_finance() OR public.can_management_read()));

create policy invoices_select_client on public.invoices as permissive for select to public
  using ((public.is_client() AND (company_id = public.client_company_id())));

create policy invoices_write on public.invoices as permissive for all to authenticated
  using (public.can_finance())
  with check (public.can_finance());

create policy lead_hist_select on public.lead_stage_history as permissive for select to authenticated
  using ((public.can_crm() OR public.can_management_read()));

create policy leads_delete on public.leads as permissive for delete to public
  using (public.is_admin());

create policy leads_insert on public.leads as permissive for insert to public
  with check ((public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid()))));

create policy leads_select on public.leads as permissive for select to public
  using ((public.can_management_read() OR (public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid())))));

create policy leads_update on public.leads as permissive for update to public
  using ((public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid()))))
  with check ((public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid()))));

create policy mockups_select on public.mockups as permissive for select to authenticated
  using ((public.can_sales() OR public.can_ops() OR public.is_admin()));

create policy mockups_select_client on public.mockups as permissive for select to public
  using ((public.is_client() AND (status = 'shared'::public.mockup_status) AND ((requirement_id IN ( SELECT requirements.id
   FROM public.requirements
  WHERE (requirements.company_id = public.client_company_id()))) OR (order_id IN ( SELECT orders.id
   FROM public.orders
  WHERE (orders.company_id = public.client_company_id()))))));

create policy mockups_write on public.mockups as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy notifications_insert_internal on public.notifications as permissive for insert to authenticated
  with check ((public.is_internal() OR public.is_client()));

create policy notifications_select on public.notifications as permissive for select to authenticated
  using ((((audience = 'internal'::public.notification_audience) AND public.is_internal()) OR ((audience = 'client'::public.notification_audience) AND public.is_client() AND (company_id = public.client_company_id()) AND ((user_id IS NULL) OR (user_id = auth.uid())))));

create policy notifications_update on public.notifications as permissive for update to authenticated
  using ((((audience = 'internal'::public.notification_audience) AND public.is_internal()) OR ((audience = 'client'::public.notification_audience) AND public.is_client() AND (company_id = public.client_company_id()))))
  with check (true);

create policy internal_all_order_assignments on public.order_assignments as permissive for all to authenticated
  using ((NOT public.is_client()))
  with check ((NOT public.is_client()));

create policy order_items_select on public.order_items as permissive for select to authenticated
  using ((public.can_orders_read() OR (EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND public.is_client() AND (o.company_id = public.client_company_id()))))));

create policy order_items_write on public.order_items as permissive for all to authenticated
  using (public.can_orders_write())
  with check (public.can_orders_write());

create policy order_hist_select on public.order_status_history as permissive for select to authenticated
  using (public.can_orders_read());

create policy orders_delete on public.orders as permissive for delete to authenticated
  using (public.is_admin());

create policy orders_insert on public.orders as permissive for insert to authenticated
  with check (public.has_any_role(ARRAY['admin'::public.app_role, 'sales'::public.app_role, 'operations'::public.app_role]));

create policy orders_select on public.orders as permissive for select to public
  using ((public.can_management_read() OR public.can_finance() OR ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'sales'::public.app_role)))) AND ((owner_id = auth.uid()) OR (assigned_to = auth.uid()))) OR ((EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'operations'::public.app_role)))) AND ((assigned_to = auth.uid()) OR (operations_user_id = auth.uid()) OR (current_department_id = ( SELECT profiles.department_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM public.order_assignments oa
  WHERE ((oa.order_id = orders.id) AND (oa.assigned_to = auth.uid()))))))));

create policy orders_select_client on public.orders as permissive for select to public
  using ((public.is_client() AND (company_id = public.client_company_id())));

create policy orders_update on public.orders as permissive for update to authenticated
  using (public.can_orders_write())
  with check (public.can_orders_write());

create policy org_settings_read on public.org_settings as permissive for select to authenticated
  using (public.is_internal());

create policy org_settings_write on public.org_settings as permissive for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy payables_select on public.payables as permissive for select to authenticated
  using ((public.can_finance() OR public.is_admin()));

create policy payables_write on public.payables as permissive for all to authenticated
  using (public.has_any_role(ARRAY['admin'::public.app_role, 'accounts'::public.app_role]))
  with check (public.has_any_role(ARRAY['admin'::public.app_role, 'accounts'::public.app_role]));

create policy payments_select on public.payments as permissive for select to authenticated
  using ((public.can_finance() OR public.can_management_read()));

create policy payments_write on public.payments as permissive for all to authenticated
  using (public.can_finance())
  with check (public.can_finance());

create policy portal_host_runs_select on public.portal_host_runs as permissive for select to public
  using ((public.is_admin() OR public.can_crm()));

create policy portal_hosts_select on public.portal_hosts as permissive for select to public
  using ((public.is_admin() OR public.can_crm() OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'sales'::public.app_role))))));

create policy print_select on public.printing_vendors as permissive for select to authenticated
  using ((public.can_ops() OR public.is_admin() OR public.can_management_read()));

create policy print_write on public.printing_vendors as permissive for all to authenticated
  using (public.can_ops())
  with check (public.can_ops());

create policy product_supplier_offers_staff on public.product_supplier_offers as permissive for all to public
  using (public.is_pricing_staff())
  with check (public.is_pricing_staff());

create policy variants_select on public.product_variants as permissive for select to authenticated
  using (public.is_internal());

create policy variants_write on public.product_variants as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy products_public_catalogue_select on public.products as permissive for select to anon, authenticated
  using (((status = 'active'::public.product_status) AND (catalogue_access = 'all'::text)));

create policy products_select on public.products as permissive for select to public
  using (public.is_internal());

create policy products_write on public.products as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy profiles_admin_all on public.profiles as permissive for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy profiles_select on public.profiles as permissive for select to authenticated
  using ((public.is_internal() OR (id = auth.uid()) OR (public.is_client() AND (company_id = public.client_company_id()) AND (role = ANY (ARRAY['client_admin'::public.app_role, 'client_user'::public.app_role])))));

create policy quot_hist_select on public.quotation_history as permissive for select to authenticated
  using ((public.can_sales() OR public.can_ops()));

create policy quotation_item_costs_staff on public.quotation_item_costs as permissive for all to public
  using (public.is_pricing_staff())
  with check (public.is_pricing_staff());

create policy quot_items_select on public.quotation_items as permissive for select to authenticated
  using ((public.can_sales() OR public.can_ops() OR public.can_finance() OR (EXISTS ( SELECT 1
   FROM public.quotations q
  WHERE ((q.id = quotation_items.quotation_id) AND public.is_client() AND (q.company_id = public.client_company_id()) AND (q.status = ANY (ARRAY['sent'::public.quotation_status, 'viewed'::public.quotation_status, 'accepted'::public.quotation_status, 'rejected'::public.quotation_status, 'expired'::public.quotation_status])))))));

create policy quot_items_write on public.quotation_items as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy quot_delete on public.quotations as permissive for delete to public
  using (public.is_admin());

create policy quot_insert on public.quotations as permissive for insert to public
  with check ((public.can_sales() AND (public.is_admin() OR (owner_id = auth.uid()))));

create policy quot_select_client on public.quotations as permissive for select to public
  using ((public.is_client() AND (company_id = public.client_company_id()) AND (status = ANY (ARRAY['sent'::public.quotation_status, 'viewed'::public.quotation_status, 'accepted'::public.quotation_status, 'rejected'::public.quotation_status, 'expired'::public.quotation_status]))));

create policy quot_select_internal on public.quotations as permissive for select to public
  using ((public.can_management_read() OR (public.can_sales() AND (public.is_admin() OR (owner_id = auth.uid())))));

create policy quot_update on public.quotations as permissive for update to public
  using ((public.can_sales() AND (public.is_admin() OR (owner_id = auth.uid()))))
  with check ((public.can_sales() AND (public.is_admin() OR (owner_id = auth.uid()))));

create policy req_prod_select on public.requirement_products as permissive for select to authenticated
  using ((public.can_crm() OR public.can_ops() OR public.can_management_read()));

create policy req_prod_write on public.requirement_products as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy req_delete on public.requirements as permissive for delete to public
  using (public.is_admin());

create policy req_insert on public.requirements as permissive for insert to public
  with check ((public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid()))));

create policy req_select on public.requirements as permissive for select to public
  using ((public.can_management_read() OR (public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid()))) OR (public.is_client() AND (company_id = public.client_company_id()))));

create policy req_update on public.requirements as permissive for update to public
  using ((public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid()))))
  with check ((public.can_crm() AND (public.is_admin() OR (owner_id = auth.uid()))));

create policy "Admins manage reviews" on public.reviews as permissive for all to public
  using (public.is_admin());

create policy "Internal users view reviews" on public.reviews as permissive for select to public
  using (public.is_internal());

create policy sample_movements_all on public.sample_movements as permissive for all to authenticated
  using (public.is_internal())
  with check (public.has_any_role(ARRAY['admin'::public.app_role, 'sales'::public.app_role, 'operations'::public.app_role]));

create policy sample_stock_all on public.sample_stock as permissive for all to authenticated
  using (public.is_internal())
  with check (public.has_any_role(ARRAY['admin'::public.app_role, 'sales'::public.app_role, 'operations'::public.app_role]));

create policy slug_history_delete on public.slug_history as permissive for delete to public
  using (public.is_admin());

create policy slug_history_insert on public.slug_history as permissive for insert to public
  with check ((public.is_admin() OR public.can_crm()));

create policy slug_history_select on public.slug_history as permissive for select to public
  using ((public.can_management_read() OR public.can_ops() OR public.can_finance() OR (EXISTS ( SELECT 1
   FROM public.profiles p
  WHERE ((p.id = auth.uid()) AND (p.role = 'sales'::public.app_role))))));

create policy slug_history_update on public.slug_history as permissive for update to public
  using ((public.is_admin() OR public.can_crm()))
  with check ((public.is_admin() OR public.can_crm()));

create policy subcat_select on public.subcategories as permissive for select to authenticated
  using (public.is_internal());

create policy subcat_write on public.subcategories as permissive for all to authenticated
  using (public.can_sales())
  with check (public.can_sales());

create policy suppliers_select on public.suppliers as permissive for select to authenticated
  using ((public.can_ops() OR public.can_sales() OR public.can_finance() OR public.can_management_read()));

create policy suppliers_write on public.suppliers as permissive for all to authenticated
  using (public.can_ops())
  with check (public.can_ops());

create policy tasks_select on public.tasks as permissive for select to authenticated
  using ((public.is_internal() AND (public.has_any_role(ARRAY['admin'::public.app_role, 'management'::public.app_role]) OR (assigned_to = auth.uid()) OR (created_by = auth.uid()) OR (department_id IN ( SELECT department_members.department_id
   FROM public.department_members
  WHERE (department_members.user_id = auth.uid()))) OR (department_id = ( SELECT profiles.department_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))))));

create policy tasks_write on public.tasks as permissive for all to authenticated
  using ((public.has_any_role(ARRAY['admin'::public.app_role, 'operations'::public.app_role]) OR (assigned_to = auth.uid()) OR (created_by = auth.uid())))
  with check ((public.has_any_role(ARRAY['admin'::public.app_role, 'operations'::public.app_role]) OR (assigned_to = auth.uid()) OR (created_by = auth.uid())));


-- ======================================================================
-- 14. Table, view and sequence privileges
-- ======================================================================

revoke all on table public.activities from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.activities to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.activities to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.activities to service_role;
revoke all on table public.announcements from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.announcements to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.announcements to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.announcements to service_role;
revoke all on table public.audit_logs from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.audit_logs to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.audit_logs to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.audit_logs to service_role;
revoke all on table public.branches from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.branches to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.branches to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.branches to service_role;
revoke all on table public.brands from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.brands to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.brands to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.brands to service_role;
revoke all on table public.campaign_events from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaign_events to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaign_events to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaign_events to service_role;
revoke all on table public.campaign_products from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaign_products to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaign_products to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaign_products to service_role;
revoke all on table public.campaigns from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaigns to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaigns to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.campaigns to service_role;
revoke all on table public.catalog_assignments from public, anon, authenticated, service_role;
grant delete, insert, select, update on table public.catalog_assignments to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.catalog_assignments to service_role;
revoke all on table public.catalog_share_links from public, anon, authenticated, service_role;
grant delete, insert, select, update on table public.catalog_share_links to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.catalog_share_links to service_role;
revoke all on table public.categories from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.categories to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.categories to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.categories to service_role;
revoke all on table public.client_comments from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_comments to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_comments to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_comments to service_role;
revoke all on table public.client_product_selections from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_product_selections to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_product_selections to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_product_selections to service_role;
revoke all on table public.client_products from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_products to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.client_products to service_role;
revoke all on table public.companies from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.companies to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.companies to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.companies to service_role;
revoke all on table public.company_product_access from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.company_product_access to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.company_product_access to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.company_product_access to service_role;
revoke all on table public.company_product_exclusions from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.company_product_exclusions to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.company_product_exclusions to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.company_product_exclusions to service_role;
revoke all on table public.contacts from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.contacts to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.contacts to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.contacts to service_role;
revoke all on table public.courier_partners from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.courier_partners to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.courier_partners to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.courier_partners to service_role;
revoke all on table public.department_members from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.department_members to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.department_members to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.department_members to service_role;
revoke all on table public.departments from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.departments to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.departments to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.departments to service_role;
revoke all on table public.goals from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.goals to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.goals to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.goals to service_role;
revoke all on table public.invoices from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.invoices to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.invoices to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.invoices to service_role;
revoke all on table public.lead_stage_history from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.lead_stage_history to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.lead_stage_history to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.lead_stage_history to service_role;
revoke all on table public.leads from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.leads to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.leads to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.leads to service_role;
revoke all on table public.mockups from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.mockups to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.mockups to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.mockups to service_role;
revoke all on table public.notifications from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.notifications to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.notifications to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.notifications to service_role;
revoke all on table public.order_assignments from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_assignments to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_assignments to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_assignments to service_role;
revoke all on table public.order_items from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_items to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_items to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_items to service_role;
revoke all on table public.order_status_history from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_status_history to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_status_history to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.order_status_history to service_role;
revoke all on table public.orders from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.orders to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.orders to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.orders to service_role;
revoke all on table public.org_settings from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.org_settings to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.org_settings to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.org_settings to service_role;
revoke all on table public.payables from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.payables to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.payables to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.payables to service_role;
revoke all on table public.payments from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.payments to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.payments to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.payments to service_role;
revoke all on table public.portal_campaigns from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_campaigns to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_campaigns to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_campaigns to service_role;
revoke all on table public.portal_catalogue from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_catalogue to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_catalogue to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_catalogue to service_role;
revoke all on table public.portal_host_runs from public, anon, authenticated, service_role;
grant maintain, references, select, trigger on table public.portal_host_runs to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_host_runs to service_role;
revoke all on table public.portal_hosts from public, anon, authenticated, service_role;
grant maintain, references, select, trigger on table public.portal_hosts to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_hosts to service_role;
revoke all on table public.portal_invoices from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_invoices to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_invoices to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_invoices to service_role;
revoke all on table public.portal_offerings from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_offerings to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_offerings to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_offerings to service_role;
revoke all on table public.portal_orders from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_orders to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_orders to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.portal_orders to service_role;
revoke all on table public.printing_vendors from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.printing_vendors to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.printing_vendors to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.printing_vendors to service_role;
revoke all on table public.product_supplier_offers from public, anon, authenticated, service_role;
grant delete, insert, select, update on table public.product_supplier_offers to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.product_supplier_offers to service_role;
revoke all on table public.product_variants from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.product_variants to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.product_variants to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.product_variants to service_role;
revoke all on table public.products from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.products to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.products to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.products to service_role;
revoke all on table public.profiles from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.profiles to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.profiles to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.profiles to service_role;
revoke all on table public.quotation_history from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotation_history to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotation_history to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotation_history to service_role;
revoke all on table public.quotation_item_costs from public, anon, authenticated, service_role;
grant delete, insert, select, update on table public.quotation_item_costs to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotation_item_costs to service_role;
revoke all on table public.quotation_items from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotation_items to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotation_items to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotation_items to service_role;
revoke all on table public.quotations from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotations to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotations to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.quotations to service_role;
revoke all on table public.requirement_products from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.requirement_products to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.requirement_products to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.requirement_products to service_role;
revoke all on table public.requirements from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.requirements to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.requirements to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.requirements to service_role;
revoke all on table public.reviews from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.reviews to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.reviews to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.reviews to service_role;
revoke all on table public.sample_movements from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.sample_movements to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.sample_movements to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.sample_movements to service_role;
revoke all on table public.sample_stock from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.sample_stock to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.sample_stock to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.sample_stock to service_role;
revoke all on table public.slug_history from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.slug_history to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.slug_history to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.slug_history to service_role;
revoke all on table public.subcategories from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.subcategories to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.subcategories to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.subcategories to service_role;
revoke all on table public.suppliers from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.suppliers to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.suppliers to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.suppliers to service_role;
revoke all on table public.tasks from public, anon, authenticated, service_role;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.tasks to anon;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.tasks to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on table public.tasks to service_role;
revoke all on sequence public.invoice_seq from public, anon, authenticated, service_role;
grant select, update, usage on sequence public.invoice_seq to anon;
grant select, update, usage on sequence public.invoice_seq to authenticated;
grant select, update, usage on sequence public.invoice_seq to service_role;
revoke all on sequence public.order_seq from public, anon, authenticated, service_role;
grant select, update, usage on sequence public.order_seq to anon;
grant select, update, usage on sequence public.order_seq to authenticated;
grant select, update, usage on sequence public.order_seq to service_role;
revoke all on sequence public.quotation_seq from public, anon, authenticated, service_role;
grant select, update, usage on sequence public.quotation_seq to anon;
grant select, update, usage on sequence public.quotation_seq to authenticated;
grant select, update, usage on sequence public.quotation_seq to service_role;


-- ======================================================================
-- 15. Function execute privileges
-- ======================================================================

revoke all on function public.advance_order_stage(uuid,public.order_status,uuid,uuid,text,date,text) from public, anon, authenticated, service_role;
grant execute on function public.advance_order_stage(uuid,public.order_status,uuid,uuid,text,date,text) to anon, authenticated, public, service_role;
revoke all on function public.assign_order(uuid,uuid,uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.assign_order(uuid,uuid,uuid,text) to anon, authenticated, public, service_role;
revoke all on function public.best_supplier_cost(uuid,integer) from public, anon, authenticated, service_role;
grant execute on function public.best_supplier_cost(uuid,integer) to service_role;
revoke all on function public.can_client_admin() from public, anon, authenticated, service_role;
grant execute on function public.can_client_admin() to anon, authenticated, public, service_role;
revoke all on function public.can_crm() from public, anon, authenticated, service_role;
grant execute on function public.can_crm() to anon, authenticated, public, service_role;
revoke all on function public.can_finance() from public, anon, authenticated, service_role;
grant execute on function public.can_finance() to anon, authenticated, public, service_role;
revoke all on function public.can_manage_team() from public, anon, authenticated, service_role;
grant execute on function public.can_manage_team() to anon, authenticated, public, service_role;
revoke all on function public.can_management_read() from public, anon, authenticated, service_role;
grant execute on function public.can_management_read() to anon, authenticated, public, service_role;
revoke all on function public.can_ops() from public, anon, authenticated, service_role;
grant execute on function public.can_ops() to anon, authenticated, public, service_role;
revoke all on function public.can_orders_read() from public, anon, authenticated, service_role;
grant execute on function public.can_orders_read() to anon, authenticated, public, service_role;
revoke all on function public.can_orders_write() from public, anon, authenticated, service_role;
grant execute on function public.can_orders_write() to anon, authenticated, public, service_role;
revoke all on function public.can_sales() from public, anon, authenticated, service_role;
grant execute on function public.can_sales() to anon, authenticated, public, service_role;
revoke all on function public.claim_portal_host_jobs(integer,integer,uuid) from public, anon, authenticated, service_role;
grant execute on function public.claim_portal_host_jobs(integer,integer,uuid) to service_role;
revoke all on function public.client_company_id() from public, anon, authenticated, service_role;
grant execute on function public.client_company_id() to anon, authenticated, public, service_role;
revoke all on function public.client_mark_quotation_viewed(uuid) from public, anon, authenticated, service_role;
grant execute on function public.client_mark_quotation_viewed(uuid) to anon, authenticated, public, service_role;
revoke all on function public.client_respond_quotation(uuid,boolean,text) from public, anon, authenticated, service_role;
grant execute on function public.client_respond_quotation(uuid,boolean,text) to anon, authenticated, public, service_role;
revoke all on function public.client_respond_quotation(uuid,text,text,uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.client_respond_quotation(uuid,text,text,uuid[]) to anon, authenticated, service_role;
revoke all on function public.client_set_campaign_status(uuid,public.campaign_status) from public, anon, authenticated, service_role;
grant execute on function public.client_set_campaign_status(uuid,public.campaign_status) to anon, authenticated, public, service_role;
revoke all on function public.companies_record_slug_history() from public, anon, authenticated, service_role;
grant execute on function public.companies_record_slug_history() to anon, authenticated, public, service_role;
revoke all on function public.companies_sync_portal_hosts() from public, anon, authenticated, service_role;
grant execute on function public.companies_sync_portal_hosts() to anon, authenticated, public, service_role;
revoke all on function public.companies_unpark_portal_hosts_on_delete() from public, anon, authenticated, service_role;
grant execute on function public.companies_unpark_portal_hosts_on_delete() to anon, authenticated, public, service_role;
revoke all on function public.convert_quotation_to_order(uuid) from public, anon, authenticated, service_role;
grant execute on function public.convert_quotation_to_order(uuid) to anon, authenticated, public, service_role;
revoke all on function public."current_role"() from public, anon, authenticated, service_role;
grant execute on function public."current_role"() to anon, authenticated, public, service_role;
revoke all on function public.duplicate_quotation(uuid) from public, anon, authenticated, service_role;
grant execute on function public.duplicate_quotation(uuid) to anon, authenticated, public, service_role;
revoke all on function public.get_shared_catalog(text) from public, anon, authenticated, service_role;
grant execute on function public.get_shared_catalog(text) to anon, authenticated, service_role;
revoke all on function public.handle_new_user() from public, anon, authenticated, service_role;
grant execute on function public.handle_new_user() to anon, authenticated, public, service_role;
revoke all on function public.has_any_role(public.app_role[]) from public, anon, authenticated, service_role;
grant execute on function public.has_any_role(public.app_role[]) to anon, authenticated, public, service_role;
revoke all on function public.is_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to anon, authenticated, public, service_role;
revoke all on function public.is_catalog_staff() from public, anon, authenticated, service_role;
grant execute on function public.is_catalog_staff() to anon, authenticated, service_role;
revoke all on function public.is_client() from public, anon, authenticated, service_role;
grant execute on function public.is_client() to anon, authenticated, public, service_role;
revoke all on function public.is_internal() from public, anon, authenticated, service_role;
grant execute on function public.is_internal() to anon, authenticated, public, service_role;
revoke all on function public.is_pricing_staff() from public, anon, authenticated, service_role;
grant execute on function public.is_pricing_staff() to anon, authenticated, service_role;
revoke all on function public.lead_stage_rank(public.lead_stage) from public, anon, authenticated, service_role;
grant execute on function public.lead_stage_rank(public.lead_stage) to anon, authenticated, public, service_role;
revoke all on function public.move_sample(uuid,integer,text,text,uuid,uuid,numeric,text) from public, anon, authenticated, service_role;
grant execute on function public.move_sample(uuid,integer,text,text,uuid,uuid,numeric,text) to anon, authenticated, public, service_role;
revoke all on function public.next_invoice_number() from public, anon, authenticated, service_role;
grant execute on function public.next_invoice_number() to anon, authenticated, public, service_role;
revoke all on function public.next_order_number() from public, anon, authenticated, service_role;
grant execute on function public.next_order_number() to anon, authenticated, public, service_role;
revoke all on function public.next_quotation_number() from public, anon, authenticated, service_role;
grant execute on function public.next_quotation_number() to anon, authenticated, public, service_role;
revoke all on function public.notify_users(public.notification_audience,uuid,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.notify_users(public.notification_audience,uuid,text,text,text) to anon, authenticated, public, service_role;
revoke all on function public.payments_refresh_invoice() from public, anon, authenticated, service_role;
grant execute on function public.payments_refresh_invoice() to anon, authenticated, public, service_role;
revoke all on function public.portal_host_hostname(text) from public, anon, authenticated, service_role;
grant execute on function public.portal_host_hostname(text) to anon, authenticated, public, service_role;
revoke all on function public.portal_hosts_assert_slug_available(text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.portal_hosts_assert_slug_available(text,uuid) to service_role;
revoke all on function public.portal_hosts_touch_updated_at() from public, anon, authenticated, service_role;
grant execute on function public.portal_hosts_touch_updated_at() to anon, authenticated, public, service_role;
revoke all on function public.prevent_lead_hot_downgrade() from public, anon, authenticated, service_role;
grant execute on function public.prevent_lead_hot_downgrade() to anon, authenticated, public, service_role;
revoke all on function public.prevent_lead_regression() from public, anon, authenticated, service_role;
grant execute on function public.prevent_lead_regression() to anon, authenticated, public, service_role;
revoke all on function public.protect_catalogue_access() from public, anon, authenticated, service_role;
grant execute on function public.protect_catalogue_access() to anon, authenticated, public, service_role;
revoke all on function public.provision_client_user(text,text,text,uuid,public.app_role) from public, anon, authenticated, service_role;
grant execute on function public.provision_client_user(text,text,text,uuid,public.app_role) to anon, authenticated, public, service_role;
revoke all on function public.recalc_order_cost(uuid) from public, anon, authenticated, service_role;
grant execute on function public.recalc_order_cost(uuid) to anon, authenticated, public, service_role;
revoke all on function public.recalc_quotation_totals(uuid) from public, anon, authenticated, service_role;
grant execute on function public.recalc_quotation_totals(uuid) to anon, authenticated, public, service_role;
revoke all on function public.record_campaign_event(uuid,text,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.record_campaign_event(uuid,text,jsonb) to anon, authenticated, public, service_role;
revoke all on function public.refresh_invoice_status(uuid) from public, anon, authenticated, service_role;
grant execute on function public.refresh_invoice_status(uuid) to anon, authenticated, public, service_role;
revoke all on function public.resolved_sell_price(numeric,numeric,numeric,numeric,text) from public, anon, authenticated, service_role;
grant execute on function public.resolved_sell_price(numeric,numeric,numeric,numeric,text) to anon, authenticated, service_role;
revoke all on function public.respond_quotation(uuid,text,text) from public, anon, authenticated, service_role;
grant execute on function public.respond_quotation(uuid,text,text) to anon, authenticated, service_role;
revoke all on function public.set_updated_at() from public, anon, authenticated, service_role;
grant execute on function public.set_updated_at() to anon, authenticated, public, service_role;
revoke all on function public.track_order_status() from public, anon, authenticated, service_role;
grant execute on function public.track_order_status() to anon, authenticated, public, service_role;
revoke all on function public.write_audit() from public, anon, authenticated, service_role;
grant execute on function public.write_audit() to anon, authenticated, public, service_role;
revoke all on function public.write_catalogue_access_audit() from public, anon, authenticated, service_role;
grant execute on function public.write_catalogue_access_audit() to anon, authenticated, public, service_role;
revoke all on function public.write_catalogue_exclusion_audit() from public, anon, authenticated, service_role;
grant execute on function public.write_catalogue_exclusion_audit() to anon, authenticated, public, service_role;


-- ======================================================================
-- 16. Comments
-- ======================================================================

comment on column public.campaign_products.pack_option is 'When set, groups auto-generated budget pack choices for client comparison (A/B/C).';
comment on column public.campaign_products.pack_kit_id is 'Groups multiple products into one budget pack option (A/B/C).';
comment on column public.campaign_products.pack_kit_role is 'primary = client-facing kit card & shortlist target; line = included item.';
comment on column public.campaign_products.pack_kit_total is 'On primary kit row only: combined per-person price for the whole kit.';
comment on column public.campaigns.company_id is 'Primary company for sell-price defaults and legacy joins. Null means the catalog is not assigned yet. Company access is catalog_assignments.';
comment on column public.campaigns.cloned_from is 'Source campaigns.id when this catalog was duplicated. Null for catalogs created from scratch.';
comment on table public.catalog_assignments is 'Companies a catalog (campaigns row) is shared with. Portal lists are driven by this table plus legacy campaigns.company_id.';
comment on table public.catalog_share_links is 'Public read tokens for one catalog. Anon cannot select this table. get_shared_catalog(token) returns client-facing fields only.';
comment on column public.companies.margin_percent is 'Company-specific sell margin %. Overrides product and channel defaults for B2B.';
comment on column public.companies.allowed_email_domains is 'If non-empty, portal client emails must be on one of these domains (e.g. acme.com).';
comment on column public.companies.portal_slug is 'Lowercase host label for the company portal. Null means the company uses the main site.';
comment on column public.companies.portal_status is 'Portal access lifecycle: trial|active|suspended|cancelled. Independent of CRM sales status.';
comment on column public.companies.trial_ends_at is 'When portal_status=trial, portal access ends after this timestamp.';
comment on column public.companies.subdomain_status is 'Hostinger subdomain provisioning state for portal_slug.';
comment on column public.companies.subdomain_attempts is 'Number of subdomain provisioning attempts.';
comment on column public.companies.subdomain_last_error is 'Last subdomain provisioning error message.';
comment on column public.companies.subdomain_updated_at is 'When subdomain provisioning fields last changed.';
comment on table public.company_product_exclusions is 'Per-company hides for catalogue products. Subtracted from client_products after all/selected grant rules.';
comment on column public.org_settings.default_margin_percent is 'Fallback margin % when channel/company/product margins are unset.';
comment on column public.org_settings.b2c_margin_percent is 'Default margin % for public retail (B2C) catalogue pricing.';
comment on column public.org_settings.b2b_margin_percent is 'Default margin % for corporate (B2B) when company has no margin_percent.';
comment on table public.portal_host_runs is 'Worker/reconcile run log for portal host provisioning.';
comment on table public.portal_hosts is 'Hostinger parked-domain provisioning queue. One row per hostname (active until removed).';
comment on table public.product_supplier_offers is 'Staff-only supplier offers for one product. Clients cannot select this table. Pin is_preferred to override the cheapest eligible offer.';
comment on table public.quotation_item_costs is 'Staff-only negotiated cost for a quotation line. Not readable by portal clients.';
comment on column public.quotation_items.client_response is 'Portal decision for this line: accepted, rejected, or null before the client responds.';
comment on column public.requirement_products.quantity is 'Units of this SKU requested or quoted. Defaults to 1.';
comment on column public.requirements.campaign_id is 'Catalog (campaigns.id) this requirement was requested from. Null for requirements that did not start from a catalog.';
comment on table public.slug_history is 'Previously used portal slugs. Rows with released_at null or within 30 days remain reserved.';

comment on function public.client_respond_quotation(uuid,text,text,uuid[]) is 'Portal accept/reject. Reject marks every line rejected and does not create an order. Accept marks the given lines (or every line when ids are null), then creates an order for those lines only at the quoted price and quantity. Header discount and tax percents apply to the accepted subtotal. Order status is created.';
comment on function public.get_shared_catalog(text) is 'Public catalog read by share token. Returns name, occasion, budget, published client sell prices, product id, and sku. No supplier cost, margin, or other catalogs.';
comment on function public.resolved_sell_price(numeric,numeric,numeric,numeric,text) is 'Sell price from cost + margin hierarchy. Falls back to list price when cost/margin missing.';


-- ======================================================================
-- 17. Storage buckets (3) — bucket definitions only, not the files inside them
-- ======================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('company-logos', 'company-logos', true, 2097152, '{image/png,image/jpeg,image/webp,image/svg+xml}') on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('mockups', 'mockups', false, 10485760, '{image/png,image/jpeg,image/webp,application/pdf}') on conflict (id) do nothing;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('product-images', 'product-images', true, 5242880, '{image/png,image/jpeg,image/webp}') on conflict (id) do nothing;


-- ======================================================================
-- 18. Storage RLS policies on storage.objects (11)
-- ======================================================================

create policy company_logos_internal_delete on storage.objects as permissive for delete to public
  using (((bucket_id = 'company-logos'::text) AND public.is_internal()));

create policy company_logos_internal_update on storage.objects as permissive for update to public
  using (((bucket_id = 'company-logos'::text) AND public.is_internal()));

create policy company_logos_internal_write on storage.objects as permissive for insert to public
  with check (((bucket_id = 'company-logos'::text) AND public.is_internal()));

create policy company_logos_public_read on storage.objects as permissive for select to public
  using ((bucket_id = 'company-logos'::text));

create policy mockups_storage_delete on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'mockups'::text) AND (public.can_sales() OR public.is_admin())));

create policy mockups_storage_insert on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'mockups'::text) AND public.can_sales()));

create policy mockups_storage_select on storage.objects as permissive for select to authenticated
  using (((bucket_id = 'mockups'::text) AND (public.can_sales() OR public.can_ops() OR public.is_admin())));

create policy product_images_internal_delete on storage.objects as permissive for delete to public
  using (((bucket_id = 'product-images'::text) AND public.is_internal()));

create policy product_images_internal_update on storage.objects as permissive for update to public
  using (((bucket_id = 'product-images'::text) AND public.is_internal()));

create policy product_images_internal_write on storage.objects as permissive for insert to public
  with check (((bucket_id = 'product-images'::text) AND public.is_internal()));

create policy product_images_public_read on storage.objects as permissive for select to public
  using ((bucket_id = 'product-images'::text));
