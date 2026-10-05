-- Point stored image URLs at the NEW Supabase project.
--
-- products.image_url (258 rows) and campaign_products.client_image_url (55 rows)
-- contain full URLs of the old project (https://ajysowosgjaipczrwpfv.supabase.co/...).
-- Run this AFTER 01_database.sql and AFTER upload_storage.mjs:
--
--   psql "<new project connection string>" -v ON_ERROR_STOP=1 \
--        -v new_url=https://<NEW_PROJECT_REF>.supabase.co -f 02_rewrite_storage_urls.sql
--
-- audit_logs keeps the old URLs on purpose: it is a historical record.

\if :{?new_url}
\else
  \echo 'Missing -v new_url=https://<NEW_PROJECT_REF>.supabase.co'
  \quit
\endif

begin;

-- Keep updated_at and the audit log unchanged: this is a migration, not a user edit.
alter table public.products disable trigger user;
alter table public.campaign_products disable trigger user;

update public.products
   set image_url = replace(image_url, 'https://ajysowosgjaipczrwpfv.supabase.co', :'new_url')
 where image_url like 'https://ajysowosgjaipczrwpfv.supabase.co/%';

update public.campaign_products
   set client_image_url = replace(client_image_url, 'https://ajysowosgjaipczrwpfv.supabase.co', :'new_url')
 where client_image_url like 'https://ajysowosgjaipczrwpfv.supabase.co/%';

alter table public.products enable trigger user;
alter table public.campaign_products enable trigger user;

commit;

select
  (select count(*) from public.products where image_url like 'https://ajysowosgjaipczrwpfv.supabase.co/%') as products_still_old,
  (select count(*) from public.campaign_products where client_image_url like 'https://ajysowosgjaipczrwpfv.supabase.co/%') as campaign_products_still_old;
