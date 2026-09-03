'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createReview(formData: FormData) {
  const supabase = await createClient()
  const companyId = String(formData.get('company_id') || '')
  const rating = Number(formData.get('rating') || 0)
  if (!companyId || rating < 1 || rating > 5) return { error: 'Company and rating are required' }

  const { error } = await supabase.from('reviews').insert({
    company_id: companyId,
    order_id: String(formData.get('order_id') || '') || null,
    rating,
    feedback: String(formData.get('feedback') || '') || null,
    status: 'published',
  })
  if (error) return { error: error.message }
  revalidatePath('/crm/reviews')
  return { success: true }
}
