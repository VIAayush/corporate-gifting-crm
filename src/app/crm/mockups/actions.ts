'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registerMockup(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const fileUrl = String(formData.get('file_url') || '').trim()
  const fileName = String(formData.get('file_name') || '').trim() || fileUrl.split('/').pop() || 'mockup'
  if (!fileUrl) return { error: 'File URL is required' }

  const mime = String(formData.get('mime_type') || 'application/octet-stream')
  const allowed = ['image/', 'application/pdf']
  if (!allowed.some((prefix) => mime.startsWith(prefix) || mime === 'application/octet-stream')) {
    return { error: 'Only images and PDFs are accepted' }
  }

  const visibility = String(formData.get('visibility') || 'internal')
  const { error } = await supabase.from('mockups').insert({
    requirement_id: String(formData.get('requirement_id') || '') || null,
    order_id: String(formData.get('order_id') || '') || null,
    product_id: String(formData.get('product_id') || '') || null,
    file_name: fileName,
    storage_path: fileUrl,
    mime_type: mime,
    status: visibility === 'client' ? 'shared' : 'draft',
    uploaded_by: user.id,
  })
  if (error) return { error: error.message }
  revalidatePath('/crm/mockups')
  revalidatePath('/portal/documents')
  return { success: true }
}
