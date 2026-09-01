'use server'

import { createClient } from '@/lib/supabase/server'

export async function createQuotation(data: any) { return { success: true } }
export async function updateQuotationStatus(id: string, status: string) { return { success: true } }
export async function convertToOrder(quotationId: string) {
  const supabase = await createClient()
  await supabase.rpc('convert_quotation_to_order', { p_quotation_id: quotationId })
  return { success: true }
}
export async function addQuotationItem(data: any) { return { success: true } }
export async function removeQuotationItem(id: string) { return { success: true } }
