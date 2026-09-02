'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
export async function updateQuotationStatus(quotationId: string, newStatus: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase.from('quotations').update({ status: newStatus }).eq('id', quotationId)
  if (error) return { error: error.message }
  revalidatePath(`/crm/quotations/${quotationId}`)
  return { success: true }
}
export async function convertToOrder(quotationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase.rpc('convert_quotation_to_order', { p_quotation_id: quotationId })
  if (error) return { error: error.message }
  redirect(`/crm/orders/${data}`)
}
export async function duplicateQuotation(quotationId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('duplicate_quotation', { p_quotation_id: quotationId })
  if (error) return { error: error.message }
  redirect(`/crm/quotations/${data}`)
}
