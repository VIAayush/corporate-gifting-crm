'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'

const SAMPLE_ROLES = ['admin', 'sales', 'operations'] as const

async function requireSampleAccess() {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' as const }
  if (!SAMPLE_ROLES.includes(profile.role as (typeof SAMPLE_ROLES)[number])) {
    return { error: 'Not permitted to manage samples' as const }
  }
  return { profile }
}

const HOLDERS = {
  office: 'in_office',
  team: 'with_team',
  client: 'with_client',
  supplier: 'pending_supplier',
} as const

type Holder = keyof typeof HOLDERS

export async function receiveSample(formData: FormData) {
  const access = await requireSampleAccess()
  if ('error' in access) return { error: access.error }

  const supabase = await createClient()
  const productId = String(formData.get('product_id') || '')
  const quantity = Number(formData.get('quantity') || 0)
  const unitCost = Number(formData.get('unit_cost') || 0)
  if (!productId || !Number.isInteger(quantity) || quantity < 1) return { error: 'Product and a positive whole quantity are required' }
  if (!Number.isFinite(unitCost) || unitCost < 0) return { error: 'Unit cost cannot be negative' }

  const { data: existing } = await supabase.from('sample_stock').select('id, in_office, unit_cost').eq('product_id', productId).maybeSingle()
  if (existing) {
    const { error } = await supabase.from('sample_stock').update({
      in_office: (existing.in_office || 0) + quantity,
      unit_cost: unitCost || existing.unit_cost,
    }).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('sample_stock').insert({
      product_id: productId,
      in_office: quantity,
      with_team: 0,
      with_client: 0,
      pending_supplier: 0,
      unit_cost: unitCost || 0,
    })
    if (error) return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('sample_movements').insert({
    product_id: productId,
    quantity,
    from_holder: 'supplier',
    to_holder: 'office',
    cost: unitCost || 0,
    note: 'Received into office sample stock',
    created_by: user?.id,
  })
  revalidatePath('/crm/samples')
  return { success: true }
}

export async function moveSample(formData: FormData) {
  const access = await requireSampleAccess()
  if ('error' in access) return { error: access.error }

  const supabase = await createClient()
  const user = { id: access.profile.id }
  const stockId = String(formData.get('stock_id') || '')
  const from = String(formData.get('from_holder') || '') as Holder
  const to = String(formData.get('to_holder') || '') as Holder
  const quantity = Number(formData.get('quantity') || 0)
  const companyId = String(formData.get('company_id') || '') || null
  const note = String(formData.get('note') || '') || null
  if (!stockId || !(from in HOLDERS) || !(to in HOLDERS) || from === to || !Number.isInteger(quantity) || quantity < 1) {
    return { error: 'Valid movement details are required' }
  }
  if (to === 'client' && !companyId) return { error: 'Select the client receiving the sample' }

  const { data: stock } = await supabase.from('sample_stock').select('*').eq('id', stockId).single()
  if (!stock) return { error: 'Sample stock not found' }

  const stockRow = stock as Record<string, number | string | null>
  const fromCol = HOLDERS[from]
  const toCol = HOLDERS[to]
  const available = Number(stockRow[fromCol] || 0)
  if (available < quantity) return { error: `Only ${available} available at ${from}` }

  const { error } = await supabase.from('sample_stock').update({
    [fromCol]: available - quantity,
    [toCol]: Number(stockRow[toCol] || 0) + quantity,
  }).eq('id', stockId)
  if (error) return { error: error.message }

  await supabase.from('sample_movements').insert({
    product_id: stock.product_id,
    quantity,
    from_holder: from,
    to_holder: to,
    company_id: to === 'client' || from === 'client' ? companyId : null,
    cost: stock.unit_cost || 0,
    note,
    created_by: user?.id,
  })
  revalidatePath('/crm/samples')
  return { success: true }
}
