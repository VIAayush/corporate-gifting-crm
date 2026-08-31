import Link from "next/link";
import { createProduct } from "@/app/(app)/actions";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteSales } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, titleCase } from "@/lib/utils";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; brand?: string; supplier?: string; status?: string; page?: string; error?: string }> }) {
  const { profile } = await requirePath("/products");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const supabase = await createClient();
  let query = supabase.from("products").select("id, name, price, moq, status, category:categories(name), brand:brands(name), supplier:suppliers(name)", { count: "exact" }).order("name").range((page - 1) * 20, page * 20 - 1);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.brand) query = query.eq("brand_id", sp.brand);
  if (sp.supplier) query = query.eq("supplier_id", sp.supplier);
  if (sp.status) query = query.eq("status", sp.status);
  const { data, count, error } = await query;
  const [{ data: categories }, { data: brands }, { data: suppliers }] = await Promise.all([
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("brands").select("id, name").order("name"),
    supabase.from("suppliers").select("id, name").order("name"),
  ]);
  return (
    <div>
      <PageHeader title="Products" description="Catalogue used on requirements and quotations." />
      <ErrorText message={sp.error || error?.message} />
      <FilterBar action="/products" q={sp.q}>
        <Select name="category" defaultValue={sp.category || ""}>
          <option value="">All categories</option>
          {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select name="brand" defaultValue={sp.brand || ""}>
          <option value="">All brands</option>
          {(brands ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select name="supplier" defaultValue={sp.supplier || ""}>
          <option value="">All suppliers</option>
          {(suppliers ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select name="status" defaultValue={sp.status || ""}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="discontinued">Discontinued</option>
        </Select>
      </FilterBar>
      {canWriteSales(profile.role) ? (
        <details className="mb-4 rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Add product</summary>
          <form action={createProduct} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Name</Label><Input name="name" required /></div>
            <div className="space-y-1"><Label>Price</Label><Input name="price" type="number" min="0" step="0.01" required /></div>
            <div className="space-y-1"><Label>MOQ</Label><Input name="moq" type="number" min="1" defaultValue={1} /></div>
            <div className="space-y-1"><Label>HSN</Label><Input name="hsn_code" /></div>
            <div className="space-y-1"><Label>Category</Label><Select name="category_id"><option value="">None</option>{(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="space-y-1"><Label>Brand</Label><Select name="brand_id"><option value="">None</option>{(brands ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="space-y-1"><Label>Supplier</Label><Select name="supplier_id"><option value="">None</option>{(suppliers ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="sm:col-span-2"><Textarea name="description" placeholder="Description" /></div>
            <Button type="submit">Create product</Button>
          </form>
        </details>
      ) : null}
      {!data?.length ? <EmptyState title="No products" body="Add catalogue items before quoting." /> : (
        <Table>
          <THead><TR><TH>Product</TH><TH>Brand</TH><TH>Category</TH><TH>Supplier</TH><TH>Price</TH><TH>MOQ</TH><TH>Status</TH></TR></THead>
          <TBody>
            {data.map((p) => (
              <TR key={p.id}>
                <TD><Link className="font-medium hover:underline" href={`/products/${p.id}`}>{p.name}</Link></TD>
                <TD>{(p.brand as { name?: string } | null)?.name || "—"}</TD>
                <TD>{(p.category as { name?: string } | null)?.name || "—"}</TD>
                <TD>{(p.supplier as { name?: string } | null)?.name || "—"}</TD>
                <TD>{formatMoney(p.price)}</TD>
                <TD>{p.moq}</TD>
                <TD><Badge tone={statusTone(p.status)}>{titleCase(p.status)}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={20} total={count ?? 0} href={(p) => `/products?page=${p}&q=${sp.q ?? ""}`} />
    </div>
  );
}
