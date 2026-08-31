import Link from "next/link";
import { createQuotation } from "@/app/(app)/sales-actions";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteSales } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function QuotationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string }> }) {
  const { profile } = await requirePath("/quotations");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const supabase = await createClient();
  let query = supabase.from("quotations").select("id, quotation_number, status, total, valid_until, company:companies(name)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.q) query = query.ilike("quotation_number", `%${sp.q}%`);
  const { data, count, error } = await query;
  const { data: requirements } = await supabase.from("requirements").select("id, name").in("status", ["draft", "active", "quoted"]);
  return (
    <div>
      <PageHeader title="Quotations" description="Price a requirement, send it, then convert accepted quotes into orders." />
      <ErrorText message={sp.error || error?.message} />
      <FilterBar action="/quotations" q={sp.q}>
        <Select name="status" defaultValue={sp.status || ""}>
          <option value="">All statuses</option>
          {["draft", "sent", "accepted", "rejected", "expired"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
      </FilterBar>
      {canWriteSales(profile.role) ? (
        <form action={createQuotation} className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-card p-3">
          <div className="space-y-1">
            <Label>From requirement</Label>
            <Select name="requirement_id" required>
              <option value="">Select</option>
              {(requirements ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          </div>
          <Button type="submit">Create quotation</Button>
        </form>
      ) : null}
      {!data?.length ? <EmptyState title="No quotations" body="Create a quotation from a requirement with products attached." /> : (
        <Table>
          <THead><TR><TH>Number</TH><TH>Company</TH><TH>Total</TH><TH>Valid until</TH><TH>Status</TH></TR></THead>
          <TBody>
            {data.map((q) => (
              <TR key={q.id}>
                <TD><Link className="font-medium hover:underline" href={`/quotations/${q.id}`}>{q.quotation_number}</Link></TD>
                <TD>{(q.company as { name?: string } | null)?.name}</TD>
                <TD>{formatMoney(q.total)}</TD>
                <TD>{formatDate(q.valid_until)}</TD>
                <TD><Badge tone={statusTone(q.status)}>{titleCase(q.status)}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={20} total={count ?? 0} href={(p) => `/quotations?page=${p}&q=${sp.q ?? ""}&status=${sp.status ?? ""}`} />
    </div>
  );
}
