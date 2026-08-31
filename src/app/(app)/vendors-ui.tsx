import { createSupplier, createPrintingVendor, createCourier } from "@/app/(app)/actions";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteOps } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export default async function VendorsPage({
  title,
  path,
  table,
  action,
  extra,
  searchParams,
}: {
  title: string;
  path: "/suppliers" | "/printing-vendors" | "/couriers";
  table: "suppliers" | "printing_vendors" | "courier_partners";
  action: (formData: FormData) => Promise<void>;
  extra?: "supplier";
  searchParams: { q?: string; page?: string; error?: string };
}) {
  const { profile } = await requirePath(path);
  const page = Math.max(1, Number(searchParams.page || 1));
  const supabase = await createClient();
  let query = supabase.from(table).select("*", { count: "exact" }).order("name").range((page - 1) * 20, page * 20 - 1);
  if (searchParams.q) query = query.ilike("name", `%${searchParams.q}%`);
  const { data, count, error } = await query;
  return (
    <div>
      <PageHeader title={title} description="Keep vendor records basic: who to call, and whether they are active." />
      <ErrorText message={searchParams.error || error?.message} />
      <FilterBar action={path} q={searchParams.q} />
      {canWriteOps(profile.role) ? (
        <details className="mb-4 rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Add</summary>
          <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Name</Label><Input name="name" required /></div>
            <div className="space-y-1"><Label>Contact</Label><Input name="contact_person" /></div>
            <div className="space-y-1"><Label>Email</Label><Input name="email" type="email" /></div>
            <div className="space-y-1"><Label>Phone</Label><Input name="phone" /></div>
            {extra === "supplier" ? (
              <>
                <div className="space-y-1"><Label>City</Label><Input name="city" /></div>
                <div className="space-y-1"><Label>Category</Label><Input name="category" /></div>
                <div className="space-y-1"><Label>Credit period (days)</Label><Input name="credit_period_days" type="number" min="0" defaultValue={0} /></div>
              </>
            ) : (
              <div className="space-y-1"><Label>Service type</Label><Input name="service_type" /></div>
            )}
            <div className="sm:col-span-2"><Textarea name="notes" placeholder="Notes" /></div>
            <Button type="submit">Save</Button>
          </form>
        </details>
      ) : null}
      {!data?.length ? <EmptyState title="None yet" body="Add a vendor when you start using them on orders." /> : (
        <Table>
          <THead><TR><TH>Name</TH><TH>Contact</TH><TH>Phone</TH><TH>Email</TH><TH>Status</TH></TR></THead>
          <TBody>
            {data.map((v: { id: string; name: string; contact_person?: string; phone?: string; email?: string; is_active?: boolean }) => (
              <TR key={v.id}>
                <TD className="font-medium">{v.name}</TD>
                <TD>{v.contact_person || "—"}</TD>
                <TD>{v.phone || "—"}</TD>
                <TD>{v.email || "—"}</TD>
                <TD><Badge>{v.is_active === false ? "Inactive" : "Active"}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={20} total={count ?? 0} href={(p) => `${path}?page=${p}&q=${searchParams.q ?? ""}`} />
    </div>
  );
}

export async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string }> }) {
  return <VendorsPage title="Suppliers" path="/suppliers" table="suppliers" action={createSupplier} extra="supplier" searchParams={await searchParams} />;
}
export async function PrintingPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string }> }) {
  return <VendorsPage title="Printing vendors" path="/printing-vendors" table="printing_vendors" action={createPrintingVendor} searchParams={await searchParams} />;
}
export async function CouriersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string; error?: string }> }) {
  return <VendorsPage title="Courier partners" path="/couriers" table="courier_partners" action={createCourier} searchParams={await searchParams} />;
}
