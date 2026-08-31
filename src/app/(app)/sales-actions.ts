"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canWriteOps, canWriteSales } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

function str(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  return v.length ? v : null;
}
function num(form: FormData, key: string) {
  const v = String(form.get(key) ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function createQuotation(formData: FormData) {
  const { profile } = await requireUser();
  if (!canWriteSales(profile.role)) throw new Error("Not permitted");
  const requirementId = str(formData, "requirement_id");
  const supabase = await createClient();
  const { data: req } = await supabase
    .from("requirements")
    .select("id, company_id, contact_id, owner_id")
    .eq("id", requirementId)
    .single();
  if (!req) redirect("/quotations?error=Requirement not found");
  const { data: number } = await supabase.rpc("next_quotation_number");
  const { data: q, error } = await supabase
    .from("quotations")
    .insert({
      quotation_number: number,
      requirement_id: req.id,
      company_id: req.company_id,
      contact_id: req.contact_id,
      owner_id: req.owner_id || profile.id,
      discount_percent: num(formData, "discount_percent") || 0,
      tax_percent: num(formData, "tax_percent") ?? 18,
      valid_until: str(formData, "valid_until"),
      notes: str(formData, "notes"),
      status: "draft",
    })
    .select("id")
    .single();
  if (error) redirect(`/quotations?error=${encodeURIComponent(error.message)}`);
  const { data: lines } = await supabase
    .from("requirement_products")
    .select("product_id, quantity, product:products(name, price)")
    .eq("requirement_id", req.id);
  if (lines?.length) {
    await supabase.from("quotation_items").insert(
      lines.map((l) => ({
        quotation_id: q.id,
        product_id: l.product_id,
        description: (l.product as { name?: string } | null)?.name,
        quantity: l.quantity,
        unit_price: Number((l.product as { price?: number } | null)?.price || 0),
      })),
    );
    await supabase.rpc("recalc_quotation_totals", { p_quotation_id: q.id });
  }
  await supabase.from("requirements").update({ status: "quoted" }).eq("id", req.id);
  revalidatePath("/quotations");
  redirect(`/quotations/${q.id}`);
}

export async function addQuotationItem(formData: FormData) {
  const { profile } = await requireUser();
  if (!canWriteSales(profile.role)) throw new Error("Not permitted");
  const quotationId = str(formData, "quotation_id");
  const qty = num(formData, "quantity") || 1;
  const price = num(formData, "unit_price");
  if (qty < 1 || price == null || price < 0) {
    redirect(`/quotations/${quotationId}?error=Invalid quantity or price`);
  }
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("id, name").eq("id", str(formData, "product_id")).single();
  const { error } = await supabase.from("quotation_items").insert({
    quotation_id: quotationId,
    product_id: product?.id,
    description: product?.name,
    quantity: qty,
    unit_price: price,
  });
  if (error) redirect(`/quotations/${quotationId}?error=${encodeURIComponent(error.message)}`);
  await supabase.rpc("recalc_quotation_totals", { p_quotation_id: quotationId });
  revalidatePath(`/quotations/${quotationId}`);
}

export async function updateQuotationHeader(formData: FormData) {
  const { profile } = await requireUser();
  if (!canWriteSales(profile.role)) throw new Error("Not permitted");
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotations")
    .update({
      discount_percent: num(formData, "discount_percent") || 0,
      tax_percent: num(formData, "tax_percent") ?? 18,
      valid_until: str(formData, "valid_until"),
      notes: str(formData, "notes"),
    })
    .eq("id", id);
  if (error) redirect(`/quotations/${id}?error=${encodeURIComponent(error.message)}`);
  await supabase.rpc("recalc_quotation_totals", { p_quotation_id: id });
  revalidatePath(`/quotations/${id}`);
}

export async function setQuotationStatus(formData: FormData) {
  const { profile } = await requireUser();
  if (!canWriteSales(profile.role)) throw new Error("Not permitted");
  const id = str(formData, "id");
  const status = str(formData, "status");
  const supabase = await createClient();
  const { data: current } = await supabase.from("quotations").select("status").eq("id", id).single();
  const { error } = await supabase.from("quotations").update({ status }).eq("id", id);
  if (error) redirect(`/quotations/${id}?error=${encodeURIComponent(error.message)}`);
  await supabase.from("quotation_history").insert({
    quotation_id: id,
    from_status: current?.status,
    to_status: status,
    changed_by: profile.id,
  });
  revalidatePath(`/quotations/${id}`);
  revalidatePath("/quotations");
}

export async function convertQuotation(formData: FormData) {
  const { profile } = await requireUser();
  if (!(profile.role === "admin" || profile.role === "sales" || profile.role === "operations")) {
    throw new Error("Not permitted");
  }
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("convert_quotation_to_order", { p_quotation_id: id });
  if (error) redirect(`/quotations/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/orders");
  redirect(`/orders/${data}`);
}

export async function updateOrder(formData: FormData) {
  const { profile } = await requireUser();
  if (!canWriteOps(profile.role)) throw new Error("Not permitted");
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      operations_user_id: str(formData, "operations_user_id"),
      supplier_id: str(formData, "supplier_id"),
      printing_vendor_id: str(formData, "printing_vendor_id"),
      courier_partner_id: str(formData, "courier_partner_id"),
      po_number: str(formData, "po_number"),
      expected_delivery_date: str(formData, "expected_delivery_date"),
      actual_delivery_date: str(formData, "actual_delivery_date"),
      status: str(formData, "status"),
      notes: str(formData, "notes"),
    })
    .eq("id", id);
  if (error) redirect(`/orders/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/orders/${id}`);
  revalidatePath("/orders");
}

export async function recordMockupMeta(input: {
  requirementId: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
}) {
  const { profile } = await requireUser();
  if (!canWriteSales(profile.role)) throw new Error("Not permitted");
  const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  if (!allowed.includes(input.mimeType)) throw new Error("File type not allowed");
  if (input.fileSize > 10 * 1024 * 1024) throw new Error("File must be 10MB or smaller");
  const supabase = await createClient();
  const { error } = await supabase.from("mockups").insert({
    requirement_id: input.requirementId,
    file_name: input.fileName,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    file_size_bytes: input.fileSize,
    uploaded_by: profile.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/mockups");
  revalidatePath(`/requirements/${input.requirementId}`);
}

export async function deleteMockup(formData: FormData) {
  const { profile } = await requireUser();
  if (!canWriteSales(profile.role)) throw new Error("Not permitted");
  const id = str(formData, "id");
  const supabase = await createClient();
  const { data } = await supabase.from("mockups").select("storage_path").eq("id", id).single();
  if (data?.storage_path) await supabase.storage.from("mockups").remove([data.storage_path]);
  await supabase.from("mockups").delete().eq("id", id);
  revalidatePath("/mockups");
}
