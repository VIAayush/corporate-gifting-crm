import Link from "next/link";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const [
    companies,
    leads,
    requirements,
    quotations,
    orders,
    invoices,
    payments,
    activities,
  ] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id, stage, estimated_value, company:companies(name), next_follow_up_at"),
    supabase.from("requirements").select("id, name, status, deadline, company:companies(name), created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("quotations").select("id, quotation_number, status, total, valid_until, company:companies(name), created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("orders").select("id, order_number, status, order_value, expected_delivery_date, company:companies(name), created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("invoices").select("id, invoice_number, amount, status, due_date, company:companies(name)"),
    supabase.from("payments").select("amount"),
    supabase.from("activities").select("id, title, type, due_at, status").order("due_at", { ascending: true }).limit(12),
  ]);

  const leadRows = leads.data ?? [];
  const invoiceRows = invoices.data ?? [];
  const orderRows = orders.data ?? [];
  const activeLeads = leadRows.filter((l) => !["client", "regular_client"].includes(l.stage)).length;
  const pipeline = ["cold", "warm", "hot", "client", "regular_client"].map((stage) => ({
    stage,
    count: leadRows.filter((l) => l.stage === stage).length,
    value: leadRows.filter((l) => l.stage === stage).reduce((s, l) => s + Number(l.estimated_value || 0), 0),
  }));
  const openQuotes = (quotations.data ?? []).filter((q) => ["draft", "sent"].includes(q.status));
  const inProgress = orderRows.filter((o) => ["created", "confirmed", "in_progress", "dispatched"].includes(o.status));
  const delivered = orderRows.filter((o) => o.status === "delivered");
  const orderValue = orderRows.reduce((s, o) => s + Number(o.order_value || 0), 0);
  const invoiced = invoiceRows.reduce((s, i) => s + Number(i.amount || 0), 0);
  const received = (payments.data ?? []).reduce((s, p) => s + Number(p.amount || 0), 0);
  const revenue = invoiceRows.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount || 0), 0) + received;
  const overdueInvoices = invoiceRows.filter((i) => i.status === "overdue" || (i.status !== "paid" && i.due_date && i.due_date < new Date().toISOString().slice(0, 10)));
  const quotesWaiting = (quotations.data ?? []).filter((q) => q.status === "sent");
  const followupsDue = (activities.data ?? []).filter((a) => a.status !== "completed" && a.due_at && new Date(a.due_at) <= new Date(Date.now() + 24 * 3600 * 1000));
  const deadlineOrders = orderRows.filter(
    (o) => o.expected_delivery_date && o.status !== "delivered" && o.status !== "cancelled",
  );

  const kpis = [
    { label: "Companies", value: String(companies.count ?? 0) },
    { label: "Active leads", value: String(activeLeads) },
    { label: "Active requirements", value: String((requirements.data ?? []).filter((r) => ["draft", "active", "quoted"].includes(r.status)).length) },
    { label: "Open quotations", value: String(openQuotes.length) },
    { label: "Orders", value: String(orderRows.length) },
    { label: "Order value", value: formatMoney(orderValue) },
    { label: "Revenue received", value: formatMoney(received) },
    { label: "Outstanding", value: formatMoney(Math.max(invoiced - received, 0)) },
    { label: "In progress", value: String(inProgress.length) },
    { label: "Delivered", value: String(delivered.length) },
  ];

  return (
    <div>
      <PageHeader
        title={`Good day, ${profile.full_name.split(" ")[0]}`}
        description="What needs attention today across pipeline, operations, and collections."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader>
              <CardTitle className="text-xs font-sans uppercase tracking-wide text-muted-foreground">{k.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-2xl">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Needs attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quotesWaiting.length === 0 && followupsDue.length === 0 && overdueInvoices.length === 0 && deadlineOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing urgent. Pipeline is quiet.</p>
            ) : (
              <>
                {quotesWaiting.map((q) => (
                  <AlertRow key={q.id} href={`/quotations/${q.id}`} label="Quotation awaiting response" detail={`${q.quotation_number} · ${(q.company as { name?: string } | null)?.name ?? ""}`} />
                ))}
                {followupsDue.map((a) => (
                  <AlertRow key={a.id} href="/activities" label="Follow-up due" detail={`${a.title} · ${formatDate(a.due_at)}`} />
                ))}
                {overdueInvoices.map((i) => (
                  <AlertRow key={i.id} href="/receivables" label="Outstanding payment" detail={`${i.invoice_number} · ${formatMoney(i.amount)} due ${formatDate(i.due_date)}`} />
                ))}
                {deadlineOrders.map((o) => (
                  <AlertRow key={o.id} href={`/orders/${o.id}`} label="Order approaching deadline" detail={`${o.order_number} · ${formatDate(o.expected_delivery_date)}`} />
                ))}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sales pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pipeline.map((p) => (
              <div key={p.stage}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{titleCase(p.stage)}</span>
                  <span className="text-muted-foreground">
                    {p.count} · {formatMoney(p.value)}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, p.count * 20)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <RecentList
          title="Recent requirements"
          href="/requirements"
          rows={(requirements.data ?? []).map((r) => ({
            id: r.id,
            href: `/requirements/${r.id}`,
            title: r.name,
            meta: `${(r.company as { name?: string } | null)?.name ?? ""} · ${formatDate(r.deadline)}`,
            status: r.status,
          }))}
        />
        <RecentList
          title="Recent quotations"
          href="/quotations"
          rows={(quotations.data ?? []).map((q) => ({
            id: q.id,
            href: `/quotations/${q.id}`,
            title: q.quotation_number,
            meta: `${(q.company as { name?: string } | null)?.name ?? ""} · ${formatMoney(q.total)}`,
            status: q.status,
          }))}
        />
        <RecentList
          title="Recent orders"
          href="/orders"
          rows={(orders.data ?? []).map((o) => ({
            id: o.id,
            href: `/orders/${o.id}`,
            title: o.order_number,
            meta: `${(o.company as { name?: string } | null)?.name ?? ""} · ${formatMoney(o.order_value)}`,
            status: o.status,
          }))}
        />
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Recognized revenue (paid + collected): {formatMoney(revenue)}.</p>
    </div>
  );
}

function AlertRow({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link href={href} className="block rounded-lg border border-border bg-background px-3 py-2 hover:bg-muted/50">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
    </Link>
  );
}

function RecentList({
  title,
  href,
  rows,
}: {
  title: string;
  href: string;
  rows: { id: string; href: string; title: string; meta: string; status: string }[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <Link href={href} className="text-xs text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">Nothing yet.</p> : null}
        {rows.map((r) => (
          <Link key={r.id} href={r.href} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-muted/50">
            <div>
              <div className="text-sm font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.meta}</div>
            </div>
            <Badge tone={statusTone(r.status)}>{titleCase(r.status)}</Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
