'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createPortalRequirement(formData: {
  name: string
  purpose: string
  description: string
  budget_per_unit: string
  quantity: string
  deadline: string
  delivery_city: string
  products: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get client's company
  const { data: companyId } = await supabase.rpc('client_company_id')
  if (!companyId) return { error: 'Company not found' }

  const budget = formData.budget_per_unit ? parseFloat(formData.budget_per_unit) : null
  const quantity = formData.quantity ? parseInt(formData.quantity, 10) : null

  const { data: requirement, error } = await supabase
    .from('requirements')
    .insert({
      name: formData.name,
      company_id: companyId,
      owner_id: user.id,
      purpose: formData.purpose,
      description: formData.description,
      budget: budget,
      quantity: quantity,
      deadline: formData.deadline || null,
      delivery_city: formData.delivery_city || null,
      status: 'active',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // If products (SKUs) provided, link them to requirement
  if (formData.products.length > 0 && requirement) {
    const { data: products } = await supabase
      .from('products')
      .select('id, sku')
      .in('sku', formData.products)

    if (products && products.length > 0) {
      await supabase.from('requirement_products').insert(
        products.map(p => ({ requirement_id: requirement.id, product_id: p.id }))
      )
    }
  }

  return { success: true, id: requirement?.id }
}

export async function respondToQuotation(quotationId: string, status: 'accepted' | 'rejected', comment?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: companyId } = await supabase.rpc('client_company_id')
  const { data: quotation } = await supabase
    .from('quotations')
    .select('company_id, status')
    .eq('id', quotationId)
    .single()

  if (!quotation || quotation.company_id !== companyId) {
    return { error: 'Quotation not found' }
  }
  if (quotation.status !== 'sent') {
    return { error: 'Quotation cannot be responded to in its current state' }
  }

  const { error } = await supabase.rpc('client_respond_quotation', {
    p_quotation_id: quotationId,
    p_status: status,
    p_comment: comment || null,
  })

  if (error) return { error: error.message }
  return { success: true }
}
