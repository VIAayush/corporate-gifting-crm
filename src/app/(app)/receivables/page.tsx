import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function ReceivablesPage() {
  await requirePath("/receivables");
  const supabase = await createClient();
  const { data: invoices } = await supabase.from("invoices").select("id, invoice_number, amount, status, due_date, company:companies(name)");
  const { data: payments } = await supabase.from("payments").select("invoice_id, amount");
  const paidMap = new Map<string, number>();
  for (const p of payments ?? []) paidMap.set(p.invoice_id, (paidMap.get(p.invoice_id) || 0) + Number(p.amount));
  const rows = (invoices ?? []).map((i) => {
    const received = paidMap.get(i.id) || 0;
    return { ...i, received, outstanding: Number(i.amount) - received };
  });
  const totalInvoiced = rows.reduce((s, r) => s + Number(r.amount), 0);
  const totalReceived = rows.reduce((s, r) => s + r.received, 0);
  const totalOutstanding = rows.reduce((s, r) => s + Math.max(r.outstanding, 0), 0);
  return (
    <div>
      <PageHeader title="Receivables" description="Outstanding amount = invoice amount − payments received." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><div className="text-xs uppercase text-muted-foreground">Total invoiced</div><div className="font-heading text-2xl">{formatMoney(totalInvoiced)}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-xs uppercase text-muted-foreground">Total received</div><div className="font-heading text-2xl">{formatMoney(totalReceived)}</div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="text-xs uppercase text-muted-foreground">Total outstanding</div><div className="font-heading text-2xl">{formatMoney(totalOutstanding)}</div></CardContent></Card>
      </div>
      <Table>
        <THead><TR><TH>Invoice</TH><TH>Company</TH><TH>Invoiced</TH><TH>Received</TH><TH>Outstanding</TH><TH>Due</TH><TH>Status</TH></TR></THead>
        <TBody>
          {rows.filter((r) => r.outstanding > 0).map((r) => (
            <TR key={r.id}>
              <TD><Link className="hover:underline" href={`/invoices/${r.id}`}>{r.invoice_number}</Link></TD>
              <TD>{(r.company as { name?: string } | null)?.name}</TD>
              <TD>{formatMoney(r.amount)}</TD>
              <TD>{formatMoney(r.received)}</TD>
              <TD>{formatMoney(r.outstanding)}</TD>
              <TD>{formatDate(r.due_date)}</TD>
              <TD><Badge tone={statusTone(r.status)}>{titleCase(r.status)}</Badge></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
