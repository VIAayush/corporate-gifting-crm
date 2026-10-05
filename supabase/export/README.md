# Souvenir Gifting Solutions — complete database export

Everything needed to recreate the production Supabase database in another Supabase account:
structure, all data, login accounts and all stored files.

Snapshot of project `corporate-gifting-crm` (`ajysowosgjaipczrwpfv`, PostgreSQL 17.6) taken
on 2026-10-05, after migration `20261005095825`. Every part was checked against the live
database: row counts and primary keys per table, object fingerprints for the schema, and an
MD5 checksum for every stored file.

## What's in this folder

| File | Contents |
|---|---|
| `01_database.sql` | Full schema **and** all data in one file (~5 MB): 53 tables with 4,229 rows, 17 login accounts, 57 functions, 6 views, 40 triggers, RLS with 127 policies, grants, 3 storage buckets with 11 storage policies, and quote/order/invoice numbering positions. |
| `storage/` | All 745 stored files (~255 MB): `product-images/` (741) and `company-logos/` (4). The `mockups` bucket is empty. |
| `storage_manifest.json` | Bucket, path, size, MD5 and content type of every file. |
| `upload_storage.mjs` | Uploads `storage/` into the new project with the same paths. |
| `02_rewrite_storage_urls.sql` | Points product and campaign image URLs at the new project. |

## Restore into a new Supabase project

**You need:** `psql` (PostgreSQL 17 client) and Node.js 18+.

1. **Create a new Supabase project** (Postgres 17) and leave it empty.

2. **Get its connection string:** go to Project → **Connect** → *Session pooler* URI, and fill in the database password.

3. **Load the database.** This runs as one transaction, so it either fully succeeds or changes nothing:
   ```bash
   psql "<connection string>" -v ON_ERROR_STOP=1 -1 -f 01_database.sql
   ```
   Use `psql`, not the Supabase SQL editor; the file is too large for the editor.

4. **Upload the files.** The service-role key is under Project Settings → API:
   ```bash
   NEW_SUPABASE_URL=https://<NEW_PROJECT_REF>.supabase.co NEW_SUPABASE_SERVICE_ROLE_KEY=<service_role key> node upload_storage.mjs
   ```
   It should print `Uploaded 745 of 745 files.`

5. **Rewrite the image URLs** to the new project:
   ```bash
   psql "<connection string>" -v ON_ERROR_STOP=1 -v new_url=https://<NEW_PROJECT_REF>.supabase.co -f 02_rewrite_storage_urls.sql
   ```
   The final check should report `0` and `0`.

6. **Check the restore:**
   ```sql
   select count(*) from public.products;        -- 258
   select count(*) from public.companies;       -- 15
   select count(*) from public.orders;          -- 18
   select count(*) from public.audit_logs;      -- 2733
   select count(*) from auth.users;             -- 17
   select bucket_id, count(*) from storage.objects group by 1;  -- product-images 741, company-logos 4
   ```

## After restoring

- **Passwords are not included.** All 17 accounts exist with their emails and roles, but each user must use **Forgot password** once to set a new password.
- **Authentication settings** (Authentication → URL Configuration): set the Site URL to the app's address and add `<app URL>/auth/confirm` and `<app URL>/reset-password` as redirect URLs.
- **App environment variables:** point the web app at the new project by setting `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to the new project's values. Also set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for password-reset emails.
- **Not used by this project, nothing to recreate:** Edge Functions, cron jobs, database webhooks and Realtime.

## Handle with care

This folder contains customer and staff names, emails and phone numbers. Share it only with
people who should have access to that data. It contains **no** passwords, API keys or tokens.
