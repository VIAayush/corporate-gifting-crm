'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const title = String(formData.get('title') || '').trim()
  if (!title) return { error: 'Title is required' }

  const { error } = await supabase.from('tasks').insert({
    title,
    description: String(formData.get('description') || '') || null,
    assigned_to: String(formData.get('assigned_to') || '') || user.id,
    created_by: user.id,
    due_at: String(formData.get('due_at') || '') || null,
    priority: Number(formData.get('priority') || 2),
    status: 'open',
  })
  if (error) return { error: error.message }
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
