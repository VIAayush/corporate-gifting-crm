"use client";

import { useState } from "react";
import { recordMockupMeta } from "@/app/(app)/sales-actions";
import { createClient } from "@/lib/supabase/client";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

export function MockupUploader({ requirementId }: { requirementId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Use PNG, JPEG, WebP, or PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Maximum size is 10MB.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const path = `${requirementId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("mockups").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      await recordMockupMeta({
        requirementId,
        fileName: file.name,
        storagePath: path,
        mimeType: file.type,
        fileSize: file.size,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={onChange} disabled={busy} />
      {busy ? <p className="text-xs text-muted-foreground">Uploading…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">PNG, JPEG, WebP or PDF. 10MB max.</p>
    </div>
  );
}
