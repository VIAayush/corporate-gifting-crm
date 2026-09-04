'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { createAdminClient } from '@/lib/supabase/admin'

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
  const access = await requireCompanyEditor()
  if ('error' in access) return { error: access.error }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const ownerId =
    access.profile.role === 'admin'
      ? ((formData.get('owner_id') as string) || user.id)
      : user.id
  const { data, error } = await supabase.from('companies').insert({
    name: formData.get('name') as string,
    industry: formData.get('industry') as string || null,
    website: formData.get('website') as string || null,
    city: formData.get('city') as string || null,
    state: formData.get('state') as string || null,
    country: (formData.get('country') as string) || 'India',
    address: formData.get('address') as string || null,
    notes: formData.get('notes') as string || null,
    owner_id: ownerId,
    status: (formData.get('status') as string) || 'active',
  }).select('id').single()
  if (error) return { error: error.message }

  const file = formData.get('logo')
  if (file instanceof File && file.size > 0) {
    const extension = ALLOWED_LOGO_TYPES[file.type]
    if (extension && file.size <= MAX_LOGO_BYTES) {
      const objectPath = `${data.id}/${Date.now()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(objectPath, file, { contentType: file.type, upsert: false })
      if (!uploadError) {
        await supabase.from('companies').update({ logo_path: objectPath }).eq('id', data.id)
      }
    }
  }

  await writeAudit(supabase, {
    action: 'create',
    entity: 'companies',
    entityId: data.id,
    next: { name: formData.get('name'), owner_id: ownerId },
    userId: user.id,
  })

  redirect(`/crm/companies/${data.id}`)
}
export async function updateCompany(companyId: string, formData: FormData) {
  const access = await requireCompanyEditor()
  if ('error' in access) return { error: access.error }

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
  await writeAudit(supabase, {
    action: 'update',
    entity: 'companies',
    entityId: companyId,
    next: { name: formData.get('name') },
    userId: access.profile.id,
  })
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

  await writeAudit(supabase, {
    action: 'update',
    entity: 'companies',
    entityId: companyId,
    previous: { logo_path: company.logo_path },
    next: { logo_path: objectPath },
    userId: access.profile.id,
  })

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

  await writeAudit(supabase, {
    action: 'update',
    entity: 'companies',
    entityId: companyId,
    previous: { logo_path: company.logo_path },
    next: { logo_path: null },
    userId: access.profile.id,
  })

  revalidatePath(`/crm/companies/${companyId}`)
  revalidatePath('/crm/companies')
  return { success: true }
}

export async function createPortalClient(formData: FormData) {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' }
  if (profile.role !== 'admin') return { error: 'Only an admin can create client logins' }

  const companyId = String(formData.get('company_id') || '')
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') || '').trim()
  const role = String(formData.get('role') || 'client_user')
  const password = String(formData.get('password') || '')

  if (!companyId || !email || !fullName) {
    return { error: 'Name, email and company are required' }
  }
  if (role !== 'client_admin' && role !== 'client_user') {
    return { error: 'Invalid portal role' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters' }
  }

  const supabase = await createClient()
  const { data: company } = await supabase.from('companies').select('id, name').eq('id', companyId).maybeSingle()
  if (!company) return { error: 'Company not found' }

  const admin = createAdminClient()
  if (!admin) {
    return {
      error: 'Client login cannot be created until SUPABASE_SERVICE_ROLE_KEY is configured on the server.',
    }
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      company_id: companyId,
    },
  })
  if (error || !created.user) {
    return { error: error?.message || 'Could not create the client login' }
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      email,
      role,
      company_id: companyId,
      is_active: true,
    })
    .eq('id', created.user.id)
  if (profileError) {
    return { error: `Login was created but the company assignment failed: ${profileError.message}` }
  }

  await writeAudit(supabase, {
    action: 'create',
    entity: 'profiles',
    entityId: created.user.id,
    next: { email, role, company_id: companyId },
    userId: profile.id,
  })

  revalidatePath(`/crm/companies/${companyId}`)
  revalidatePath('/crm/team')
  return { success: true }
}
