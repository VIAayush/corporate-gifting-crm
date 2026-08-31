import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const password = "Oaklane-Demo-2026!";

async function session(email) {
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email}: ${error.message}`);
  return client;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const results = [];

try {
  const admin = await session("admin@oaklane.demo");
  const { data: companies, error: cErr } = await admin.from("companies").select("id, name");
  assert(!cErr && companies?.length >= 3, "Admin should read companies");
  results.push("admin reads companies");

  const { data: audit } = await admin.from("audit_logs").select("id").limit(1);
  assert(audit, "Admin should read audit log");
  results.push("admin reads audit");

  const sales = await session("sales@oaklane.demo");
  const { data: salesCompanies } = await sales.from("companies").select("id");
  assert((salesCompanies?.length || 0) > 0, "Sales should read CRM");
  const { error: invErr } = await sales.from("invoices").insert({
    invoice_number: "SHOULD-FAIL",
    order_id: "bb000000-0000-4000-8000-000000000002",
    company_id: "c1000000-0000-4000-8000-000000000001",
    due_date: "2099-01-01",
    amount: 10,
  });
  assert(!!invErr, "Sales must not create invoices");
  results.push("sales blocked from invoices");

  const { error: leadBack } = await sales
    .from("leads")
    .update({ stage: "cold" })
    .eq("id", "e1000000-0000-4000-8000-000000000001");
  assert(!!leadBack, "Sales cannot regress a hot lead");
  results.push("hot lead regression blocked");

  const ops = await session("ops@oaklane.demo");
  const { data: opsOrders } = await ops.from("orders").select("id");
  assert((opsOrders?.length || 0) > 0, "Ops should read orders");
  const { error: companyWrite } = await ops.from("companies").insert({ name: "Should Fail Ltd" });
  assert(!!companyWrite, "Ops must not create companies");
  results.push("ops blocked from CRM writes");

  const accounts = await session("accounts@oaklane.demo");
  const { data: invoices } = await accounts.from("invoices").select("id, amount, status");
  assert((invoices?.length || 0) >= 1, "Accounts should read invoices");
  const { data: pays } = await accounts.from("payments").select("invoice_id, amount");
  const paid = new Map();
  for (const p of pays ?? []) paid.set(p.invoice_id, (paid.get(p.invoice_id) || 0) + Number(p.amount));
  for (const inv of invoices ?? []) {
    const rec = paid.get(inv.id) || 0;
    const outstanding = Number(inv.amount) - rec;
    assert(outstanding >= 0, "Outstanding cannot be negative");
  }
  results.push("outstanding balances consistent");

  const { data: leadsAsAccounts, error: leadReadErr } = await accounts.from("leads").select("id");
  assert(!leadReadErr && (leadsAsAccounts?.length || 0) === 0, "Accounts should not see leads");
  results.push("accounts cannot read leads");

  const mgmt = await session("management@oaklane.demo");
  const { data: mgmtOrders } = await mgmt.from("orders").select("id");
  assert((mgmtOrders?.length || 0) > 0, "Management can read orders");
  const { data: mgmtUpdated, error: mgmtWrite } = await mgmt
    .from("orders")
    .update({ notes: "nope" })
    .eq("id", "bb000000-0000-4000-8000-000000000001")
    .select("id");
  assert(!!mgmtWrite || !mgmtUpdated?.length, "Management cannot update orders");
  results.push("management read-only on orders");

  console.log("OK");
  for (const r of results) console.log(" -", r);
} catch (e) {
  console.error("FAIL", e.message);
  process.exit(1);
}
