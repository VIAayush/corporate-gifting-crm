import { updateLead } from "@/app/(app)/actions";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { requirePath } from "@/lib/auth";
import { canWriteCrm } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, titleCase } from "@/lib/utils";

export default async function LeadDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/leads");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: lead } = await supabase.from("leads").select("*, company:companies(name), contact:contacts(full_name)").eq("id", id).single();
  if (!lead) return <p>Lead not found.</p>;
  const [{ data: history }, { data: owners }, { data: companies }, { data: contacts }, { data: activities }] = await Promise.all([
    supabase.from("lead_stage_history").select("*, changer:profiles(full_name)").eq("lead_id", id).order("changed_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
    supabase.from("companies").select("id, name"),
    supabase.from("contacts").select("id, full_name"),
    supabase.from("activities").select("*").eq("related_id", id).order("due_at", { ascending: false }),
  ]);
  const writable = canWriteCrm(profile.role);
  return (
    <div>
      <PageHeader title={(lead.company as { name?: string } | null)?.name ?? "Lead"} description={`${titleCase(lead.stage)} · ${(lead.contact as { full_name?: string } | null)?.full_name ?? "No contact"}`} />
      <ErrorText message={sp.error} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <form action={updateLead} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="id" value={id} />
              <div className="space-y-1">
                <Label>Company</Label>
                <Select name="company_id" defaultValue={lead.company_id} disabled={!writable}>
                  {(companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Contact</Label>
                <Select name="contact_id" defaultValue={lead.contact_id ?? ""} disabled={!writable}>
                  <option value="">None</option>
                  {(contacts ?? []).map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Stage</Label>
                <Select name="stage" defaultValue={lead.stage} disabled={!writable}>
                  {["cold", "warm", "hot", "client", "regular_client"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Source</Label>
                <Select name="source" defaultValue={lead.source} disabled={!writable}>
                  {["inbound", "referral", "event", "outbound", "website", "other"].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
                </Select>
              </div>
              <div className="space-y-1"><Label>Estimated value</Label><Input name="estimated_value" type="number" defaultValue={lead.estimated_value} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Expected conversion</Label><Input name="expected_conversion_date" type="date" defaultValue={lead.expected_conversion_date ?? ""} disabled={!writable} /></div>
              <div className="space-y-1"><Label>Next follow-up</Label><Input name="next_follow_up_at" type="datetime-local" defaultValue={lead.next_follow_up_at ? lead.next_follow_up_at.slice(0, 16) : ""} disabled={!writable} /></div>
              <div className="space-y-1">
                <Label>Owner</Label>
                <Select name="owner_id" defaultValue={lead.owner_id ?? ""} disabled={!writable}>
                  {(owners ?? []).map((o) => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                </Select>
              </div>
              <div className="sm:col-span-2"><Textarea name="notes" defaultValue={lead.notes ?? ""} disabled={!writable} /></div>
              {writable ? <Button type="submit">Save lead</Button> : null}
            </form>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Stage history</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(history ?? []).map((h) => (
                <div key={h.id} className="border-b border-border pb-2">
                  <div>{titleCase(h.from_stage)} → <Badge tone={statusTone(h.to_stage)}>{titleCase(h.to_stage)}</Badge></div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(h.changed_at)} · {(h.changer as { full_name?: string } | null)?.full_name}</div>
                </div>
              ))}
              {!history?.length ? <p className="text-muted-foreground">No stage changes yet.</p> : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(activities ?? []).map((a) => (
                <div key={a.id}>{a.title} · {titleCase(a.status)}</div>
              ))}
              {!activities?.length ? <p className="text-muted-foreground">No linked activities.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
