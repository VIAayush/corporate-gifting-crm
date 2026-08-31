import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, titleCase } from "@/lib/utils";

export default async function ReportsPage() {
  await requirePath("/reports");
  const supabase = await createClient();
  const [{ data: leads }, { data: orders }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from("leads").select("estimated_value, owner:profiles(full_name)"),
    supabase.from("orders").select("status, order_value"),
    supabase.from("invoices").select("amount"),
    supabase.from("payments").select("amount"),
  ]);

  const byOwner = new Map<string, { count: number; value: number }>();
  for (const l of leads ?? []) {
    const name = (l.owner as { full_name?: string } | null)?.full_name || "Unassigned";
    const cur = byOwner.get(name) || { count: 0, value: 0 };
    cur.count += 1;
    cur.value += Number(l.estimated_value || 0);
    byOwner.set(name, cur);
  }

  const byStatus = new Map<string, { count: number; value: number }>();
  for (const o of orders ?? []) {
    const cur = byStatus.get(o.status) || { count: 0, value: 0 };
    cur.count += 1;
    cur.value += Number(o.order_value || 0);
    byStatus.set(o.status, cur);
  }

  const received = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const invoiced = (invoices ?? []).reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div>
      <PageHeader title="Reports" description="Lightweight performance view. Advanced BI is out of scope." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Pipeline by owner</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[...byOwner.entries()].map(([name, r]) => (
              <div key={name} className="flex justify-between">
                <span>{name}</span>
                <span>{r.count} leads · {formatMoney(r.value)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Orders & cash</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[...byStatus.entries()].map(([status, v]) => (
              <div key={status} className="flex justify-between">
                <span>{titleCase(status)}</span>
                <span>{v.count} · {formatMoney(v.value)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <span>Collected</span>
              <span>{formatMoney(received)} of {formatMoney(invoiced)} invoiced</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
