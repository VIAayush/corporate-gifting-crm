import Link from "next/link";
import { createCompany } from "@/app/(app)/actions";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { PageHeader, EmptyState, ErrorText } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteCrm } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, titleCase } from "@/lib/utils";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string }>;
}) {
  const { profile } = await requirePath("/companies");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const pageSize = 20;
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select("id, name, industry, city, status, created_at, owner:profiles(full_name)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  if (sp.status) query = query.eq("status", sp.status);
  const { data, count, error } = await query;
  const { data: owners } = await supabase.from("profiles").select("id, full_name").eq("is_active", true);
  const writable = canWriteCrm(profile.role);

  return (
    <div>
      <PageHeader title="Companies" description="Accounts you sell into, with ownership and status." />
      <ErrorText message={sp.error || error?.message} />
      <FilterBar action="/companies" q={sp.q}>
        <Select name="status" defaultValue={sp.status || ""}>
          <option value="">All statuses</option>
          <option value="prospect">Prospect</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </FilterBar>
      {writable ? (
        <details className="mb-4 rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Add company</summary>
          <form action={createCompany} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Company name</Label><Input name="name" required /></div>
            <div className="space-y-1"><Label>Industry</Label><Input name="industry" /></div>
            <div className="space-y-1"><Label>Website</Label><Input name="website" placeholder="https://" /></div>
            <div className="space-y-1"><Label>City</Label><Input name="city" /></div>
            <div className="space-y-1"><Label>State</Label><Input name="state" /></div>
            <div className="space-y-1"><Label>Country</Label><Input name="country" defaultValue="India" /></div>
            <div className="sm:col-span-2 space-y-1"><Label>Address</Label><Input name="address" /></div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select name="status" defaultValue="prospect">
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Owner</Label>
              <Select name="owner_id" defaultValue={profile.id}>
                {(owners ?? []).map((o) => (
                  <option key={o.id} value={o.id}>{o.full_name}</option>
                ))}
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1"><Label>Notes</Label><Textarea name="notes" /></div>
            <Button type="submit">Create company</Button>
          </form>
        </details>
      ) : null}
      {!data?.length ? (
        <EmptyState title="No companies yet" body="Add the first account to start tracking contacts and leads." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH><TH>Industry</TH><TH>City</TH><TH>Owner</TH><TH>Status</TH><TH>Created</TH>
            </TR>
          </THead>
          <TBody>
            {data.map((c) => (
              <TR key={c.id}>
                <TD><Link className="font-medium hover:underline" href={`/companies/${c.id}`}>{c.name}</Link></TD>
                <TD>{c.industry || "—"}</TD>
                <TD>{c.city || "—"}</TD>
                <TD>{(c.owner as { full_name?: string } | null)?.full_name || "—"}</TD>
                <TD><Badge tone={statusTone(c.status)}>{titleCase(c.status)}</Badge></TD>
                <TD>{formatDate(c.created_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={pageSize} total={count ?? 0} href={(p) => `/companies?page=${p}&q=${sp.q ?? ""}&status=${sp.status ?? ""}`} />
    </div>
  );
}
