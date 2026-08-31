import { updateContact } from "@/app/(app)/actions";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { requirePath } from "@/lib/auth";
import { canWriteCrm } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export default async function ContactDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { profile } = await requirePath("/contacts");
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: contact } = await supabase.from("contacts").select("*, company:companies(name)").eq("id", id).single();
  if (!contact) return <p>Contact not found.</p>;
  const { data: companies } = await supabase.from("companies").select("id, name");
  const { data: branches } = await supabase.from("branches").select("id, name").eq("company_id", contact.company_id);
  return (
    <div>
      <PageHeader title={contact.full_name} description={(contact.company as { name?: string } | null)?.name} />
      <ErrorText message={sp.error} />
      <Card>
        <CardContent className="pt-5">
          <form action={updateContact} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={id} />
            <div className="space-y-1"><Label>Name</Label><Input name="full_name" defaultValue={contact.full_name} required disabled={!canWriteCrm(profile.role)} /></div>
            <div className="space-y-1"><Label>Designation</Label><Input name="designation" defaultValue={contact.designation ?? ""} disabled={!canWriteCrm(profile.role)} /></div>
            <div className="space-y-1"><Label>Email</Label><Input name="email" type="email" defaultValue={contact.email ?? ""} disabled={!canWriteCrm(profile.role)} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input name="phone" defaultValue={contact.phone ?? ""} disabled={!canWriteCrm(profile.role)} /></div>
            <div className="space-y-1">
              <Label>Company</Label>
              <Select name="company_id" defaultValue={contact.company_id} disabled={!canWriteCrm(profile.role)}>
                {(companies ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Branch</Label>
              <Select name="branch_id" defaultValue={contact.branch_id ?? ""} disabled={!canWriteCrm(profile.role)}>
                <option value="">None</option>
                {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select name="contact_type" defaultValue={contact.contact_type} disabled={!canWriteCrm(profile.role)}>
                <option value="primary">Primary</option>
                <option value="billing">Billing</option>
                <option value="procurement">Procurement</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1"><Label>Notes</Label><Textarea name="notes" defaultValue={contact.notes ?? ""} disabled={!canWriteCrm(profile.role)} /></div>
            {canWriteCrm(profile.role) ? <Button type="submit">Save</Button> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
