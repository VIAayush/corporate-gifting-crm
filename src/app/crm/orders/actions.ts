'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
export async function advanceOrderStatus(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase.rpc('advance_order_stage', { p_order_id: orderId })
  if (error) return { error: error.message }
  revalidatePath(`/crm/orders/${orderId}`)
  return { success: true }
}
export async function assignSupplier(orderId: string, supplierId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ supplier_id: supplierId }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/crm/orders/${orderId}`)
  return { success: true }
}
export async function assignCourier(orderId: string, courierId: string, trackingNumber?: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ courier_partner_id: courierId, tracking_number: trackingNumber || null }).eq('id', orderId)
  if (error) return { error: error.message }
  revalidatePath(`/crm/orders/${orderId}`)
  return { success: true }
}
