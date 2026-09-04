'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContact(formData: FormData) {
  const supabase = await createClient()
  const fullName = String(formData.get('full_name') || '').trim()
  const companyId = String(formData.get('company_id') || '')
  if (!fullName || !companyId) return { error: 'Name and company are required' }

  const { error } = await supabase.from('contacts').insert({
    full_name: fullName,
    company_id: companyId,
    designation: String(formData.get('designation') || '') || null,
    email: String(formData.get('email') || '') || null,
    phone: String(formData.get('phone') || '') || null,
    contact_type: String(formData.get('contact_type') || 'primary'),
    kind: 'corporate',
    notes: String(formData.get('notes') || '') || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/crm/contacts')
  revalidatePath(`/crm/companies/${companyId}`)
  return { success: true }
}
