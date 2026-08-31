import { deleteMockup } from "@/app/(app)/sales-actions";
import { MockupUploader } from "@/components/mockup-uploader";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requirePath } from "@/lib/auth";
import { canWriteSales } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function MockupsPage() {
  const { profile } = await requirePath("/mockups");
  const supabase = await createClient();
  const { data } = await supabase.from("mockups").select("*, requirement:requirements(id, name)").order("created_at", { ascending: false });
  const { data: requirements } = await supabase.from("requirements").select("id, name").order("created_at", { ascending: false }).limit(20);
  const rows = [];
  for (const m of data ?? []) {
    const { data: signed } = await supabase.storage.from("mockups").createSignedUrl(m.storage_path, 3600);
    rows.push({ ...m, url: signed?.signedUrl });
  }
  return (
    <div>
      <PageHeader title="Mockups" description="Artwork files live in object storage. This table stores only metadata." />
      {canWriteSales(profile.role) && requirements?.[0] ? (
        <div className="mb-4 rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-sm">Upload against the latest requirement, or open a requirement to attach there.</p>
          <MockupUploader requirementId={requirements[0].id} />
        </div>
      ) : null}
      {!rows.length ? <EmptyState title="No mockups" body="Upload a PNG, JPEG, WebP, or PDF from a requirement." /> : (
        <Table>
          <THead><TR><TH>File</TH><TH>Requirement</TH><TH>Type</TH><TH>Size</TH><TH>Uploaded</TH><TH></TH></TR></THead>
          <TBody>
            {rows.map((m) => (
              <TR key={m.id}>
                <TD className="font-medium">{m.file_name}</TD>
                <TD><Link className="hover:underline" href={`/requirements/${(m.requirement as { id: string }).id}`}>{(m.requirement as { name: string }).name}</Link></TD>
                <TD>{m.mime_type}</TD>
                <TD>{(m.file_size_bytes / 1024).toFixed(0)} KB</TD>
                <TD>{formatDateTime(m.created_at)}</TD>
                <TD className="flex gap-2">
                  {m.url ? <a className="text-sm underline" href={m.url} target="_blank">View / download</a> : null}
                  {canWriteSales(profile.role) ? (
                    <form action={deleteMockup}><input type="hidden" name="id" value={m.id} /><Button size="sm" variant="destructive" type="submit">Delete</Button></form>
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
