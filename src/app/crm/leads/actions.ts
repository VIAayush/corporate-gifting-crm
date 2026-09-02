'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
export async function updateLeadStage(leadId: string, newStage: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase.from('leads').update({ stage: newStage }).eq('id', leadId)
  if (error) return { error: error.message }
  return { success: true }
}
export async function createLead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await supabase.from('leads').insert({
    company_id: formData.get('company_id') as string,
    contact_id: formData.get('contact_id') as string || null,
    owner_id: formData.get('owner_id') as string || user.id,
    source: formData.get('source') as string || null,
    stage: 'cold',
    estimated_value: formData.get('estimated_value') ? Number(formData.get('estimated_value')) : null,
    notes: formData.get('notes') as string || null,
  }).select('id').single()
  if (error) return { error: error.message }
  redirect(`/crm/leads/${data.id}`)
}
