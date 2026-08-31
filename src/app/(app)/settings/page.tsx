import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePath } from "@/lib/auth";

export default async function SettingsPage() {
  await requirePath("/settings");
  return (
    <div>
      <PageHeader title="Settings" description="Workspace identity for this Oaklane tenant." />
      <Card>
        <CardHeader><CardTitle>Organisation</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><span className="text-muted-foreground">Product</span> · Oaklane Gift Operations</div>
          <div><span className="text-muted-foreground">Currency</span> · INR (single currency for MVP)</div>
          <div><span className="text-muted-foreground">Default tax</span> · 18% on quotations</div>
          <div><span className="text-muted-foreground">File storage</span> · Private mockups bucket, 10MB, PNG/JPEG/WebP/PDF</div>
          <p className="pt-2 text-muted-foreground">GST filing, payment gateways, and multi-country tax are intentionally out of MVP scope.</p>
        </CardContent>
      </Card>
    </div>
  );
}
