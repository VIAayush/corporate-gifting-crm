import Link from "next/link";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string }> }) {
  await requirePath("/orders");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const supabase = await createClient();
  let query = supabase.from("orders").select("id, order_number, status, order_value, expected_delivery_date, company:companies(name), ops:profiles!orders_operations_user_id_fkey(full_name)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * 20, page * 20 - 1);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.q) query = query.ilike("order_number", `%${sp.q}%`);
  const { data, count, error } = await query;
  return (
    <div>
      <PageHeader title="Orders" description="Fulfilment from accepted quotation through delivery." />
      <ErrorText message={sp.error || error?.message} />
      <FilterBar action="/orders" q={sp.q}>
        <Select name="status" defaultValue={sp.status || ""}>
          <option value="">All statuses</option>
          {["created", "confirmed", "in_progress", "dispatched", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
      </FilterBar>
      {!data?.length ? <EmptyState title="No orders" body="Accept a quotation and convert it to create an order." /> : (
        <Table>
          <THead><TR><TH>Order</TH><TH>Company</TH><TH>Value</TH><TH>Ops owner</TH><TH>Delivery</TH><TH>Status</TH></TR></THead>
          <TBody>
            {data.map((o) => (
              <TR key={o.id}>
                <TD><Link className="font-medium hover:underline" href={`/orders/${o.id}`}>{o.order_number}</Link></TD>
                <TD>{(o.company as { name?: string } | null)?.name}</TD>
                <TD>{formatMoney(o.order_value)}</TD>
                <TD>{(o.ops as { full_name?: string } | null)?.full_name || "Unassigned"}</TD>
                <TD>{formatDate(o.expected_delivery_date)}</TD>
                <TD><Badge tone={statusTone(o.status)}>{titleCase(o.status)}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={20} total={count ?? 0} href={(p) => `/orders?page=${p}&q=${sp.q ?? ""}&status=${sp.status ?? ""}`} />
    </div>
  );
}
