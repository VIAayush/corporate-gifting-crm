'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'

const LOGO_BUCKET = 'company-logos'
const MAX_LOGO_BYTES = 2 * 1024 * 1024
// SVG is intentionally excluded: it can carry script, and these files are served
// from a public bucket. The bucket itself still permits it for other tooling.
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

async function requireCompanyEditor() {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' as const }
  if (!['admin', 'sales'].includes(profile.role)) {
    return { error: 'Not permitted to manage companies' as const }
  }
  return { profile }
}
export async function createCompany(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase.from('companies').insert({
    name: formData.get('name') as string,
    industry: formData.get('industry') as string || null,
    website: formData.get('website') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    country: (formData.get('country') as string) || 'India',
    address: formData.get('address') as string || null,
    notes: formData.get('notes') as string || null,
    owner_id: user.id,
    status: 'active',
  }).select('id').single()
  if (error) return { error: error.message }
  redirect(`/crm/companies/${data.id}`)
}
export async function updateCompany(companyId: string, formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('companies').update({
    name: formData.get('name') as string,
    industry: formData.get('industry') as string || null,
    website: formData.get('website') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    country: formData.get('country') as string || null,
    address: formData.get('address') as string || null,
    notes: formData.get('notes') as string || null,
  }).eq('id', companyId)
  if (error) return { error: error.message }
  redirect(`/crm/companies/${companyId}`)
}

export async function uploadCompanyLogo(formData: FormData) {
  const access = await requireCompanyEditor()
  if ('error' in access) return { error: access.error }

  const companyId = String(formData.get('company_id') || '')
  const file = formData.get('logo')
  if (!companyId) return { error: 'Company is required' }
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a logo image to upload' }

  const extension = ALLOWED_LOGO_TYPES[file.type]
  if (!extension) return { error: 'Logo must be a PNG, JPG or WebP image' }
  if (file.size > MAX_LOGO_BYTES) return { error: 'Logo must be 2 MB or smaller' }

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('logo_path')
    .eq('id', companyId)
    .maybeSingle()
  if (!company) return { error: 'Company not found' }

  const objectPath = `${companyId}/${Date.now()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(objectPath, file, { contentType: file.type, upsert: false })
  if (uploadError) return { error: uploadError.message }

  const { error: updateError } = await supabase
    .from('companies')
    .update({ logo_path: objectPath })
    .eq('id', companyId)
  if (updateError) {
    // Do not leave an orphaned object behind if the row could not be updated.
    await supabase.storage.from(LOGO_BUCKET).remove([objectPath])
    return { error: updateError.message }
  }

  if (company.logo_path && company.logo_path !== objectPath) {
    await supabase.storage.from(LOGO_BUCKET).remove([company.logo_path])
  }

  revalidatePath(`/crm/companies/${companyId}`)
  revalidatePath('/crm/companies')
  return { success: true }
}

export async function removeCompanyLogo(formData: FormData) {
  const access = await requireCompanyEditor()
  if ('error' in access) return { error: access.error }

  const companyId = String(formData.get('company_id') || '')
  if (!companyId) return { error: 'Company is required' }

  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('logo_path')
    .eq('id', companyId)
    .maybeSingle()
  if (!company) return { error: 'Company not found' }

  const { error } = await supabase.from('companies').update({ logo_path: null }).eq('id', companyId)
  if (error) return { error: error.message }

  if (company.logo_path) {
    await supabase.storage.from(LOGO_BUCKET).remove([company.logo_path])
  }

  revalidatePath(`/crm/companies/${companyId}`)
  revalidatePath('/crm/companies')
  return { success: true }
}
