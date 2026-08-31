import { PageHeader } from "@/components/page-header";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export default async function AuditPage() {
  await requirePath("/audit");
  const supabase = await createClient();
  const { data } = await supabase.from("audit_logs").select("*, actor:profiles(full_name, email)").order("created_at", { ascending: false }).limit(200);
  return (
    <div>
      <PageHeader title="Audit log" description="Creates, updates, status changes, assignments, invoices, and payments." />
      <Table>
        <THead><TR><TH>When</TH><TH>User</TH><TH>Action</TH><TH>Entity</TH><TH>ID</TH></TR></THead>
        <TBody>
          {(data ?? []).map((r) => (
            <TR key={r.id}>
              <TD className="whitespace-nowrap">{formatDateTime(r.created_at)}</TD>
              <TD>{(r.actor as { full_name?: string } | null)?.full_name || "System"}</TD>
              <TD>{r.action}</TD>
              <TD>{r.entity}</TD>
              <TD className="font-mono text-xs">{r.entity_id?.slice(0, 8)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
