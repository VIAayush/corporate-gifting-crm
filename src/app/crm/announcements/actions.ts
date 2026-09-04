'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'

export async function createAnnouncement(formData: FormData) {
  const profile = await getProfile()
  if (!profile) return { error: 'Not authenticated' }
  if (!['admin', 'management'].includes(profile.role)) {
    return { error: 'Not permitted to post announcements' }
  }

  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()
  if (!title || !body) return { error: 'Title and message are required' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, body, created_by: profile.id })
    .select('id')
    .single()
  if (error) return { error: error.message }

  await writeAudit(supabase, {
    action: 'create',
    entity: 'announcements',
    entityId: data.id,
    next: { title },
    userId: profile.id,
  })

  revalidatePath('/crm/announcements')
  return { success: true }
}
