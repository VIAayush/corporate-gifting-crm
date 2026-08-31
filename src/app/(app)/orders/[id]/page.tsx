import Link from "next/link";
import { updateOrder } from "@/app/(app)/sales-actions";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteOps } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatMoney, titleCase } from "@/lib/utils";

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/orders");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("*, company:companies(name), contact:contacts(full_name, email), quotation:quotations(quotation_number)").eq("id", id).single();
  if (!order) return <p>Order not found.</p>;
  const [{ data: items }, { data: history }, { data: invoice }, { data: people }, { data: suppliers }, { data: printers }, { data: couriers }, { data: activities }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id),
    supabase.from("order_status_history").select("*, changer:profiles(full_name)").eq("order_id", id).order("changed_at", { ascending: false }),
    supabase.from("invoices").select("id, invoice_number, status, amount").eq("order_id", id).maybeSingle(),
    supabase.from("profiles").select("id, full_name, role"),
    supabase.from("suppliers").select("id, name"),
    supabase.from("printing_vendors").select("id, name"),
    supabase.from("courier_partners").select("id, name"),
    supabase.from("activities").select("*").eq("related_id", id),
  ]);
  const writable = canWriteOps(profile.role);
  const { data: payments } = invoice ? await supabase.from("payments").select("amount").eq("invoice_id", invoice.id) : { data: [] };
  const paid = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  return (
    <div>
      <PageHeader title={order.order_number} description={`${(order.company as { name?: string } | null)?.name} · PO ${order.po_number || "—"}`} action={<Badge tone={statusTone(order.status)}>{titleCase(order.status)}</Badge>} />
      <ErrorText message={sp.error} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Commercials & fulfilment</CardTitle></CardHeader>
          <CardContent>
            <form action={updateOrder} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={id} />
              <div className="space-y-1">
                <Label>Status</Label>
                <Select name="status" defaultValue={order.status} disabled={!writable}>
                  {["created", "confirmed", "in_progress", "dispatched", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Operations owner</Label>
                <Select name="operations_user_id" defaultValue={order.operations_user_id ?? ""} disabled={!writable}>
                  <option value="">Unassigned</option>
                  {(people ?? []).filter((p) => p.role === "operations" || p.role === "admin").map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </Select>
              </div>
              <div className="space-y-1"><Label>PO number</Label><Input name="po_number" defaultValue={order.po_number ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Expected delivery</Label><Input name="expected_delivery_date" type="date" defaultValue={order.expected_delivery_date ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Actual delivery</Label><Input name="actual_delivery_date" type="date" defaultValue={order.actual_delivery_date ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Supplier</Label><Select name="supplier_id" defaultValue={order.supplier_id ?? ""} disabled={!writable}><option value="">None</option>{(suppliers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
              <div className="space-y-1"><Label>Printing</Label><Select name="printing_vendor_id" defaultValue={order.printing_vendor_id ?? ""} disabled={!writable}><option value="">None</option>{(printers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
              <div className="space-y-1"><Label>Courier</Label><Select name="courier_partner_id" defaultValue={order.courier_partner_id ?? ""} disabled={!writable}><option value="">None</option>{(couriers ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></div>
              <div className="sm:col-span-2"><Textarea name="notes" defaultValue={order.notes ?? ""} disabled={!writable} /></div>
              {writable ? <Button type="submit">Save order</Button> : <p className="text-sm text-muted-foreground">Sales can view this order. Operations updates fulfilment.</p>}
            </form>
            <Table className="mt-4">
              <THead><TR><TH>Product</TH><TH>Qty</TH><TH>Unit</TH><TH>Line</TH></TR></THead>
              <TBody>
                {(items ?? []).map((i) => (
                  <TR key={i.id}><TD>{i.description}</TD><TD>{i.quantity}</TD><TD>{formatMoney(i.unit_price)}</TD><TD>{formatMoney(i.line_total)}</TD></TR>
                ))}
              </TBody>
            </Table>
            <p className="mt-2 text-sm font-medium">Order value {formatMoney(order.order_value)}</p>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Invoice & payment</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {invoice ? (
                <div>
                  <Link className="font-medium hover:underline" href={`/invoices/${invoice.id}`}>{invoice.invoice_number}</Link>
                  <div>{titleCase(invoice.status)} · billed {formatMoney(invoice.amount)} · received {formatMoney(paid)}</div>
                </div>
              ) : <p className="text-muted-foreground">No invoice yet.</p>}
              {order.quotation ? <div className="mt-2">Source quote {(order.quotation as { quotation_number: string }).quotation_number}</div> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(history ?? []).map((h) => (
                <div key={h.id}>{titleCase(h.from_status)} → {titleCase(h.to_status)} · {formatDateTime(h.changed_at)}</div>
              ))}
              {(activities ?? []).map((a) => <div key={a.id}>{a.title} · {titleCase(a.status)}</div>)}
              {!history?.length && !activities?.length ? <p className="text-muted-foreground">No events yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
