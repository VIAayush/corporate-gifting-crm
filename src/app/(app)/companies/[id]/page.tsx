import Link from "next/link";
import { createBranch, updateCompany } from "@/app/(app)/actions";
import { PageHeader, ErrorText } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { requirePath } from "@/lib/auth";
import { canWriteCrm } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function CompanyDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await requirePath("/companies");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: company } = await supabase.from("companies").select("*, owner:profiles(full_name)").eq("id", id).single();
  if (!company) return <p>Company not found.</p>;
  const [{ data: branches }, { data: contacts }, { data: leads }, { data: requirements }, { data: quotations }, { data: orders }, { data: owners }] = await Promise.all([
    supabase.from("branches").select("*").eq("company_id", id),
    supabase.from("contacts").select("*").eq("company_id", id),
    supabase.from("leads").select("id, stage, estimated_value").eq("company_id", id),
    supabase.from("requirements").select("id, name, status, deadline").eq("company_id", id),
    supabase.from("quotations").select("id, quotation_number, status, total").eq("company_id", id),
    supabase.from("orders").select("id, order_number, status, order_value").eq("company_id", id),
    supabase.from("profiles").select("id, full_name"),
  ]);
  const writable = canWriteCrm(profile.role);

  return (
    <div>
      <PageHeader title={company.name} description={`${company.industry || "—"} · ${[company.city, company.state, company.country].filter(Boolean).join(", ")}`} />
      <ErrorText message={sp.error} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent>
            {writable ? (
              <form action={updateCompany} className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="id" value={company.id} />
                <div className="space-y-1"><Label>Name</Label><Input name="name" defaultValue={company.name} required /></div>
                <div className="space-y-1"><Label>Industry</Label><Input name="industry" defaultValue={company.industry ?? ""} /></div>
                <div className="space-y-1"><Label>Website</Label><Input name="website" defaultValue={company.website ?? ""} /></div>
                <div className="space-y-1"><Label>City</Label><Input name="city" defaultValue={company.city ?? ""} /></div>
                <div className="space-y-1"><Label>State</Label><Input name="state" defaultValue={company.state ?? ""} /></div>
                <div className="space-y-1"><Label>Country</Label><Input name="country" defaultValue={company.country ?? ""} /></div>
                <div className="sm:col-span-2 space-y-1"><Label>Address</Label><Input name="address" defaultValue={company.address ?? ""} /></div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={company.status}>
                    <option value="prospect">Prospect</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Owner</Label>
                  <Select name="owner_id" defaultValue={company.owner_id ?? ""}>
                    {(owners ?? []).map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                  </Select>
                </div>
                <div className="sm:col-span-2 space-y-1"><Label>Notes</Label><Textarea name="notes" defaultValue={company.notes ?? ""} /></div>
                <Button type="submit">Save</Button>
              </form>
            ) : (
              <p className="text-sm text-muted-foreground">Created {formatDate(company.created_at)} · Owner {(company.owner as { full_name?: string } | null)?.full_name}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Branches</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(branches ?? []).map((b) => (
              <div key={b.id} className="rounded-md border border-border px-3 py-2">
                <div className="font-medium">{b.name} {b.is_head_office ? <Badge>HQ</Badge> : null}</div>
                <div className="text-muted-foreground">{b.city}</div>
              </div>
            ))}
            {writable ? (
              <form action={createBranch} className="space-y-2 pt-2">
                <input type="hidden" name="company_id" value={id} />
                <Input name="name" placeholder="Branch name" required />
                <Input name="city" placeholder="City" />
                <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="is_head_office" /> Head office</label>
                <Button size="sm" type="submit">Add branch</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Related title="Contacts" rows={(contacts ?? []).map((c) => ({ href: `/contacts/${c.id}`, title: c.full_name, meta: c.designation, status: c.contact_type }))} />
        <Related title="Leads" rows={(leads ?? []).map((l) => ({ href: `/leads/${l.id}`, title: titleCase(l.stage), meta: formatMoney(l.estimated_value), status: l.stage }))} />
        <Related title="Requirements" rows={(requirements ?? []).map((r) => ({ href: `/requirements/${r.id}`, title: r.name, meta: formatDate(r.deadline), status: r.status }))} />
        <Related title="Quotations" rows={(quotations ?? []).map((q) => ({ href: `/quotations/${q.id}`, title: q.quotation_number, meta: formatMoney(q.total), status: q.status }))} />
        <Related title="Orders" rows={(orders ?? []).map((o) => ({ href: `/orders/${o.id}`, title: o.order_number, meta: formatMoney(o.order_value), status: o.status }))} />
      </div>
    </div>
  );
}

function Related({ title, rows }: { title: string; rows: { href: string; title: string; meta?: string; status: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {!rows.length ? <p className="text-sm text-muted-foreground">None yet.</p> : null}
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className="flex items-center justify-between rounded-md px-1 py-1 hover:bg-muted/50">
            <div>
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.meta}</div>
            </div>
            <Badge tone={statusTone(r.status)}>{titleCase(r.status)}</Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
