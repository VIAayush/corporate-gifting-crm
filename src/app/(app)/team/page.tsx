import { updateTeamRole } from "@/app/(app)/actions";
import { ErrorText, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { ROLE_LABELS, type AppRole } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requirePath("/team");
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").order("full_name");
  return (
    <div>
      <PageHeader title="Team" description="Roles are enforced in Postgres RLS as well as in the interface." />
      <ErrorText message={sp.error} />
      <Table>
        <THead><TR><TH>Name</TH><TH>Email</TH><TH>Role</TH><TH>Active</TH><TH></TH></TR></THead>
        <TBody>
          {(data ?? []).map((p) => (
            <TR key={p.id}>
              <TD className="font-medium">{p.full_name}</TD>
              <TD>{p.email}</TD>
              <TD><Badge>{ROLE_LABELS[p.role as AppRole]}</Badge></TD>
              <TD>{p.is_active ? "Yes" : "No"}</TD>
              <TD>
                <form action={updateTeamRole} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <Select name="role" defaultValue={p.role}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="is_active" defaultChecked={p.is_active} /> Active</label>
                  <Button size="sm" type="submit">Update</Button>
                </form>
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
