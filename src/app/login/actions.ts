'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isSafeNext, landingPathForRole } from '@/lib/safe-next'

export async function signIn(formData: FormData): Promise<{ error?: string } | undefined> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = formData.get('next') as string | null

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const home = landingPathForRole(profile?.role)
    if (isSafeNext(next)) {
      const isClient = profile?.role === 'client_admin' || profile?.role === 'client_user'
      const nextIsPortal = next.startsWith('/portal')
      const nextIsCrm = next.startsWith('/crm') || next.startsWith('/dashboard') || next === '/dashboard'
      if (isClient && nextIsPortal) redirect(next)
      if (!isClient && !nextIsPortal) redirect(next)
      if (!isClient && nextIsCrm) redirect(next)
    }
    redirect(home)
  }

  return { error: 'Failed to sign in' }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
