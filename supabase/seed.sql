-- Demo data for Oaklane. Fictional companies and people only.

insert into public.categories (id, name) values
  ('a1000000-0000-4000-8000-000000000001', 'Drinkware'),
  ('a1000000-0000-4000-8000-000000000002', 'Apparel'),
  ('a1000000-0000-4000-8000-000000000003', 'Stationery'),
  ('a1000000-0000-4000-8000-000000000004', 'Tech accessories'),
  ('a1000000-0000-4000-8000-000000000005', 'Welcome kits');

insert into public.subcategories (id, category_id, name) values
  ('a2000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Bottles'),
  ('a2000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Mugs'),
  ('a2000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000002', 'T-shirts'),
  ('a2000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000003', 'Notebooks'),
  ('a2000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000004', 'Power banks');

insert into public.brands (id, name) values
  ('a3000000-0000-4000-8000-000000000001', 'Northsteel'),
  ('a3000000-0000-4000-8000-000000000002', 'Cottonline'),
  ('a3000000-0000-4000-8000-000000000003', 'Paperfold'),
  ('a3000000-0000-4000-8000-000000000004', 'Volt & Co');

insert into public.suppliers (id, name, contact_person, email, phone, city, category, credit_period_days, notes, is_active) values
  ('b1000000-0000-4000-8000-000000000001', 'Harbour Metals', 'Sanjay Bhat', 'sanjay.bhat@harbourmetals.example', '+91 98200 11001', 'Mumbai', 'Drinkware', 30, 'Reliable for bottles and flasks.', true),
  ('b1000000-0000-4000-8000-000000000002', 'Loom & Latch', 'Priya Nair', 'priya.nair@loomlatch.example', '+91 98450 22002', 'Tiruppur', 'Apparel', 45, 'MOQ 100 on tees.', true),
  ('b1000000-0000-4000-8000-000000000003', 'Inkforest Press', 'Arun Menon', 'arun.menon@inkforest.example', '+91 80 4112 3303', 'Bengaluru', 'Stationery', 21, 'Offset notebooks and cards.', true),
  ('b1000000-0000-4000-8000-000000000004', 'Circuit Bazaar', 'Leela Krishnan', 'leela.krishnan@circuitbazaar.example', '+91 44 2814 4404', 'Chennai', 'Electronics', 15, 'Power banks and cables.', true);

insert into public.printing_vendors (id, name, contact_person, phone, email, service_type, notes, is_active) values
  ('b2000000-0000-4000-8000-000000000001', 'Emblem Studio', 'Kavya Rao', '+91 98765 10101', 'kavya@emblemstudio.example', 'Embroidery', 'Caps and polos.', true),
  ('b2000000-0000-4000-8000-000000000002', 'Screenright Works', 'Imran Sheikh', '+91 98765 20202', 'imran@screenright.example', 'Screen print', 'Tees and tote bags.', true),
  ('b2000000-0000-4000-8000-000000000003', 'Laserleaf', 'Tanvi Joshi', '+91 98765 30303', 'tanvi@laserleaf.example', 'Laser engraving', 'Flask and mug engraving.', true);

insert into public.courier_partners (id, name, contact_person, phone, email, service_type, notes) values
  ('b3000000-0000-4000-8000-000000000001', 'SwiftCart Logistics', 'Dev Patel', '+91 90000 11111', 'dev@swiftcart.example', 'Pan-India surface', '2-5 day metro.'),
  ('b3000000-0000-4000-8000-000000000002', 'BlueRidge Express', 'Anita Dsouza', '+91 90000 22222', 'anita@blueridge.example', 'Air express', 'Next-day metros.'),
  ('b3000000-0000-4000-8000-000000000003', 'Harbour Last Mile', 'Ritesh Kulkarni', '+91 90000 33333', 'ritesh@harbourlm.example', 'Mumbai local', 'Same-day BKC/Andheri.');

insert into public.companies (id, name, industry, website, address, city, state, country, owner_id, status, notes) values
  ('c1000000-0000-4000-8000-000000000001', 'Helios Digital', 'SaaS', 'https://heliosdigital.example', '14 Galaxy, Andheri East', 'Mumbai', 'Maharashtra', 'India', '22222222-2222-4222-8222-222222222222', 'active', 'Annual welcome kits for new joiners.'),
  ('c1000000-0000-4000-8000-000000000002', 'Nimbus Hospitals', 'Healthcare', 'https://nimbushospitals.example', '88 Health Park, Whitefield', 'Bengaluru', 'Karnataka', 'India', '22222222-2222-4222-8222-222222222222', 'active', 'Doctor conference gifting.'),
  ('c1000000-0000-4000-8000-000000000003', 'Cedar Bank', 'BFSI', 'https://cedarbank.example', 'Cedar Tower, BKC', 'Mumbai', 'Maharashtra', 'India', '11111111-1111-4111-8111-111111111111', 'active', 'Festival hampers for relationship managers.'),
  ('c1000000-0000-4000-8000-000000000004', 'Orbit Mobility', 'Automotive', 'https://orbitmobility.example', 'Plot 12, SIPCOT', 'Chennai', 'Tamil Nadu', 'India', '22222222-2222-4222-8222-222222222222', 'prospect', 'Dealer meet merch.'),
  ('c1000000-0000-4000-8000-000000000005', 'Pinnacle Foods', 'FMCG', 'https://pinnaclefoods.example', 'Salt Lake Sector V', 'Kolkata', 'West Bengal', 'India', '22222222-2222-4222-8222-222222222222', 'inactive', 'Paused after Q1 campaign.');

insert into public.branches (id, company_id, name, address, city, state, is_head_office) values
  ('c2000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'Mumbai HQ', '14 Galaxy, Andheri East', 'Mumbai', 'Maharashtra', true),
  ('c2000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'Pune studio', 'Kalyani Nagar', 'Pune', 'Maharashtra', false),
  ('c2000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000002', 'Whitefield campus', '88 Health Park', 'Bengaluru', 'Karnataka', true),
  ('c2000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000003', 'BKC headquarters', 'Cedar Tower, BKC', 'Mumbai', 'Maharashtra', true);

insert into public.contacts (id, company_id, branch_id, full_name, designation, email, phone, contact_type, notes) values
  ('c3000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 'Anika Shah', 'Head of People', 'anika.shah@heliosdigital.example', '+91 98190 45001', 'primary', 'Prefers email before 10am.'),
  ('c3000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 'Vikram Rao', 'Office manager', 'vikram.rao@heliosdigital.example', '+91 98190 45002', 'procurement', null),
  ('c3000000-0000-4000-8000-000000000003', 'c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'Dr. Sneha Pillai', 'Admin director', 'sneha.pillai@nimbushospitals.example', '+91 98450 66003', 'primary', null),
  ('c3000000-0000-4000-8000-000000000004', 'c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000003', 'Joseph Mathew', 'Purchase', 'joseph.mathew@nimbushospitals.example', '+91 98450 66004', 'billing', null),
  ('c3000000-0000-4000-8000-000000000005', 'c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000004', 'Rhea Banerjee', 'Brand lead', 'rhea.banerjee@cedarbank.example', '+91 98200 77005', 'primary', 'Needs compliance copy on every mockup.'),
  ('c3000000-0000-4000-8000-000000000006', 'c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000004', 'Amit Kulkarni', 'Finance BP', 'amit.kulkarni@cedarbank.example', '+91 98200 77006', 'billing', null),
  ('c3000000-0000-4000-8000-000000000007', 'c1000000-0000-4000-8000-000000000004', null, 'Karthik Subramanian', 'Dealer ops', 'karthik.s@orbitmobility.example', '+91 94440 88007', 'primary', null),
  ('c3000000-0000-4000-8000-000000000008', 'c1000000-0000-4000-8000-000000000005', null, 'Ishita Ghosh', 'Marketing', 'ishita.ghosh@pinnaclefoods.example', '+91 98300 99008', 'other', 'Last active March.');
