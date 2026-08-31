import { updateProduct } from "@/app/(app)/actions";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { requirePath } from "@/lib/auth";
import { canWriteSales } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, titleCase } from "@/lib/utils";

export default async function ProductDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/products");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("*").eq("id", id).single();
  if (!product) return <p>Product not found.</p>;
  const [{ data: variants }, { data: categories }, { data: brands }, { data: suppliers }] = await Promise.all([
    supabase.from("product_variants").select("*").eq("product_id", id),
    supabase.from("categories").select("id, name"),
    supabase.from("brands").select("id, name"),
    supabase.from("suppliers").select("id, name"),
  ]);
  const writable = canWriteSales(profile.role);
  return (
    <div>
      <PageHeader title={product.name} description={formatMoney(product.price)} action={<Badge tone={statusTone(product.status)}>{titleCase(product.status)}</Badge>} />
      <ErrorText message={sp.error} />
      <Card>
        <CardContent className="pt-5">
          <form action={updateProduct} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={id} />
            <div className="space-y-1"><Label>Name</Label><Input name="name" defaultValue={product.name} disabled={!writable} /></div>
            <div className="space-y-1"><Label>Price</Label><Input name="price" type="number" defaultValue={product.price} disabled={!writable} /></div>
            <div className="space-y-1"><Label>MOQ</Label><Input name="moq" type="number" defaultValue={product.moq} disabled={!writable} /></div>
            <div className="space-y-1"><Label>HSN</Label><Input name="hsn_code" defaultValue={product.hsn_code ?? ""} disabled={!writable} /></div>
            <div className="space-y-1"><Label>Category</Label><Select name="category_id" defaultValue={product.category_id ?? ""} disabled={!writable}><option value="">None</option>{(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="space-y-1"><Label>Brand</Label><Select name="brand_id" defaultValue={product.brand_id ?? ""} disabled={!writable}><option value="">None</option>{(brands ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="space-y-1"><Label>Supplier</Label><Select name="supplier_id" defaultValue={product.supplier_id ?? ""} disabled={!writable}><option value="">None</option>{(suppliers ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
            <div className="space-y-1"><Label>Status</Label><Select name="status" defaultValue={product.status} disabled={!writable}><option value="active">Active</option><option value="discontinued">Discontinued</option></Select></div>
            <div className="sm:col-span-2"><Textarea name="description" defaultValue={product.description ?? ""} disabled={!writable} /></div>
            {writable ? <Button type="submit">Save</Button> : null}
          </form>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader><CardTitle>Variants</CardTitle></CardHeader>
        <CardContent className="text-sm">
          {(variants ?? []).map((v) => (
            <div key={v.id} className="border-b border-border py-2">{[v.colour, v.size, v.gender, v.material, v.sku].filter(Boolean).join(" · ")}</div>
          ))}
          {!variants?.length ? <p className="text-muted-foreground">No variants.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
