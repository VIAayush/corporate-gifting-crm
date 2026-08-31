import Link from "next/link";
import { createContact } from "@/app/(app)/actions";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteCrm } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { titleCase } from "@/lib/utils";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string }> }) {
  const { profile } = await requirePath("/contacts");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const supabase = await createClient();
  let query = supabase.from("contacts").select("id, full_name, designation, email, phone, contact_type, company:companies(name)", { count: "exact" }).order("full_name").range((page - 1) * 20, page * 20 - 1);
  if (sp.q) query = query.or(`full_name.ilike.%${sp.q}%,email.ilike.%${sp.q}%`);
  const { data, count, error } = await query;
  const { data: companies } = await supabase.from("companies").select("id, name").order("name");
  return (
    <div>
      <PageHeader title="Contacts" description="People at customer accounts." />
      <ErrorText message={sp.error || error?.message} />
      <FilterBar action="/contacts" q={sp.q} />
      {canWriteCrm(profile.role) ? (
        <details className="mb-4 rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Add contact</summary>
          <form action={createContact} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Name</Label><Input name="full_name" required /></div>
            <div className="space-y-1"><Label>Designation</Label><Input name="designation" /></div>
            <div className="space-y-1"><Label>Email</Label><Input name="email" type="email" /></div>
            <div className="space-y-1"><Label>Phone</Label><Input name="phone" /></div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Select name="company_id" required>
                <option value="">Select</option>
                {(companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select name="contact_type" defaultValue="primary">
                <option value="primary">Primary</option>
                <option value="billing">Billing</option>
                <option value="procurement">Procurement</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1"><Label>Notes</Label><Textarea name="notes" /></div>
            <Button type="submit">Create contact</Button>
          </form>
        </details>
      ) : null}
      {!data?.length ? <EmptyState title="No contacts" body="Add a person at a company to start conversations." /> : (
        <Table>
          <THead><TR><TH>Name</TH><TH>Company</TH><TH>Email</TH><TH>Phone</TH><TH>Type</TH></TR></THead>
          <TBody>
            {data.map((c) => (
              <TR key={c.id}>
                <TD><Link className="font-medium hover:underline" href={`/contacts/${c.id}`}>{c.full_name}</Link><div className="text-xs text-muted-foreground">{c.designation}</div></TD>
                <TD>{(c.company as { name?: string } | null)?.name}</TD>
                <TD>{c.email || "—"}</TD>
                <TD>{c.phone || "—"}</TD>
                <TD><Badge>{titleCase(c.contact_type)}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={20} total={count ?? 0} href={(p) => `/contacts?page=${p}&q=${sp.q ?? ""}`} />
    </div>
  );
}
