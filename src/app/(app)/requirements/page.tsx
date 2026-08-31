import Link from "next/link";
import { createRequirement } from "@/app/(app)/actions";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteCrm } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function RequirementsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string }> }) {
  const { profile } = await requirePath("/requirements");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const supabase = await createClient();
  let query = supabase.from("requirements").select("id, name, status, quantity, budget, deadline, delivery_city, company:companies(name)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  const { data, count, error } = await query;
  const { data: companies } = await supabase.from("companies").select("id, name");
  const { data: contacts } = await supabase.from("contacts").select("id, full_name");
  return (
    <div>
      <PageHeader title="Requirements" description="The actual customer need — quantity, budget, city, and deadline." />
      <ErrorText message={sp.error || error?.message} />
      <FilterBar action="/requirements" q={sp.q}>
        <Select name="status" defaultValue={sp.status || ""}>
          <option value="">All statuses</option>
          {["draft", "active", "quoted", "won", "lost", "closed"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
      </FilterBar>
      {canWriteCrm(profile.role) ? (
        <details className="mb-4 rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Add requirement</summary>
          <form action={createRequirement} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1"><Label>Name</Label><Input name="name" required /></div>
            <div className="space-y-1"><Label>Company</Label><Select name="company_id" required><option value="">Select</option>{(companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="space-y-1"><Label>Contact</Label><Select name="contact_id"><option value="">Optional</option>{(contacts ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}</Select></div>
            <div className="space-y-1"><Label>Quantity</Label><Input name="quantity" type="number" min="1" defaultValue={1} /></div>
            <div className="space-y-1"><Label>Budget</Label><Input name="budget" type="number" min="0" /></div>
            <div className="space-y-1"><Label>Deadline</Label><Input name="deadline" type="date" /></div>
            <div className="space-y-1"><Label>Delivery city</Label><Input name="delivery_city" /></div>
            <div className="space-y-1"><Label>Purpose</Label><Input name="purpose" /></div>
            <div className="space-y-1"><Label>Payment terms</Label><Input name="payment_terms" /></div>
            <div className="sm:col-span-2"><Textarea name="description" placeholder="Description" /></div>
            <Button type="submit">Create</Button>
          </form>
        </details>
      ) : null}
      {!data?.length ? <EmptyState title="No requirements" body="Turn a conversation into a concrete brief." /> : (
        <Table>
          <THead><TR><TH>Name</TH><TH>Company</TH><TH>Qty</TH><TH>Budget</TH><TH>Deadline</TH><TH>Status</TH></TR></THead>
          <TBody>
            {data.map((r) => (
              <TR key={r.id}>
                <TD><Link className="font-medium hover:underline" href={`/requirements/${r.id}`}>{r.name}</Link></TD>
                <TD>{(r.company as { name?: string } | null)?.name}</TD>
                <TD>{r.quantity}</TD>
                <TD>{formatMoney(r.budget)}</TD>
                <TD>{formatDate(r.deadline)}</TD>
                <TD><Badge tone={statusTone(r.status)}>{titleCase(r.status)}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={20} total={count ?? 0} href={(p) => `/requirements?page=${p}&q=${sp.q ?? ""}&status=${sp.status ?? ""}`} />
    </div>
  );
}
