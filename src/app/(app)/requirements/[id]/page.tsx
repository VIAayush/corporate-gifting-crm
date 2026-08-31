import { addRequirementProduct, updateRequirement } from "@/app/(app)/actions";
import { createQuotation } from "@/app/(app)/sales-actions";
import { MockupUploader } from "@/components/mockup-uploader";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteCrm, canWriteSales } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, titleCase } from "@/lib/utils";

export default async function RequirementDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/requirements");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: req } = await supabase.from("requirements").select("*, company:companies(name)").eq("id", id).single();
  if (!req) return <p>Requirement not found.</p>;
  const [{ data: lines }, { data: products }, { data: mockups }, { data: quotes }, { data: owners }] = await Promise.all([
    supabase.from("requirement_products").select("*, product:products(name, price)").eq("requirement_id", id),
    supabase.from("products").select("id, name, price").eq("status", "active").order("name"),
    supabase.from("mockups").select("*").eq("requirement_id", id),
    supabase.from("quotations").select("id, quotation_number, status, total").eq("requirement_id", id),
    supabase.from("profiles").select("id, full_name"),
  ]);
  const writable = canWriteCrm(profile.role);
  return (
    <div>
      <PageHeader title={req.name} description={`${(req.company as { name?: string } | null)?.name} · ${req.delivery_city || "No city"}`} />
      <ErrorText message={sp.error} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <form action={updateRequirement} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={id} />
              <div className="sm:col-span-2 space-y-1"><Label>Name</Label><Input name="name" defaultValue={req.name} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Quantity</Label><Input name="quantity" type="number" min="1" defaultValue={req.quantity} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Budget</Label><Input name="budget" type="number" defaultValue={req.budget ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Deadline</Label><Input name="deadline" type="date" defaultValue={req.deadline ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Delivery city</Label><Input name="delivery_city" defaultValue={req.delivery_city ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Purpose</Label><Input name="purpose" defaultValue={req.purpose ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Payment terms</Label><Input name="payment_terms" defaultValue={req.payment_terms ?? ""} disabled={!writable} /></div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select name="status" defaultValue={req.status} disabled={!writable}>
                  {["draft", "active", "quoted", "won", "lost", "closed"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Owner</Label>
                <Select name="owner_id" defaultValue={req.owner_id ?? ""} disabled={!writable}>
                  {(owners ?? []).map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                </Select>
              </div>
              <div className="sm:col-span-2"><Textarea name="description" defaultValue={req.description ?? ""} disabled={!writable} /></div>
              {writable ? <Button type="submit">Save</Button> : null}
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quotations</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(quotes ?? []).map((q) => (
              <a key={q.id} href={`/quotations/${q.id}`} className="flex justify-between hover:underline">
                <span>{q.quotation_number}</span>
                <Badge tone={statusTone(q.status)}>{titleCase(q.status)}</Badge>
              </a>
            ))}
            {canWriteSales(profile.role) ? (
              <form action={createQuotation}>
                <input type="hidden" name="requirement_id" value={id} />
                <Button size="sm" type="submit">Create quotation from products</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle>Products</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <THead><TR><TH>Product</TH><TH>Qty</TH><TH>List price</TH></TR></THead>
            <TBody>
              {(lines ?? []).map((l) => (
                <TR key={l.id}>
                  <TD>{(l.product as { name?: string } | null)?.name}</TD>
                  <TD>{l.quantity}</TD>
                  <TD>{formatMoney((l.product as { price?: number } | null)?.price)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          {canWriteSales(profile.role) ? (
            <form action={addRequirementProduct} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="requirement_id" value={id} />
              <Select name="product_id" required>
                <option value="">Add product</option>
                {(products ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Input name="quantity" type="number" min="1" defaultValue={req.quantity} className="w-24" />
              <Button type="submit" size="sm">Add</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
      {["admin", "sales", "operations"].includes(profile.role) ? (
        <Card className="mt-4">
          <CardHeader><CardTitle>Mockups</CardTitle></CardHeader>
          <CardContent>
            <ul className="mb-3 space-y-1 text-sm">
              {(mockups ?? []).map((m) => <li key={m.id}>{m.file_name} · {(m.file_size_bytes / 1024).toFixed(0)} KB</li>)}
            </ul>
            {canWriteSales(profile.role) ? <MockupUploader requirementId={id} /> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
