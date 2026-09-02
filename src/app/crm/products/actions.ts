'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const sku = formData.get('sku') as string
  const category_id = (formData.get('category_id') as string) || null
  const brand_id = (formData.get('brand_id') as string) || null
  const supplier_id = (formData.get('supplier_id') as string) || null
  const description = (formData.get('description') as string) || null
  const price = parseFloat(formData.get('price') as string) || 0
  const supplier_cost = formData.get('supplier_cost') ? parseFloat(formData.get('supplier_cost') as string) : null
  const internal_margin = formData.get('internal_margin') ? parseFloat(formData.get('internal_margin') as string) : null
  const moq = parseInt(formData.get('moq') as string, 10) || 1
  const image_url = (formData.get('image_url') as string) || null
  const status = (formData.get('status') as string) || 'active'
  const catalogue_access = (formData.get('catalogue_access') as string) || 'all'
  const selectedCompanies = formData.getAll('company_ids') as string[]

  if (!name || !sku) {
    return { error: 'Product name and SKU are required' }
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name,
      sku: sku.trim().toUpperCase(),
      category_id,
      brand_id,
      supplier_id,
      description,
      price,
      supplier_cost,
      internal_margin,
      moq,
      image_url,
      status,
      catalogue_access,
      visibility: catalogue_access === 'all' ? 'catalogue' : (catalogue_access === 'selected' ? 'selected_companies' : 'internal_only'),
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  if (catalogue_access === 'selected' && selectedCompanies.length > 0) {
    const accessRows = selectedCompanies.map(cId => ({
      product_id: product.id,
      company_id: cId,
    }))
    await supabase.from('company_product_access').insert(accessRows)
  }

  revalidatePath('/crm/products')
  revalidatePath('/portal/catalogue')
  redirect('/crm/products/' + product.id)
}

export async function updateProduct(productId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const name = formData.get('name') as string
  const sku = formData.get('sku') as string
  const category_id = (formData.get('category_id') as string) || null
  const brand_id = (formData.get('brand_id') as string) || null
  const supplier_id = (formData.get('supplier_id') as string) || null
  const description = (formData.get('description') as string) || null
  const price = parseFloat(formData.get('price') as string) || 0
  const supplier_cost = formData.get('supplier_cost') ? parseFloat(formData.get('supplier_cost') as string) : null
  const internal_margin = formData.get('internal_margin') ? parseFloat(formData.get('internal_margin') as string) : null
  const moq = parseInt(formData.get('moq') as string, 10) || 1
  const image_url = (formData.get('image_url') as string) || null
  const status = (formData.get('status') as string) || 'active'
  const catalogue_access = (formData.get('catalogue_access') as string) || 'all'

  const { error } = await supabase
    .from('products')
    .update({
      name,
      sku: sku.trim().toUpperCase(),
      category_id,
      brand_id,
      supplier_id,
      description,
      price,
      supplier_cost,
      internal_margin,
      moq,
      image_url,
      status,
      catalogue_access,
      visibility: catalogue_access === 'all' ? 'catalogue' : (catalogue_access === 'selected' ? 'selected_companies' : 'internal_only'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) return { error: error.message }

  revalidatePath('/crm/products/' + productId)
  revalidatePath('/crm/products')
  revalidatePath('/portal/catalogue')
  return { success: true }
}

export async function grantCompanyProductAccess(productId: string, companyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!companyId) return { error: 'Please select a company' }

  const { error: insertError } = await supabase
    .from('company_product_access')
    .upsert({ product_id: productId, company_id: companyId }, { onConflict: 'company_id,product_id' })

  if (insertError) return { error: insertError.message }

  await supabase
    .from('products')
    .update({ catalogue_access: 'selected', visibility: 'selected_companies' })
    .eq('id', productId)

  revalidatePath('/crm/products/' + productId)
  revalidatePath('/crm/companies/' + companyId)
  revalidatePath('/crm/products')
  revalidatePath('/portal/catalogue')
  return { success: true }
}

export async function revokeCompanyProductAccess(productId: string, companyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('company_product_access')
    .delete()
    .eq('product_id', productId)
    .eq('company_id', companyId)

  if (error) return { error: error.message }

  revalidatePath('/crm/products/' + productId)
  revalidatePath('/crm/companies/' + companyId)
  revalidatePath('/crm/products')
  revalidatePath('/portal/catalogue')
  return { success: true }
}
