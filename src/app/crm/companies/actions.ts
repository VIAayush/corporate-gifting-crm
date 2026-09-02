'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
