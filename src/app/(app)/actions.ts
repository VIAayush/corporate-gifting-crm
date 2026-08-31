"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { canWriteCrm, canWriteFinance, canWriteOps, canWriteSales } from "@/lib/rbac";

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

async function assert(ok: boolean, message = "You do not have permission to do that.") {
  if (!ok) throw new Error(message);
}

export async function createCompany(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("companies")
    .insert({
      name: str(formData, "name"),
      industry: str(formData, "industry"),
      website: str(formData, "website"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      country: str(formData, "country") || "India",
      status: str(formData, "status") || "prospect",
      owner_id: str(formData, "owner_id") || profile.id,
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();
  if (error) redirect(`/companies?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/companies");
  redirect(`/companies/${data.id}`);
}

export async function updateCompany(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({
      name: str(formData, "name"),
      industry: str(formData, "industry"),
      website: str(formData, "website"),
      address: str(formData, "address"),
      city: str(formData, "city"),
      state: str(formData, "state"),
      country: str(formData, "country") || "India",
      status: str(formData, "status"),
      owner_id: str(formData, "owner_id"),
      notes: str(formData, "notes"),
    })
    .eq("id", id);
  if (error) redirect(`/companies/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

export async function createBranch(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const companyId = str(formData, "company_id");
  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({
    company_id: companyId,
    name: str(formData, "name"),
    address: str(formData, "address"),
    city: str(formData, "city"),
    state: str(formData, "state"),
    is_head_office: formData.get("is_head_office") === "on",
  });
  if (error) redirect(`/companies/${companyId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/companies/${companyId}`);
}

export async function createContact(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const email = str(formData, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(`/contacts?error=${encodeURIComponent("Enter a valid email")}`);
  }
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("contacts")
    .insert({
      company_id: str(formData, "company_id"),
      branch_id: str(formData, "branch_id"),
      full_name: str(formData, "full_name"),
      designation: str(formData, "designation"),
      email,
      phone: str(formData, "phone"),
      contact_type: str(formData, "contact_type") || "primary",
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();
  if (error) redirect(`/contacts?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/contacts");
  redirect(`/contacts/${data.id}`);
}

export async function updateContact(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      full_name: str(formData, "full_name"),
      designation: str(formData, "designation"),
      email: str(formData, "email"),
      phone: str(formData, "phone"),
      contact_type: str(formData, "contact_type"),
      notes: str(formData, "notes"),
      company_id: str(formData, "company_id"),
      branch_id: str(formData, "branch_id"),
    })
    .eq("id", id);
  if (error) redirect(`/contacts/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/contacts/${id}`);
}

export async function createLead(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("leads")
    .insert({
      company_id: str(formData, "company_id"),
      contact_id: str(formData, "contact_id"),
      owner_id: str(formData, "owner_id") || profile.id,
      source: str(formData, "source") || "inbound",
      stage: str(formData, "stage") || "cold",
      estimated_value: num(formData, "estimated_value") || 0,
      expected_conversion_date: str(formData, "expected_conversion_date"),
      notes: str(formData, "notes"),
      next_follow_up_at: str(formData, "next_follow_up_at"),
    })
    .select("id")
    .single();
  if (error) redirect(`/leads?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

export async function updateLead(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      company_id: str(formData, "company_id"),
      contact_id: str(formData, "contact_id"),
      owner_id: str(formData, "owner_id"),
      source: str(formData, "source"),
      stage: str(formData, "stage"),
      estimated_value: num(formData, "estimated_value") || 0,
      expected_conversion_date: str(formData, "expected_conversion_date"),
      notes: str(formData, "notes"),
      next_follow_up_at: str(formData, "next_follow_up_at"),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) redirect(`/leads/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
}

export async function createRequirement(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const qty = num(formData, "quantity") || 1;
  if (qty < 1) redirect("/requirements?error=Quantity must be at least 1");
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("requirements")
    .insert({
      name: str(formData, "name"),
      company_id: str(formData, "company_id"),
      contact_id: str(formData, "contact_id"),
      lead_id: str(formData, "lead_id"),
      owner_id: str(formData, "owner_id") || profile.id,
      quantity: qty,
      budget: num(formData, "budget"),
      deadline: str(formData, "deadline"),
      delivery_city: str(formData, "delivery_city"),
      purpose: str(formData, "purpose"),
      payment_terms: str(formData, "payment_terms"),
      description: str(formData, "description"),
      revenue_opportunity: num(formData, "revenue_opportunity") || 0,
      status: str(formData, "status") || "draft",
    })
    .select("id")
    .single();
  if (error) redirect(`/requirements?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/requirements");
  redirect(`/requirements/${data.id}`);
}

export async function updateRequirement(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteCrm(profile.role));
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("requirements")
    .update({
      name: str(formData, "name"),
      quantity: num(formData, "quantity") || 1,
      budget: num(formData, "budget"),
      deadline: str(formData, "deadline"),
      delivery_city: str(formData, "delivery_city"),
      purpose: str(formData, "purpose"),
      payment_terms: str(formData, "payment_terms"),
      description: str(formData, "description"),
      revenue_opportunity: num(formData, "revenue_opportunity") || 0,
      status: str(formData, "status"),
      owner_id: str(formData, "owner_id"),
    })
    .eq("id", id);
  if (error) redirect(`/requirements/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/requirements/${id}`);
}

export async function addRequirementProduct(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteSales(profile.role));
  const requirementId = str(formData, "requirement_id");
  const supabase = await createClient();
  const { error } = await supabase.from("requirement_products").insert({
    requirement_id: requirementId,
    product_id: str(formData, "product_id"),
    quantity: num(formData, "quantity") || 1,
  });
  if (error) redirect(`/requirements/${requirementId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/requirements/${requirementId}`);
}

export async function createProduct(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteSales(profile.role));
  const price = num(formData, "price");
  if (price == null || price < 0) redirect("/products?error=Enter a valid price");
  const supabase = await createClient();
  const { error, data } = await supabase
    .from("products")
    .insert({
      name: str(formData, "name"),
      brand_id: str(formData, "brand_id"),
      category_id: str(formData, "category_id"),
      subcategory_id: str(formData, "subcategory_id"),
      description: str(formData, "description"),
      price,
      moq: num(formData, "moq") || 1,
      hsn_code: str(formData, "hsn_code"),
      supplier_id: str(formData, "supplier_id"),
      status: str(formData, "status") || "active",
    })
    .select("id")
    .single();
  if (error) redirect(`/products?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/products");
  redirect(`/products/${data.id}`);
}

export async function updateProduct(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteSales(profile.role));
  const id = str(formData, "id");
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({
      name: str(formData, "name"),
      description: str(formData, "description"),
      price: num(formData, "price"),
      moq: num(formData, "moq") || 1,
      hsn_code: str(formData, "hsn_code"),
      supplier_id: str(formData, "supplier_id"),
      category_id: str(formData, "category_id"),
      brand_id: str(formData, "brand_id"),
      status: str(formData, "status"),
    })
    .eq("id", id);
  if (error) redirect(`/products/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/products/${id}`);
}

export async function createVendor(table: "suppliers" | "printing_vendors" | "courier_partners", formData: FormData, path: string) {
  const { profile } = await requireUser();
  await assert(canWriteOps(profile.role));
  const supabase = await createClient();
  const payload: Record<string, unknown> = {
    name: str(formData, "name"),
    contact_person: str(formData, "contact_person"),
    email: str(formData, "email"),
    phone: str(formData, "phone"),
    notes: str(formData, "notes"),
  };
  if (table === "suppliers") {
    payload.city = str(formData, "city");
    payload.category = str(formData, "category");
    payload.credit_period_days = num(formData, "credit_period_days") || 0;
  } else {
    payload.service_type = str(formData, "service_type");
  }
  const { error } = await supabase.from(table).insert(payload);
  if (error) redirect(`${path}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(path);
  redirect(path);
}

export async function createSupplier(formData: FormData) {
  await createVendor("suppliers", formData, "/suppliers");
}
export async function createPrintingVendor(formData: FormData) {
  await createVendor("printing_vendors", formData, "/printing-vendors");
}
export async function createCourier(formData: FormData) {
  await createVendor("courier_partners", formData, "/couriers");
}

export async function createActivity(formData: FormData) {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    title: str(formData, "title"),
    type: str(formData, "type") || "follow_up",
    due_at: str(formData, "due_at"),
    assigned_to: str(formData, "assigned_to") || profile.id,
    related_type: str(formData, "related_type"),
    related_id: str(formData, "related_id"),
    notes: str(formData, "notes"),
    created_by: profile.id,
    status: str(formData, "status") || "upcoming",
  });
  if (error) redirect(`/activities?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/activities");
  redirect("/activities");
}

export async function completeActivity(formData: FormData) {
  await requireUser();
  const id = str(formData, "id");
  const supabase = await createClient();
  await supabase.from("activities").update({ status: "completed" }).eq("id", id);
  revalidatePath("/activities");
}

export async function createInvoice(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteFinance(profile.role));
  const supabase = await createClient();
  const { data: number } = await supabase.rpc("next_invoice_number");
  const orderId = str(formData, "order_id");
  const { data: order } = await supabase.from("orders").select("company_id, order_value").eq("id", orderId).single();
  const amount = num(formData, "amount") || Number(order?.order_value || 0);
  if (amount <= 0) redirect("/invoices?error=Amount must be greater than 0");
  const { error, data } = await supabase
    .from("invoices")
    .insert({
      invoice_number: number,
      order_id: orderId,
      company_id: order?.company_id,
      invoice_date: str(formData, "invoice_date") || new Date().toISOString().slice(0, 10),
      due_date: str(formData, "due_date"),
      amount,
      notes: str(formData, "notes"),
    })
    .select("id")
    .single();
  if (error) redirect(`/invoices?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}`);
}

export async function createPayment(formData: FormData) {
  const { profile } = await requireUser();
  await assert(canWriteFinance(profile.role));
  const amount = num(formData, "amount");
  if (!amount || amount <= 0) redirect("/payments?error=Enter a valid amount");
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    invoice_id: str(formData, "invoice_id"),
    payment_date: str(formData, "payment_date") || new Date().toISOString().slice(0, 10),
    amount,
    method: str(formData, "method") || "bank_transfer",
    reference: str(formData, "reference"),
    notes: str(formData, "notes"),
    created_by: profile.id,
  });
  if (error) redirect(`/payments?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/payments");
  revalidatePath("/invoices");
  revalidatePath("/receivables");
  redirect("/payments");
}

export async function updateTeamRole(formData: FormData) {
  const { profile } = await requireUser();
  await assert(profile.role === "admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: str(formData, "role"), is_active: formData.get("is_active") === "on" })
    .eq("id", str(formData, "id"));
  if (error) redirect(`/team?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/team");
}

export { canWriteCrm, canWriteOps, canWriteFinance, canWriteSales };
