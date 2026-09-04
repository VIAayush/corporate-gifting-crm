'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getProfile } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'

export async function createTask(formData: FormData) {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' }

  const supabase = await createClient()
  const title = String(formData.get('title') || '').trim()
  if (!title) return { error: 'Title is required' }

  const assignedTo = String(formData.get('assigned_to') || '') || profile.id
  const { data, error } = await supabase.from('tasks').insert({
    title,
    description: String(formData.get('description') || '') || null,
    assigned_to: assignedTo,
    created_by: profile.id,
    due_at: String(formData.get('due_at') || '') || null,
    priority: Number(formData.get('priority') || 2),
    status: 'open',
  }).select('id').single()
  if (error) return { error: error.message }
  await writeAudit(supabase, {
    action: 'create',
    entity: 'tasks',
    entityId: data.id,
    next: { title, assigned_to: assignedTo },
    userId: profile.id,
  })
  revalidatePath('/crm/tasks')
  revalidatePath('/crm/my-work')
  return { success: true }
}

export async function completeTask(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id') || '')
  const { error } = await supabase.from('tasks').update({
    status: 'done',
    completed_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/crm/tasks')
  revalidatePath('/crm/my-work')
  return { success: true }
}
