# Oaklane

B2B corporate gifting CRM/ERP. Manage a customer from first enquiry through fulfilment, invoice, and payment.

## Stack

Next.js 16, TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Storage, RLS).

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`.

Open http://localhost:3000

## Demo users

Password for all demo users: `Oaklane-Demo-2026!`

- `admin@oaklane.demo` — Admin
- `sales@oaklane.demo` — Sales
- `ops@oaklane.demo` — Operations
- `accounts@oaklane.demo` — Accounts
- `management@oaklane.demo` — Management
- `priya@wipro.example` — Client Admin (Wipro)
- `rahul@nexora.example` — Client Admin (Nexora)

## Deploy

Production (existing Vercel project — do not replace):

https://temporary-instant-tungsten-nd414b4.vercel.app/

Connect this repository to that Vercel project and add the same `NEXT_PUBLIC_*` environment variables used locally.

Repository: https://github.com/VIAayush/corporate-gifting-crm
