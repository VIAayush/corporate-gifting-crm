import Link from "next/link";
import { createInvoice } from "@/app/(app)/actions";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteFinance } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/invoices");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("invoices").select("id, invoice_number, amount, status, due_date, company:companies(name), order:orders(order_number)").order("created_at", { ascending: false });
  const { data: orders } = await supabase.from("orders").select("id, order_number").order("created_at", { ascending: false });
  return (
    <div>
      <PageHeader title="Invoices" description="Lightweight billing against orders. Not a full accounting ledger." />
      <ErrorText message={sp.error || error?.message} />
      {canWriteFinance(profile.role) ? (
        <form action={createInvoice} className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
          <div className="space-y-1 sm:col-span-2"><Label>Order</Label><Select name="order_id" required><option value="">Select order</option>{(orders ?? []).map((o) => <option key={o.id} value={o.id}>{o.order_number}</option>)}</Select></div>
          <div className="space-y-1"><Label>Amount</Label><Input name="amount" type="number" min="1" placeholder="Defaults to order value" /></div>
          <div className="space-y-1"><Label>Due date</Label><Input name="due_date" type="date" required /></div>
          <Button type="submit">Create invoice</Button>
        </form>
      ) : null}
      {!data?.length ? <EmptyState title="No invoices" body="Raise an invoice from a confirmed order." /> : (
        <Table>
          <THead><TR><TH>Invoice</TH><TH>Company</TH><TH>Order</TH><TH>Amount</TH><TH>Due</TH><TH>Status</TH></TR></THead>
          <TBody>
            {data.map((i) => (
              <TR key={i.id}>
                <TD><Link className="font-medium hover:underline" href={`/invoices/${i.id}`}>{i.invoice_number}</Link></TD>
                <TD>{(i.company as { name?: string } | null)?.name}</TD>
                <TD>{(i.order as { order_number?: string } | null)?.order_number}</TD>
                <TD>{formatMoney(i.amount)}</TD>
                <TD>{formatDate(i.due_date)}</TD>
                <TD><Badge tone={statusTone(i.status)}>{titleCase(i.status)}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
