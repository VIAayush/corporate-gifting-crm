import { completeActivity, createActivity } from "@/app/(app)/actions";
import { EmptyState, ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, titleCase } from "@/lib/utils";

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/activities");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase.from("activities").select("id, title, type, due_at, status, notes, assignee:profiles!activities_assigned_to_fkey(full_name)").order("due_at", { ascending: true });
  const { data: people } = await supabase.from("profiles").select("id, full_name");
  return (
    <div>
      <PageHeader title="Activities" description="Calls, emails, meetings, follow-ups, and messages." />
      <ErrorText message={sp.error || error?.message} />
      <form action={createActivity} className="mb-4 grid gap-2 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
        <div className="sm:col-span-2 space-y-1"><Label>Title</Label><Input name="title" required /></div>
        <div className="space-y-1"><Label>Type</Label><Select name="type" defaultValue="follow_up">{["call","email","meeting","follow_up","message"].map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}</Select></div>
        <div className="space-y-1"><Label>Due</Label><Input name="due_at" type="datetime-local" /></div>
        <div className="space-y-1"><Label>Assign to</Label><Select name="assigned_to" defaultValue={profile.id}>{(people ?? []).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}</Select></div>
        <div className="space-y-1"><Label>Related type</Label><Select name="related_type"><option value="">None</option>{["company","lead","requirement","quotation","order","invoice"].map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
        <div className="sm:col-span-3 space-y-1"><Label>Notes</Label><Textarea name="notes" /></div>
        <Button type="submit">Create activity</Button>
      </form>
      {!data?.length ? <EmptyState title="No activities" body="Schedule a follow-up so nothing slips." /> : (
        <Table>
          <THead><TR><TH>Title</TH><TH>Type</TH><TH>Due</TH><TH>Owner</TH><TH>Status</TH><TH></TH></TR></THead>
          <TBody>
            {data.map((a) => (
              <TR key={a.id}>
                <TD className="font-medium">{a.title}</TD>
                <TD>{titleCase(a.type)}</TD>
                <TD>{formatDateTime(a.due_at)}</TD>
                <TD>{(a.assignee as { full_name?: string } | null)?.full_name}</TD>
                <TD><Badge tone={statusTone(a.status)}>{titleCase(a.status)}</Badge></TD>
                <TD>
                  {a.status !== "completed" ? (
                    <form action={completeActivity}><input type="hidden" name="id" value={a.id} /><Button size="sm" variant="secondary" type="submit">Complete</Button></form>
                  ) : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
