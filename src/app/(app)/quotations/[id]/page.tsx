import Link from "next/link";
import { addQuotationItem, convertQuotation, setQuotationStatus, updateQuotationHeader } from "@/app/(app)/sales-actions";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteSales } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, titleCase } from "@/lib/utils";

export default async function QuotationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/quotations");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: q } = await supabase.from("quotations").select("*, company:companies(name), contact:contacts(full_name, email), requirement:requirements(name)").eq("id", id).single();
  if (!q) return <p>Quotation not found.</p>;
  const [{ data: items }, { data: products }, { data: order }] = await Promise.all([
    supabase.from("quotation_items").select("*, product:products(name)").eq("quotation_id", id),
    supabase.from("products").select("id, name, price").eq("status", "active"),
    supabase.from("orders").select("id, order_number").eq("quotation_id", id).maybeSingle(),
  ]);
  const writable = canWriteSales(profile.role) && ["draft", "sent"].includes(q.status);
  return (
    <div>
      <PageHeader
        title={q.quotation_number}
        description={`${(q.company as { name?: string } | null)?.name} · ${(q.requirement as { name?: string } | null)?.name}`}
        action={<Badge tone={statusTone(q.status)}>{titleCase(q.status)}</Badge>}
      />
      <ErrorText message={sp.error} />
      <div className="mb-4 flex flex-wrap gap-2">
        {canWriteSales(profile.role) && q.status === "draft" ? (
          <form action={setQuotationStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="sent" /><Button type="submit">Mark sent</Button></form>
        ) : null}
        {canWriteSales(profile.role) && q.status === "sent" ? (
          <>
            <form action={setQuotationStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="accepted" /><Button type="submit">Accept</Button></form>
            <form action={setQuotationStatus}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="rejected" /><Button variant="destructive" type="submit">Reject</Button></form>
          </>
        ) : null}
        {q.status === "accepted" && !order ? (
          <form action={convertQuotation}><input type="hidden" name="id" value={id} /><Button type="submit">Convert to order</Button></form>
        ) : null}
        {order ? <Link className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm" href={`/orders/${order.id}`}>Order {order.order_number}</Link> : null}
        <Link className="inline-flex h-9 items-center rounded-md border border-border px-3 text-sm" href={`/quotations/${id}/print`}>Printable view</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Line items</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><TR><TH>Item</TH><TH>Qty</TH><TH>Unit</TH><TH>Line</TH></TR></THead>
              <TBody>
                {(items ?? []).map((i) => (
                  <TR key={i.id}>
                    <TD>{i.description || (i.product as { name?: string } | null)?.name}</TD>
                    <TD>{i.quantity}</TD>
                    <TD>{formatMoney(i.unit_price)}</TD>
                    <TD>{formatMoney(i.line_total)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {writable ? (
              <form action={addQuotationItem} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="quotation_id" value={id} />
                <Select name="product_id" required>
                  <option value="">Product</option>
                  {(products ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </Select>
                <Input name="quantity" type="number" min="1" defaultValue={1} className="w-24" />
                <Input name="unit_price" type="number" min="0" step="0.01" placeholder="Price" className="w-32" required />
                <Button size="sm" type="submit">Add line</Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Totals</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(q.subtotal)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{formatMoney(q.discount_amount)}</span></div>
            <div className="flex justify-between"><span>Tax</span><span>{formatMoney(q.tax_amount)}</span></div>
            <div className="flex justify-between font-medium"><span>Total</span><span>{formatMoney(q.total)}</span></div>
            {writable ? (
              <form action={updateQuotationHeader} className="space-y-2 border-t border-border pt-3">
                <input type="hidden" name="id" value={id} />
                <div className="space-y-1"><Label>Discount %</Label><Input name="discount_percent" type="number" defaultValue={q.discount_percent} /></div>
                <div className="space-y-1"><Label>Tax %</Label><Input name="tax_percent" type="number" defaultValue={q.tax_percent} /></div>
                <div className="space-y-1"><Label>Valid until</Label><Input name="valid_until" type="date" defaultValue={q.valid_until ?? ""} /></div>
                <Textarea name="notes" defaultValue={q.notes ?? ""} />
                <Button size="sm" type="submit">Update header</Button>
              </form>
            ) : <p className="text-muted-foreground">{q.notes}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
