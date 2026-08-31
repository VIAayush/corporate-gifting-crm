import Link from "next/link";
import { createLead } from "@/app/(app)/actions";
import { FilterBar, Pagination } from "@/components/filter-bar";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteCrm } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatMoney, titleCase } from "@/lib/utils";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ q?: string; stage?: string; sort?: string; page?: string; error?: string }> }) {
  const { profile } = await requirePath("/leads");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || 1));
  const supabase = await createClient();
  let query = supabase.from("leads").select("id, stage, source, estimated_value, next_follow_up_at, company:companies(name), contact:contacts(full_name), owner:profiles(full_name)", { count: "exact" });
  if (sp.stage) query = query.eq("stage", sp.stage);
  if (sp.sort === "value") query = query.order("estimated_value", { ascending: false });
  else if (sp.sort === "followup") query = query.order("next_follow_up_at", { ascending: true });
  else query = query.order("created_at", { ascending: false });
  query = query.range((page - 1) * 20, page * 20 - 1);
  const { data, count, error } = await query;
  const { data: companies } = await supabase.from("companies").select("id, name").order("name");
  const { data: contacts } = await supabase.from("contacts").select("id, full_name, company_id");
  const { data: owners } = await supabase.from("profiles").select("id, full_name");
  return (
    <div>
      <PageHeader title="Leads" description="Pipeline from first enquiry to regular client. Hot leads cannot move backward unless you are admin or management." />
      <ErrorText message={sp.error || error?.message} />
      <FilterBar action="/leads" q={sp.q}>
        <Select name="stage" defaultValue={sp.stage || ""}>
          <option value="">All stages</option>
          {["cold", "warm", "hot", "client", "regular_client"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </Select>
        <Select name="sort" defaultValue={sp.sort || "recent"}>
          <option value="recent">Newest</option>
          <option value="value">Estimated value</option>
          <option value="followup">Next follow-up</option>
        </Select>
      </FilterBar>
      {canWriteCrm(profile.role) ? (
        <details className="mb-4 rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium">Add lead</summary>
          <form action={createLead} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Company</Label>
              <Select name="company_id" required>
                <option value="">Select</option>
                {(companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Contact</Label>
              <Select name="contact_id">
                <option value="">Optional</option>
                {(contacts ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Source</Label>
              <Select name="source" defaultValue="inbound">
                {["inbound", "referral", "event", "outbound", "website", "other"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Stage</Label>
              <Select name="stage" defaultValue="cold">
                {["cold", "warm", "hot", "client", "regular_client"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
              </Select>
            </div>
            <div className="space-y-1"><Label>Estimated value</Label><Input name="estimated_value" type="number" min="0" /></div>
            <div className="space-y-1"><Label>Expected conversion</Label><Input name="expected_conversion_date" type="date" /></div>
            <div className="space-y-1"><Label>Next follow-up</Label><Input name="next_follow_up_at" type="datetime-local" /></div>
            <div className="space-y-1">
              <Label>Owner</Label>
              <Select name="owner_id" defaultValue={profile.id}>
                {(owners ?? []).map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
              </Select>
            </div>
            <div className="sm:col-span-2"><Textarea name="notes" placeholder="Notes" /></div>
            <Button type="submit">Create lead</Button>
          </form>
        </details>
      ) : null}
      {!data?.length ? <EmptyState title="No leads" body="Capture an enquiry to start the pipeline." /> : (
        <Table>
          <THead><TR><TH>Company</TH><TH>Stage</TH><TH>Value</TH><TH>Owner</TH><TH>Follow-up</TH></TR></THead>
          <TBody>
            {(data ?? []).filter((l) => !sp.q || JSON.stringify(l).toLowerCase().includes(sp.q.toLowerCase())).map((l) => (
              <TR key={l.id}>
                <TD>
                  <Link className="font-medium hover:underline" href={`/leads/${l.id}`}>{(l.company as { name?: string } | null)?.name}</Link>
                  <div className="text-xs text-muted-foreground">{(l.contact as { full_name?: string } | null)?.full_name} · {titleCase(l.source)}</div>
                </TD>
                <TD><Badge tone={statusTone(l.stage)}>{titleCase(l.stage)}</Badge></TD>
                <TD>{formatMoney(l.estimated_value)}</TD>
                <TD>{(l.owner as { full_name?: string } | null)?.full_name}</TD>
                <TD>{formatDate(l.next_follow_up_at)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
      <Pagination page={page} pageSize={20} total={count ?? 0} href={(p) => `/leads?page=${p}&stage=${sp.stage ?? ""}&sort=${sp.sort ?? ""}`} />
    </div>
  );
}
