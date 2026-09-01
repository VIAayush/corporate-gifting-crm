'use server'

import { createClient } from '@/lib/supabase/server'

export async function advanceOrderStatus(orderId: string) {
  const supabase = await createClient()
  await supabase.rpc('advance_order_stage', { p_order_id: orderId })
  return { success: true }
}
export async function assignSupplier(orderId: string, supplierId: string) { return { success: true } }
export async function assignPrintingVendor(orderId: string, vendorId: string) { return { success: true } }
export async function assignCourier(orderId: string, courierId: string) { return { success: true } }
export async function updateOrderCosts(orderId: string, costs: any) { return { success: true } }
