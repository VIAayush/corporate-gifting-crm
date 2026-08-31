import { createPayment } from "@/app/(app)/actions";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteFinance } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function InvoiceDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/invoices");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: invoice } = await supabase.from("invoices").select("*, company:companies(name), order:orders(order_number)").eq("id", id).single();
  if (!invoice) return <p>Invoice not found.</p>;
  const { data: payments } = await supabase.from("payments").select("*").eq("invoice_id", id).order("payment_date", { ascending: false });
  const received = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const outstanding = Number(invoice.amount) - received;
  return (
    <div>
      <PageHeader title={invoice.invoice_number} description={`${(invoice.company as { name?: string }).name} · ${(invoice.order as { order_number?: string }).order_number}`} action={<Badge tone={statusTone(invoice.status)}>{titleCase(invoice.status)}</Badge>} />
      <ErrorText message={sp.error} />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><div className="text-xs uppercase text-muted-foreground">Invoiced</div><div className="font-heading text-2xl">{formatMoney(invoice.amount)}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-xs uppercase text-muted-foreground">Received</div><div className="font-heading text-2xl">{formatMoney(received)}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-xs uppercase text-muted-foreground">Outstanding</div><div className="font-heading text-2xl">{formatMoney(outstanding)}</div></CardContent></Card>
      </div>
      {canWriteFinance(profile.role) && outstanding > 0 ? (
        <form action={createPayment} className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-5">
          <input type="hidden" name="invoice_id" value={id} />
          <div className="space-y-1"><Label>Amount</Label><Input name="amount" type="number" min="1" max={outstanding} required /></div>
          <div className="space-y-1"><Label>Date</Label><Input name="payment_date" type="date" required /></div>
          <div className="space-y-1"><Label>Method</Label><Select name="method" defaultValue="bank_transfer">{["bank_transfer","upi","cheque","card","cash","other"].map((m) => <option key={m} value={m}>{m.replace("_"," ")}</option>)}</Select></div>
          <div className="space-y-1"><Label>Reference</Label><Input name="reference" /></div>
          <Button type="submit" className="self-end">Record payment</Button>
        </form>
      ) : null}
      <Table>
        <THead><TR><TH>Date</TH><TH>Amount</TH><TH>Method</TH><TH>Reference</TH></TR></THead>
        <TBody>
          {(payments ?? []).map((p) => (
            <TR key={p.id}><TD>{formatDate(p.payment_date)}</TD><TD>{formatMoney(p.amount)}</TD><TD>{p.method}</TD><TD>{p.reference || "—"}</TD></TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
