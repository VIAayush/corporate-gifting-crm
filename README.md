# Oaklane

Oaklane is a B2B corporate gifting CRM/ERP. It takes a customer from the first sales enquiry through requirement, quotation, order, fulfilment, invoice, and payment — in one workspace.

This is an original product. It is not a clone of any existing gifting CRM.

## Features

- Email/password authentication (Supabase Auth)
- Role-based access: Admin, Sales, Operations, Accounts, Management
- Companies, branches, contacts
- Lead pipeline with stage history and a rule that Hot/Client leads cannot move backward unless Admin or Management
- Requirements with product lines and mockup uploads
- Product catalogue with category, brand, supplier, and status filters
- Quotations with line items, tax/discount totals, printable view, accept/reject, convert to order
- Orders with operations assignment, vendors, delivery, and timeline
- Suppliers, printing vendors, courier partners
- Invoices, payments, receivables (outstanding = invoiced − received)
- Activities / follow-ups
- Dashboard that answers “what needs my attention today?”
- Reports, team roles, audit log
- Demo data so the app is usable immediately

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS
- Supabase Postgres, Auth, Storage, and Row Level Security
- Server Actions for mutations; RLS as the authorization source of truth

## Architecture

```
Browser  →  Next.js (middleware session)  →  Server Actions / RSC
                 │
                 └── Supabase (Auth JWT)
                        ├── Postgres + RLS
                        └── Storage (private mockups bucket)
```

Room is left for later work: an AI sales assistant that parses enquiry text, an order risk engine, and margin intelligence (revenue minus supplier/print/courier/discount). Those are not in this MVP.

## Local setup

1. Clone the repository.
2. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `npm install`
4. `npm run dev` — app at [http://localhost:43147](http://localhost:43147)

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key (safe for the browser; RLS still applies) |

Do not commit service role keys.

## Database setup

SQL lives in `supabase/migrations/`. Apply it with the Supabase SQL editor, CLI, or MCP `apply_migration`.

Then load `supabase/seed.sql` and `supabase/seed_part2.sql` for demo records. Demo users are created in `auth.users` (see seed notes in this README).

The live project used for this MVP:

- Supabase project ref: `ajysowosgjaipczrwpfv`
- Region: `ap-south-1`
- URL: `https://ajysowosgjaipczrwpfv.supabase.co`

## Seed data

Fictional Indian accounts only (Helios Digital, Nimbus Hospitals, Cedar Bank, Orbit Mobility, Pinnacle Foods). No real personal data.

Includes ~5 companies, 8 contacts, 7 leads, 4 requirements, 15 products, 4 suppliers, 3 printers, 3 couriers, 3 quotations, 2 orders, 2 invoices, 12 activities.

## Roles

| Role | Access |
| --- | --- |
| Admin | Everything, including team and settings |
| Sales | Companies, contacts, leads, requirements, products, mockups, quotations, activities, read orders |
| Operations | Orders, suppliers, printers, couriers, delivery; read related requirements |
| Accounts | Invoices, payments, receivables |
| Management | Dashboard, reports, read orders/revenue/pipeline, audit log |

Permissions are checked in Postgres RLS and again in server actions.

## Demo access

Password for all demo users: `Oaklane-Demo-2026!`

| Email | Role |
| --- | --- |
| admin@oaklane.demo | Admin |
| sales@oaklane.demo | Sales |
| ops@oaklane.demo | Operations |
| accounts@oaklane.demo | Accounts |
| management@oaklane.demo | Management |

## Tests

```bash
npm test
```

Signs in as each role against the live database and checks read/write restrictions plus outstanding-balance math.

## Deployment

Production-style Node hosting: `npm run build` then `npm start` (port 43147).

The verified live demo for this environment:

https://discipline-baseball-cst-amenities.trycloudflare.com

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` on the host. Add the production origin to Supabase Auth redirect URLs.

## Repository

Source: [https://github.com/VIAayush/corporate-gifting-crm](https://github.com/VIAayush/corporate-gifting-crm)
