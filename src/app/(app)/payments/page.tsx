import { createPayment } from "@/app/(app)/actions";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteFinance } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/payments");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("payments").select("id, payment_date, amount, method, reference, invoice:invoices(invoice_number)").order("payment_date", { ascending: false });
  const { data: invoices } = await supabase.from("invoices").select("id, invoice_number, status").neq("status", "paid");
  return (
    <div>
      <PageHeader title="Payments" description="Record collections against invoices." />
      <ErrorText message={sp.error || error?.message} />
      {canWriteFinance(profile.role) ? (
        <form action={createPayment} className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-5">
          <div className="space-y-1 sm:col-span-2"><Label>Invoice</Label><Select name="invoice_id" required><option value="">Select</option>{(invoices ?? []).map((i) => <option key={i.id} value={i.id}>{i.invoice_number}</option>)}</Select></div>
          <div className="space-y-1"><Label>Amount</Label><Input name="amount" type="number" min="1" required /></div>
          <div className="space-y-1"><Label>Date</Label><Input name="payment_date" type="date" required /></div>
          <div className="space-y-1"><Label>Method</Label><Select name="method" defaultValue="bank_transfer"><option value="bank_transfer">Bank transfer</option><option value="upi">UPI</option><option value="cheque">Cheque</option></Select></div>
          <div className="sm:col-span-2 space-y-1"><Label>Reference</Label><Input name="reference" /></div>
          <Button type="submit" className="self-end">Record</Button>
        </form>
      ) : null}
      {!data?.length ? <EmptyState title="No payments" body="Collections will appear here." /> : (
        <Table>
          <THead><TR><TH>Date</TH><TH>Invoice</TH><TH>Amount</TH><TH>Method</TH><TH>Reference</TH></TR></THead>
          <TBody>
            {data.map((p) => (
              <TR key={p.id}>
                <TD>{formatDate(p.payment_date)}</TD>
                <TD>{(p.invoice as { invoice_number?: string } | null)?.invoice_number}</TD>
                <TD>{formatMoney(p.amount)}</TD>
                <TD>{p.method}</TD>
                <TD>{p.reference || "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
